"""
bandit_log.py — Centralized bandit decision logger for multi-agent observability.

Every agent calls log_bandit_decision() at the end of its run so that the
observability dashboard has a single queryable collection (`bandit_logs`) that
covers all four agents (revenue, retention, upsell, followup).

Design constraints:
  - MongoDB write is non-blocking: never adds latency to the agent loop.
  - Falls back silently if MongoDB is unavailable (JSONL still captures data).
  - Does not depend on any agent-specific module — this module is a leaf.

MongoDB document schema (bandit_logs):
  {
    "agent":            str,    # "revenue" | "retention" | "upsell" | "followup"
    "timestamp":        datetime,
    "state":            dict,   # full raw state snapshot
    "state_key":        list,   # bandit's discrete bucket key (tuple→list for JSON)
    "action":           str,    # chosen action (normalised across agents)
    "exploration":      bool,   # True = random ε-greedy draw, False = greedy argmax
    "reward":           float,
    "actual_revenue":   float | None,
    "baseline_revenue": float | None,
    "customer_id":      str | None,
  }
"""

from __future__ import annotations

import logging
import os
from datetime import UTC, datetime
from threading import Thread
from typing import Any, Mapping

logger = logging.getLogger(__name__)

DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB  = os.getenv("MONGO_DB_NAME", "hvac_software")
BANDIT_LOGS_COLLECTION = "bandit_logs"


def log_bandit_decision(
    *,
    agent: str,
    bandit: Any,
    state: Mapping[str, Any],
    action: str,
    reward: float,
    actual_revenue: float | None = None,
    baseline_revenue: float | None = None,
    customer_id: str | None = None,
    mongo_uri: str | None = DEFAULT_MONGO_URI,
    mongo_db: str = DEFAULT_MONGO_DB,
) -> dict[str, Any]:
    """Build a normalised bandit log entry and persist it non-blocking.

    Exploration is determined by comparing the chosen action to the greedy
    argmax of the bandit's Q-table for this state bucket.  When the chosen
    action differs from the greedy best, the decision was exploratory.
    Note: random exploration that coincidentally picks the greedy action is
    classified as exploitation — acceptable for observability purposes.

    Returns the log entry dict (always, even when MongoDB is unavailable).
    """
    state_key = _get_state_key(bandit, state)
    exploration = _is_exploration(bandit, state_key, action)

    entry: dict[str, Any] = {
        "agent":            agent,
        "timestamp":        datetime.now(UTC).isoformat(),
        "state":            dict(state),
        "state_key":        list(state_key) if state_key else [],
        "action":           action,
        "exploration":      exploration,
        "reward":           float(reward),
        "actual_revenue":   _optional_float(actual_revenue),
        "baseline_revenue": _optional_float(baseline_revenue),
        "customer_id":      _optional_str(customer_id),
    }

    _insert_nonblocking(entry, mongo_uri=mongo_uri, mongo_db=mongo_db)
    return entry


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_state_key(bandit: Any, state: Mapping[str, Any]) -> tuple:
    """Call bandit.get_state_key() if available, else return empty tuple."""
    try:
        return bandit.get_state_key(state)
    except Exception:
        return ()


def _is_exploration(bandit: Any, state_key: tuple, action: str) -> bool:
    """Return True when the action was NOT the current greedy choice.

    If the state has never been visited (no Q entry), we conservatively
    mark it as exploration since the bandit has no learned preference yet.
    """
    try:
        q_table = bandit.Q
        if state_key not in q_table:
            return True  # unvisited state → treat as exploration
        best = max(q_table[state_key], key=lambda a: q_table[state_key][a])
        return action != best
    except Exception:
        return False


def _insert_nonblocking(
    entry: dict[str, Any],
    mongo_uri: str | None,
    mongo_db: str,
) -> None:
    if not mongo_uri:
        return
    worker = Thread(
        target=_insert_mongo,
        args=(entry, mongo_uri, mongo_db),
        daemon=True,
    )
    worker.start()


def _insert_mongo(entry: dict[str, Any], mongo_uri: str, mongo_db: str) -> None:
    try:
        from pymongo import MongoClient

        document = dict(entry)
        document["timestamp"] = datetime.fromisoformat(
            str(document["timestamp"]).replace("Z", "+00:00")
        )
        # state_key stored as a list so MongoDB can index it
        document["state"] = _make_json_safe(document.get("state", {}))

        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=500)
        client[mongo_db][BANDIT_LOGS_COLLECTION].insert_one(document)
        client.close()
    except Exception as exc:
        logger.warning("bandit_log MongoDB write skipped: %s", exc)


def _make_json_safe(obj: Any) -> Any:
    """Recursively convert non-JSON-serialisable values."""
    if isinstance(obj, dict):
        return {k: _make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_make_json_safe(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _optional_str(value: Any) -> str | None:
    if value is None or value == "":
        return None
    return str(value)
