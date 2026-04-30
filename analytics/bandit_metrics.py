"""
bandit_metrics.py — Analytics service for the Bandit Observability Dashboard.

Reads from the unified `bandit_logs` MongoDB collection (written by
agent/bandit_log.py) and computes six observability metrics:

  1. get_reward_trend      — learning curve (avg reward over time)
  2. get_action_distribution — action frequency breakdown
  3. get_exploration_rate  — exploration vs exploitation ratio
  4. get_revenue_uplift    — avg and total actual_revenue − baseline_revenue
  5. get_context_performance — per (state_key, action) average reward
  6. get_regret            — best_possible_reward − actual_reward

All methods accept an optional `agent` filter ("revenue" | "retention" |
"upsell" | "followup" | None for cross-agent view).

MongoDB is used when available; the service falls back to scanning the
four agent JSONL log files if MongoDB is unreachable.
"""

from __future__ import annotations

import json
import os
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Iterable

AGENT_LOG_PATHS: dict[str, Path] = {
    "revenue":   Path(__file__).resolve().parents[1] / "agent" / "logs" / "revenue_agent_feedback.jsonl",
    "retention": Path(__file__).resolve().parents[1] / "agent" / "logs" / "retention_agent_feedback.jsonl",
    "upsell":    Path(__file__).resolve().parents[1] / "agent" / "logs" / "upsell_agent_feedback.jsonl",
    "followup":  Path(__file__).resolve().parents[1] / "agent" / "logs" / "followup_agent_feedback.jsonl",
}

DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB  = os.getenv("MONGO_DB_NAME", "hvac_software")
BANDIT_LOGS_COLLECTION = "bandit_logs"


class BanditMetricsService:
    """Compute bandit observability KPIs for the dashboard.

    Instantiation is cheap — no connections are made at __init__ time.
    """

    def __init__(
        self,
        mongo_uri: str | None = DEFAULT_MONGO_URI,
        mongo_db: str = DEFAULT_MONGO_DB,
    ) -> None:
        self.mongo_uri = mongo_uri
        self.mongo_db  = mongo_db

    # ── Public API ─────────────────────────────────────────────────────────────

    def get_summary(self, agent: str | None = None) -> dict[str, Any]:
        """Single-call KPI summary for the dashboard header cards.

        Returns:
          avg_reward      — mean reward across selected agent(s)
          exploration_rate — fraction of decisions that were exploratory
          top_action      — most frequently chosen action
          revenue_uplift  — total (actual − baseline) revenue uplift
          sample_size     — number of log entries included
        """
        logs = self._load_logs(agent=agent)
        if not logs:
            return _empty_summary()

        rewards    = [_num(r.get("reward")) for r in logs if _num(r.get("reward")) is not None]
        explorations = [r for r in logs if r.get("exploration") is True]
        uplift_rows  = [r for r in logs
                        if _num(r.get("actual_revenue")) is not None
                        and _num(r.get("baseline_revenue")) is not None]

        action_counts: dict[str, int] = defaultdict(int)
        for r in logs:
            if r.get("action"):
                action_counts[r["action"]] += 1
        top_action = max(action_counts, key=lambda a: action_counts[a]) if action_counts else None

        total_uplift = sum(
            float(r["actual_revenue"]) - float(r["baseline_revenue"])
            for r in uplift_rows
        )

        return {
            "avg_reward":       round(_mean(rewards), 4),
            "exploration_rate": round(len(explorations) / len(logs), 4) if logs else 0.0,
            "top_action":       top_action,
            "revenue_uplift":   round(total_uplift, 2),
            "sample_size":      len(logs),
        }

    def get_reward_trend(
        self,
        agent: str | None = None,
        days: int = 30,
    ) -> list[dict[str, Any]]:
        """Learning curve: average reward grouped by calendar day.

        Args:
          agent — filter to one agent, or None for all
          days  — how many most-recent days to include

        Returns list of {"date": "YYYY-MM-DD", "avg_reward": float, "count": int}
        sorted oldest → newest.

        A rising trend confirms the bandit is learning; a flat or falling
        trend indicates the policy has plateaued or is over-exploring.
        """
        mongo_result = self._mongo_reward_trend(agent=agent, days=days)
        if mongo_result is not None:
            return mongo_result

        logs = self._load_logs(agent=agent)
        grouped: dict[str, list[float]] = defaultdict(list)
        for row in logs:
            day = _date_key(row.get("timestamp"))
            reward = _num(row.get("reward"))
            if reward is not None:
                grouped[day].append(reward)

        points = sorted(grouped.items())[-days:]
        return [
            {"date": day, "avg_reward": round(_mean(rewards), 4), "count": len(rewards)}
            for day, rewards in points
        ]

    def get_action_distribution(
        self,
        agent: str | None = None,
    ) -> list[dict[str, Any]]:
        """Frequency breakdown of actions chosen by the bandit.

        Returns list of {"action": str, "count": int, "pct": float}
        sorted by count descending.

        Uneven distributions highlight whether the bandit is converging
        on specific actions (exploitation) or still spreading across the
        action space (exploration).
        """
        mongo_result = self._mongo_action_distribution(agent=agent)
        if mongo_result is not None:
            return mongo_result

        logs = self._load_logs(agent=agent)
        counts: dict[str, int] = defaultdict(int)
        for row in logs:
            if row.get("action"):
                counts[row["action"]] += 1

        total = sum(counts.values()) or 1
        return sorted(
            [
                {"action": a, "count": c, "pct": round(c / total, 4)}
                for a, c in counts.items()
            ],
            key=lambda x: x["count"],
            reverse=True,
        )

    def get_exploration_rate(
        self,
        agent: str | None = None,
        days: int = 30,
    ) -> dict[str, Any]:
        """Exploration vs exploitation ratio over time and in aggregate.

        Returns:
          overall_rate — fraction of all decisions that were exploratory
          trend        — list of {"date", "exploration_rate", "count"} by day

        A healthy rate sits around 0.15–0.25 early in deployment and
        should decay toward 0.05–0.10 as the bandit matures.
        """
        mongo_result = self._mongo_exploration_rate(agent=agent, days=days)
        if mongo_result is not None:
            return mongo_result

        logs = self._load_logs(agent=agent)
        total = len(logs)
        explored = sum(1 for r in logs if r.get("exploration") is True)

        daily: dict[str, list[bool]] = defaultdict(list)
        for row in logs:
            day = _date_key(row.get("timestamp"))
            daily[day].append(bool(row.get("exploration")))

        trend = sorted(
            [
                {
                    "date":             day,
                    "exploration_rate": round(sum(flags) / len(flags), 4),
                    "count":            len(flags),
                }
                for day, flags in daily.items()
            ],
            key=lambda x: x["date"],
        )[-days:]

        return {
            "overall_rate": round(explored / total, 4) if total else 0.0,
            "explored":     explored,
            "exploited":    total - explored,
            "total":        total,
            "trend":        trend,
        }

    def get_revenue_uplift(
        self,
        agent: str | None = None,
        days: int = 30,
    ) -> dict[str, Any]:
        """Revenue uplift: actual_revenue − baseline_revenue.

        Positive uplift means the bandit-driven action generated more
        revenue than the do-nothing baseline.  This is the primary
        business-value signal.

        Returns:
          avg_uplift   — mean uplift per decision
          total_uplift — cumulative uplift across all decisions
          trend        — list of {"date", "avg_uplift", "total_uplift"} by day
        """
        mongo_result = self._mongo_revenue_uplift(agent=agent, days=days)
        if mongo_result is not None:
            return mongo_result

        logs = self._load_logs(agent=agent)
        uplift_rows = [
            r for r in logs
            if _num(r.get("actual_revenue")) is not None
            and _num(r.get("baseline_revenue")) is not None
        ]

        uplifts = [
            float(r["actual_revenue"]) - float(r["baseline_revenue"])
            for r in uplift_rows
        ]

        daily: dict[str, list[float]] = defaultdict(list)
        for row in uplift_rows:
            day = _date_key(row.get("timestamp"))
            daily[day].append(float(row["actual_revenue"]) - float(row["baseline_revenue"]))

        trend = sorted(
            [
                {
                    "date":         day,
                    "avg_uplift":   round(_mean(vals), 2),
                    "total_uplift": round(sum(vals), 2),
                    "count":        len(vals),
                }
                for day, vals in daily.items()
            ],
            key=lambda x: x["date"],
        )[-days:]

        return {
            "avg_uplift":   round(_mean(uplifts), 2) if uplifts else 0.0,
            "total_uplift": round(sum(uplifts), 2) if uplifts else 0.0,
            "sample_size":  len(uplift_rows),
            "trend":        trend,
        }

    def get_context_performance(
        self,
        agent: str | None = None,
        min_samples: int = 1,
    ) -> list[dict[str, Any]]:
        """Per (state_key, action) average reward — the bandit's learned policy.

        Each row reveals which action works best in a given context bucket.
        Rows with high avg_reward and high visit counts are the bandit's
        most confident learned preferences.

        Args:
          min_samples — exclude rows with fewer observations (noise reduction)

        Returns list of {"state_key", "action", "avg_reward", "count"}
        sorted by avg_reward descending.
        """
        mongo_result = self._mongo_context_performance(agent=agent, min_samples=min_samples)
        if mongo_result is not None:
            return mongo_result

        logs = self._load_logs(agent=agent)
        buckets: dict[tuple, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))

        for row in logs:
            key  = tuple(row.get("state_key") or [])
            act  = str(row.get("action") or "")
            rew  = _num(row.get("reward"))
            if act and rew is not None:
                buckets[key][act].append(rew)

        results = []
        for state_key, action_rewards in buckets.items():
            for action, rewards in action_rewards.items():
                if len(rewards) >= min_samples:
                    results.append({
                        "state_key":  list(state_key),
                        "action":     action,
                        "avg_reward": round(_mean(rewards), 4),
                        "count":      len(rewards),
                    })

        results.sort(key=lambda x: x["avg_reward"], reverse=True)
        return results

    def get_regret(
        self,
        agent: str | None = None,
    ) -> dict[str, Any]:
        """Cumulative and average regret: best_possible_reward − actual_reward.

        Regret measures opportunity cost: how much reward the bandit left on
        the table vs the theoretical oracle that always picks the best action.

        The oracle best is estimated as the maximum observed reward per
        state_key bucket across all historical decisions.  This is an
        empirical upper bound (not a true oracle), so regret is a lower-bound
        estimate.

        Returns:
          total_regret   — sum of per-decision regret
          avg_regret     — mean per-decision regret
          regret_by_agent — per-agent breakdown (when agent=None)
          trend          — daily cumulative regret
        """
        logs = self._load_logs(agent=agent)
        if not logs:
            return {"total_regret": 0.0, "avg_regret": 0.0, "trend": [], "regret_by_agent": {}}

        # Build empirical best reward per state_key
        best_by_key: dict[tuple, float] = defaultdict(float)
        for row in logs:
            key = tuple(row.get("state_key") or [])
            rew = _num(row.get("reward"))
            if rew is not None and rew > best_by_key[key]:
                best_by_key[key] = rew

        regret_rows: list[tuple[str, float]] = []
        for row in logs:
            key = tuple(row.get("state_key") or [])
            rew = _num(row.get("reward"))
            if rew is not None:
                regret = max(0.0, best_by_key[key] - rew)
                regret_rows.append((_date_key(row.get("timestamp")), regret))

        daily_cumulative: dict[str, float] = defaultdict(float)
        daily_count: dict[str, int] = defaultdict(int)
        for day, regret in regret_rows:
            daily_cumulative[day] += regret
            daily_count[day] += 1

        trend = sorted(
            [
                {
                    "date":              day,
                    "daily_regret":      round(daily_cumulative[day], 4),
                    "count":             daily_count[day],
                    "avg_daily_regret":  round(daily_cumulative[day] / daily_count[day], 4),
                }
                for day in daily_cumulative
            ],
            key=lambda x: x["date"],
        )

        all_regrets = [r for _, r in regret_rows]

        # Per-agent breakdown only when querying all agents
        regret_by_agent: dict[str, float] = defaultdict(float)
        if agent is None:
            all_logs = self._load_logs(agent=None)
            agent_keys: dict[str, dict[tuple, float]] = defaultdict(lambda: defaultdict(float))
            for row in all_logs:
                ag  = str(row.get("agent") or "unknown")
                key = tuple(row.get("state_key") or [])
                rew = _num(row.get("reward"))
                if rew is not None and rew > agent_keys[ag][key]:
                    agent_keys[ag][key] = rew
            for row in all_logs:
                ag  = str(row.get("agent") or "unknown")
                key = tuple(row.get("state_key") or [])
                rew = _num(row.get("reward"))
                if rew is not None:
                    regret_by_agent[ag] += max(0.0, agent_keys[ag][key] - rew)
        regret_by_agent_rounded = {k: round(v, 2) for k, v in regret_by_agent.items()}

        return {
            "total_regret":    round(sum(all_regrets), 4),
            "avg_regret":      round(_mean(all_regrets), 4),
            "sample_size":     len(all_regrets),
            "regret_by_agent": regret_by_agent_rounded,
            "trend":           trend,
        }

    # ── Data loading ───────────────────────────────────────────────────────────

    def _load_logs(
        self,
        agent: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Load from bandit_logs (MongoDB preferred) or JSONL fallback."""
        mongo_logs = self._mongo_load_logs(agent=agent, limit=limit)
        if mongo_logs is not None:
            return mongo_logs
        return self._jsonl_load_logs(agent=agent, limit=limit)

    def _jsonl_load_logs(
        self,
        agent: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Read JSONL files from all applicable agents and normalise fields."""
        agents_to_read = [agent] if agent else list(AGENT_LOG_PATHS.keys())
        rows: list[dict[str, Any]] = []

        for ag in agents_to_read:
            path = AGENT_LOG_PATHS.get(ag)
            if not path or not path.exists():
                continue
            with path.open("r", encoding="utf-8") as fh:
                for line in fh:
                    try:
                        raw = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    rows.append(_normalise_jsonl_row(raw, ag))

        rows.sort(key=lambda r: str(r.get("timestamp", "")), reverse=True)
        if limit is not None:
            rows = rows[:limit]
        return rows

    # ── MongoDB queries ────────────────────────────────────────────────────────

    def _collection(self) -> Any | None:
        if not self.mongo_uri:
            return None
        try:
            from pymongo import MongoClient
            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=500)
            client.admin.command("ping")
            return client[self.mongo_db][BANDIT_LOGS_COLLECTION]
        except Exception:
            return None

    def _base_match(self, agent: str | None) -> dict[str, Any]:
        return {"agent": agent} if agent else {}

    def _mongo_load_logs(
        self,
        agent: str | None,
        limit: int | None,
    ) -> list[dict[str, Any]] | None:
        col = self._collection()
        if col is None:
            return None
        match = self._base_match(agent)
        cursor = col.find(match, {"_id": 0}).sort("timestamp", -1)
        if limit:
            cursor = cursor.limit(limit)
        return [_json_safe(r) for r in cursor]

    def _mongo_reward_trend(
        self,
        agent: str | None,
        days: int,
    ) -> list[dict[str, Any]] | None:
        col = self._collection()
        if col is None:
            return None
        pipeline = [
            *([] if not agent else [{"$match": {"agent": agent}}]),
            {
                "$addFields": {
                    "_ts": {
                        "$cond": [
                            {"$eq": [{"$type": "$timestamp"}, "date"]},
                            "$timestamp",
                            {"$dateFromString": {"dateString": "$timestamp"}},
                        ]
                    }
                }
            },
            {"$project": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$_ts"}}, "reward": 1}},
            {"$group": {"_id": "$date", "avg_reward": {"$avg": "$reward"}, "count": {"$sum": 1}}},
            {"$sort": {"_id": -1}},
            {"$limit": max(1, days)},
            {"$sort": {"_id": 1}},
        ]
        return [
            {"date": r["_id"], "avg_reward": round(float(r["avg_reward"]), 4), "count": int(r["count"])}
            for r in col.aggregate(pipeline)
        ]

    def _mongo_action_distribution(
        self,
        agent: str | None,
    ) -> list[dict[str, Any]] | None:
        col = self._collection()
        if col is None:
            return None
        pipeline = [
            *([] if not agent else [{"$match": {"agent": agent}}]),
            {"$group": {"_id": "$action", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        rows = list(col.aggregate(pipeline))
        total = sum(int(r["count"]) for r in rows) or 1
        return [
            {"action": str(r["_id"]), "count": int(r["count"]), "pct": round(int(r["count"]) / total, 4)}
            for r in rows
        ]

    def _mongo_exploration_rate(
        self,
        agent: str | None,
        days: int,
    ) -> dict[str, Any] | None:
        col = self._collection()
        if col is None:
            return None
        match = self._base_match(agent)
        pipeline_total = [
            *([] if not match else [{"$match": match}]),
            {
                "$group": {
                    "_id": None,
                    "total":    {"$sum": 1},
                    "explored": {"$sum": {"$cond": ["$exploration", 1, 0]}},
                }
            },
        ]
        rows = list(col.aggregate(pipeline_total))
        total    = int(rows[0]["total"])    if rows else 0
        explored = int(rows[0]["explored"]) if rows else 0

        # Daily trend
        pipeline_trend = [
            *([] if not match else [{"$match": match}]),
            {
                "$addFields": {
                    "_ts": {
                        "$cond": [
                            {"$eq": [{"$type": "$timestamp"}, "date"]},
                            "$timestamp",
                            {"$dateFromString": {"dateString": "$timestamp"}},
                        ]
                    }
                }
            },
            {"$project": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$_ts"}}, "exploration": 1}},
            {
                "$group": {
                    "_id":      "$date",
                    "explored": {"$sum": {"$cond": ["$exploration", 1, 0]}},
                    "count":    {"$sum": 1},
                }
            },
            {"$sort": {"_id": -1}},
            {"$limit": max(1, days)},
            {"$sort": {"_id": 1}},
        ]
        trend = [
            {
                "date":             r["_id"],
                "exploration_rate": round(int(r["explored"]) / int(r["count"]), 4),
                "count":            int(r["count"]),
            }
            for r in col.aggregate(pipeline_trend)
        ]

        return {
            "overall_rate": round(explored / total, 4) if total else 0.0,
            "explored":     explored,
            "exploited":    total - explored,
            "total":        total,
            "trend":        trend,
        }

    def _mongo_revenue_uplift(
        self,
        agent: str | None,
        days: int,
    ) -> dict[str, Any] | None:
        col = self._collection()
        if col is None:
            return None
        match: dict[str, Any] = {
            "actual_revenue":   {"$ne": None},
            "baseline_revenue": {"$ne": None},
        }
        if agent:
            match["agent"] = agent

        pipeline_total = [
            {"$match": match},
            {
                "$project": {
                    "uplift": {"$subtract": ["$actual_revenue", "$baseline_revenue"]}
                }
            },
            {
                "$group": {
                    "_id":          None,
                    "avg_uplift":   {"$avg": "$uplift"},
                    "total_uplift": {"$sum": "$uplift"},
                    "count":        {"$sum": 1},
                }
            },
        ]
        rows = list(col.aggregate(pipeline_total))

        pipeline_trend = [
            {"$match": match},
            {
                "$addFields": {
                    "_ts": {
                        "$cond": [
                            {"$eq": [{"$type": "$timestamp"}, "date"]},
                            "$timestamp",
                            {"$dateFromString": {"dateString": "$timestamp"}},
                        ]
                    },
                    "uplift": {"$subtract": ["$actual_revenue", "$baseline_revenue"]},
                }
            },
            {"$project": {"date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$_ts"}}, "uplift": 1}},
            {
                "$group": {
                    "_id":          "$date",
                    "avg_uplift":   {"$avg": "$uplift"},
                    "total_uplift": {"$sum": "$uplift"},
                    "count":        {"$sum": 1},
                }
            },
            {"$sort": {"_id": -1}},
            {"$limit": max(1, days)},
            {"$sort": {"_id": 1}},
        ]
        trend = [
            {
                "date":         r["_id"],
                "avg_uplift":   round(float(r["avg_uplift"]), 2),
                "total_uplift": round(float(r["total_uplift"]), 2),
                "count":        int(r["count"]),
            }
            for r in col.aggregate(pipeline_trend)
        ]

        if rows:
            return {
                "avg_uplift":   round(float(rows[0]["avg_uplift"]),   2),
                "total_uplift": round(float(rows[0]["total_uplift"]), 2),
                "sample_size":  int(rows[0]["count"]),
                "trend":        trend,
            }
        return {"avg_uplift": 0.0, "total_uplift": 0.0, "sample_size": 0, "trend": trend}

    def _mongo_context_performance(
        self,
        agent: str | None,
        min_samples: int,
    ) -> list[dict[str, Any]] | None:
        col = self._collection()
        if col is None:
            return None
        pipeline = [
            *([] if not agent else [{"$match": {"agent": agent}}]),
            {
                "$group": {
                    "_id":        {"state_key": "$state_key", "action": "$action"},
                    "avg_reward": {"$avg": "$reward"},
                    "count":      {"$sum": 1},
                }
            },
            {"$match": {"count": {"$gte": min_samples}}},
            {"$sort": {"avg_reward": -1}},
        ]
        return [
            {
                "state_key":  r["_id"]["state_key"],
                "action":     str(r["_id"]["action"]),
                "avg_reward": round(float(r["avg_reward"]), 4),
                "count":      int(r["count"]),
            }
            for r in col.aggregate(pipeline)
        ]


# ── Module-level convenience wrappers ──────────────────────────────────────────

def get_summary(agent: str | None = None) -> dict[str, Any]:
    """GET /bandit/summary"""
    return BanditMetricsService().get_summary(agent=agent)


def get_reward_trend(agent: str | None = None, days: int = 30) -> list[dict[str, Any]]:
    """GET /bandit/reward-trend"""
    return BanditMetricsService().get_reward_trend(agent=agent, days=days)


def get_action_distribution(agent: str | None = None) -> list[dict[str, Any]]:
    """GET /bandit/actions"""
    return BanditMetricsService().get_action_distribution(agent=agent)


def get_exploration_rate(agent: str | None = None, days: int = 30) -> dict[str, Any]:
    """GET /bandit/exploration"""
    return BanditMetricsService().get_exploration_rate(agent=agent, days=days)


def get_revenue_uplift(agent: str | None = None, days: int = 30) -> dict[str, Any]:
    """GET /bandit/revenue-impact"""
    return BanditMetricsService().get_revenue_uplift(agent=agent, days=days)


def get_context_performance(agent: str | None = None) -> list[dict[str, Any]]:
    """GET /bandit/context-performance"""
    return BanditMetricsService().get_context_performance(agent=agent)


def get_regret(agent: str | None = None) -> dict[str, Any]:
    """GET /bandit/regret"""
    return BanditMetricsService().get_regret(agent=agent)


# ── Internal helpers ───────────────────────────────────────────────────────────

def _normalise_jsonl_row(raw: dict[str, Any], agent: str) -> dict[str, Any]:
    """Map agent-specific JSONL field names to the unified bandit_logs schema."""
    # Upsell uses "upsell" instead of "action"
    action = raw.get("action") or raw.get("upsell") or ""
    # Upsell uses "upsell_revenue" instead of "actual_revenue"
    actual_rev = _num(raw.get("actual_revenue") or raw.get("upsell_revenue"))
    baseline   = _num(raw.get("baseline_revenue"))
    return {
        "agent":            agent,
        "timestamp":        raw.get("timestamp", ""),
        "state":            raw.get("state", {}),
        "state_key":        [],   # JSONL files don't persist state_key
        "action":           str(action),
        "exploration":      bool(not raw.get("bandit_selected", False)),
        "reward":           _num(raw.get("reward")) or 0.0,
        "actual_revenue":   actual_rev,
        "baseline_revenue": baseline,
        "customer_id":      raw.get("customer_id"),
    }


def _mean(values: Iterable[float]) -> float:
    lst = list(values)
    return sum(lst) / len(lst) if lst else 0.0


def _num(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _date_key(value: Any) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date().isoformat()
        except ValueError:
            return value[:10]
    return "unknown"


def _json_safe(row: dict[str, Any]) -> dict[str, Any]:
    safe = dict(row)
    for k, v in list(safe.items()):
        if isinstance(v, datetime):
            safe[k] = v.isoformat()
    return safe


def _empty_summary() -> dict[str, Any]:
    return {
        "avg_reward":       0.0,
        "exploration_rate": 0.0,
        "top_action":       None,
        "revenue_uplift":   0.0,
        "sample_size":      0,
    }
