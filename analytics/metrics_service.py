from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Mapping

try:
    from agent.feedback_logger import DEFAULT_LOG_PATH, REVENUE_LOGS_COLLECTION
except ImportError:
    DEFAULT_LOG_PATH = Path(__file__).resolve().parents[1] / "agent" / "logs" / "revenue_agent_feedback.jsonl"
    REVENUE_LOGS_COLLECTION = "revenue_logs"


DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB = os.getenv("MONGO_DB_NAME", "hvac_software")


class MetricsService:
    """Compute observability KPIs for the Revenue Agent dashboard."""

    def __init__(
        self,
        mongo_uri: str | None = DEFAULT_MONGO_URI,
        mongo_db: str = DEFAULT_MONGO_DB,
        log_path: str | Path = DEFAULT_LOG_PATH,
    ) -> None:
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db
        self.log_path = Path(log_path)

    def dashboard_summary(self) -> dict[str, float | int]:
        mongo_summary = self._mongo_summary()
        if mongo_summary is not None:
            return mongo_summary

        logs = self.get_logs(limit=None)
        return {
            "revenue_accuracy": self.revenue_accuracy(logs)["accuracy"],
            "revenue_mean_error": self.revenue_accuracy(logs)["mean_error"],
            "demand_accuracy": self.demand_accuracy(logs),
            "utilization_accuracy": self.utilization_accuracy(logs),
            "action_success_rate": self.action_success_rate(logs),
            "pricing_impact": self.pricing_impact(logs),
            "sample_size": len(logs),
        }

    def revenue_accuracy(self, logs: list[Mapping[str, Any]] | None = None) -> dict[str, float]:
        rows = logs if logs is not None else self.get_logs(limit=None)
        errors = [
            abs(predicted - actual) / actual
            for row in rows
            for predicted, actual in [(_number(row.get("predicted_revenue")), _number(row.get("actual_revenue")))]
            if predicted is not None and actual not in {None, 0.0}
        ]
        if not errors:
            return {
                "mean_error": 0.0,
                "accuracy": 0.0,
            }

        mean_error = _mean(errors)
        return {
            "mean_error": round(mean_error, 4),
            "accuracy": round(max(0.0, 1.0 - mean_error), 4),
        }

    def demand_accuracy(self, logs: list[Mapping[str, Any]] | None = None) -> float:
        rows = logs if logs is not None else self.get_logs(limit=None)
        return _accuracy_from_error(rows, "expected_demand", "actual_demand")

    def utilization_accuracy(self, logs: list[Mapping[str, Any]] | None = None) -> float:
        rows = logs if logs is not None else self.get_logs(limit=None)
        return _accuracy_from_error(rows, "utilization_predicted", "utilization_actual")

    def action_success_rate(self, logs: list[Mapping[str, Any]] | None = None) -> float:
        rows = logs if logs is not None else self.get_logs(limit=None)
        comparable = [
            row
            for row in rows
            if _number(row.get("actual_revenue")) is not None
            and _number(row.get("baseline_revenue")) is not None
        ]
        if not comparable:
            return 0.0

        successes = [
            row
            for row in comparable
            if float(row["actual_revenue"]) > float(row["baseline_revenue"])
        ]
        return round(len(successes) / len(comparable), 4)

    def pricing_impact(self, logs: list[Mapping[str, Any]] | None = None) -> float:
        rows = logs if logs is not None else self.get_logs(limit=None)
        impacts = [
            actual - baseline
            for row in rows
            for actual, baseline in [(_number(row.get("actual_revenue")), _number(row.get("baseline_revenue")))]
            if actual is not None and baseline is not None
        ]
        return round(_mean(impacts), 2)

    def trends(self, limit: int = 30) -> list[dict[str, Any]]:
        mongo_trends = self._mongo_trends(limit=limit)
        if mongo_trends is not None:
            return mongo_trends

        grouped: dict[str, list[Mapping[str, Any]]] = {}
        for row in self.get_logs(limit=None):
            day = _date_key(row.get("timestamp"))
            grouped.setdefault(day, []).append(row)

        points = []
        for day, rows in sorted(grouped.items())[-limit:]:
            points.append(
                {
                    "date": day,
                    "revenue_accuracy": self.revenue_accuracy(list(rows))["accuracy"],
                    "demand_accuracy": self.demand_accuracy(list(rows)),
                    "utilization_accuracy": self.utilization_accuracy(list(rows)),
                    "action_success_rate": self.action_success_rate(list(rows)),
                    "pricing_impact": self.pricing_impact(list(rows)),
                    "sample_size": len(rows),
                }
            )
        return points

    def get_logs(self, limit: int | None = 100) -> list[dict[str, Any]]:
        mongo_logs = self._mongo_logs(limit=limit)
        if mongo_logs is not None:
            return mongo_logs

        if not self.log_path.exists():
            return []

        rows: list[dict[str, Any]] = []
        with self.log_path.open("r", encoding="utf-8") as handle:
            for line in handle:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

        rows.sort(key=lambda row: str(row.get("timestamp", "")), reverse=True)
        if limit is None:
            return rows
        return rows[: max(0, limit)]

    def _mongo_summary(self) -> dict[str, float | int] | None:
        collection = self._mongo_collection()
        if collection is None:
            return None

        pipeline = [
            {
                "$project": {
                    "revenue_error": {
                        "$cond": [
                            {"$gt": ["$actual_revenue", 0]},
                            {"$divide": [{"$abs": {"$subtract": ["$predicted_revenue", "$actual_revenue"]}}, "$actual_revenue"]},
                            None,
                        ]
                    },
                    "demand_error": {
                        "$cond": [
                            {"$gt": ["$actual_demand", 0]},
                            {"$divide": [{"$abs": {"$subtract": ["$expected_demand", "$actual_demand"]}}, "$actual_demand"]},
                            None,
                        ]
                    },
                    "utilization_error": {
                        "$cond": [
                            {"$gt": ["$utilization_actual", 0]},
                            {"$divide": [{"$abs": {"$subtract": ["$utilization_predicted", "$utilization_actual"]}}, "$utilization_actual"]},
                            None,
                        ]
                    },
                    "success": {"$cond": [{"$gt": ["$actual_revenue", "$baseline_revenue"]}, 1, 0]},
                    "pricing_impact": {"$subtract": ["$actual_revenue", "$baseline_revenue"]},
                }
            },
            {
                "$group": {
                    "_id": None,
                    "revenue_mean_error": {"$avg": "$revenue_error"},
                    "demand_mean_error": {"$avg": "$demand_error"},
                    "utilization_mean_error": {"$avg": "$utilization_error"},
                    "action_success_rate": {"$avg": "$success"},
                    "pricing_impact": {"$avg": "$pricing_impact"},
                    "sample_size": {"$sum": 1},
                }
            },
        ]
        rows = list(collection.aggregate(pipeline))
        if not rows:
            return _empty_summary()

        row = rows[0]
        revenue_error = _number(row.get("revenue_mean_error")) or 0.0
        demand_error = _number(row.get("demand_mean_error")) or 0.0
        utilization_error = _number(row.get("utilization_mean_error")) or 0.0
        return {
            "revenue_accuracy": round(max(0.0, 1.0 - revenue_error), 4),
            "revenue_mean_error": round(revenue_error, 4),
            "demand_accuracy": round(max(0.0, 1.0 - demand_error), 4),
            "utilization_accuracy": round(max(0.0, 1.0 - utilization_error), 4),
            "action_success_rate": round(float(row.get("action_success_rate") or 0.0), 4),
            "pricing_impact": round(float(row.get("pricing_impact") or 0.0), 2),
            "sample_size": int(row.get("sample_size") or 0),
        }

    def _mongo_trends(self, limit: int) -> list[dict[str, Any]] | None:
        collection = self._mongo_collection()
        if collection is None:
            return None

        pipeline = [
            {
                "$addFields": {
                    "_timestamp": {
                        "$cond": [
                            {"$eq": [{"$type": "$timestamp"}, "date"]},
                            "$timestamp",
                            {"$dateFromString": {"dateString": "$timestamp"}},
                        ]
                    }
                }
            },
            {
                "$project": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$_timestamp"}},
                    "revenue_error": {
                        "$cond": [
                            {"$gt": ["$actual_revenue", 0]},
                            {"$divide": [{"$abs": {"$subtract": ["$predicted_revenue", "$actual_revenue"]}}, "$actual_revenue"]},
                            None,
                        ]
                    },
                    "demand_error": {
                        "$cond": [
                            {"$gt": ["$actual_demand", 0]},
                            {"$divide": [{"$abs": {"$subtract": ["$expected_demand", "$actual_demand"]}}, "$actual_demand"]},
                            None,
                        ]
                    },
                    "utilization_error": {
                        "$cond": [
                            {"$gt": ["$utilization_actual", 0]},
                            {"$divide": [{"$abs": {"$subtract": ["$utilization_predicted", "$utilization_actual"]}}, "$utilization_actual"]},
                            None,
                        ]
                    },
                    "success": {"$cond": [{"$gt": ["$actual_revenue", "$baseline_revenue"]}, 1, 0]},
                    "pricing_impact": {"$subtract": ["$actual_revenue", "$baseline_revenue"]},
                }
            },
            {
                "$group": {
                    "_id": "$date",
                    "revenue_mean_error": {"$avg": "$revenue_error"},
                    "demand_mean_error": {"$avg": "$demand_error"},
                    "utilization_mean_error": {"$avg": "$utilization_error"},
                    "action_success_rate": {"$avg": "$success"},
                    "pricing_impact": {"$avg": "$pricing_impact"},
                    "sample_size": {"$sum": 1},
                }
            },
            {"$sort": {"_id": -1}},
            {"$limit": max(1, limit)},
            {"$sort": {"_id": 1}},
        ]
        return [
            {
                "date": row["_id"],
                "revenue_accuracy": round(max(0.0, 1.0 - float(row.get("revenue_mean_error") or 0.0)), 4),
                "demand_accuracy": round(max(0.0, 1.0 - float(row.get("demand_mean_error") or 0.0)), 4),
                "utilization_accuracy": round(max(0.0, 1.0 - float(row.get("utilization_mean_error") or 0.0)), 4),
                "action_success_rate": round(float(row.get("action_success_rate") or 0.0), 4),
                "pricing_impact": round(float(row.get("pricing_impact") or 0.0), 2),
                "sample_size": int(row.get("sample_size") or 0),
            }
            for row in collection.aggregate(pipeline)
        ]

    def _mongo_logs(self, limit: int | None) -> list[dict[str, Any]] | None:
        collection = self._mongo_collection()
        if collection is None:
            return None

        cursor = collection.find({}, {"_id": 0}).sort("timestamp", -1)
        if limit is not None:
            cursor = cursor.limit(max(0, limit))

        return [_json_safe(row) for row in cursor]

    def _mongo_collection(self) -> Any | None:
        if not self.mongo_uri:
            return None

        try:
            from pymongo import MongoClient

            client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=500)
            client.admin.command("ping")
            return client[self.mongo_db][REVENUE_LOGS_COLLECTION]
        except Exception:
            return None


def revenue_accuracy() -> dict[str, float]:
    return MetricsService().revenue_accuracy()


def demand_accuracy() -> float:
    return MetricsService().demand_accuracy()


def utilization_accuracy() -> float:
    return MetricsService().utilization_accuracy()


def action_success_rate() -> float:
    return MetricsService().action_success_rate()


def pricing_impact() -> float:
    return MetricsService().pricing_impact()


def get_logs(limit: int | None = 100) -> list[dict[str, Any]]:
    return MetricsService().get_logs(limit=limit)


def dashboard_summary() -> dict[str, float | int]:
    return MetricsService().dashboard_summary()


def trends(limit: int = 30) -> list[dict[str, Any]]:
    return MetricsService().trends(limit=limit)


def _accuracy_from_error(
    rows: Iterable[Mapping[str, Any]],
    predicted_key: str,
    actual_key: str,
) -> float:
    errors = [
        abs(predicted - actual) / actual
        for row in rows
        for predicted, actual in [
            (
                _number(_predicted_value(row, predicted_key)),
                _number(row.get(actual_key)),
            )
        ]
        if predicted is not None and actual not in {None, 0.0}
    ]
    if not errors:
        return 0.0

    return round(max(0.0, 1.0 - _mean(errors)), 4)


def _predicted_value(row: Mapping[str, Any], predicted_key: str) -> Any:
    value = row.get(predicted_key)
    if value is not None:
        return value

    if predicted_key == "utilization_predicted":
        return row.get("utilization")

    return value


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _number(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
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


def _json_safe(row: Mapping[str, Any]) -> dict[str, Any]:
    safe = dict(row)
    for key, value in list(safe.items()):
        if isinstance(value, datetime):
            safe[key] = value.isoformat()
    return safe


def _empty_summary() -> dict[str, float | int]:
    return {
        "revenue_accuracy": 0.0,
        "revenue_mean_error": 0.0,
        "demand_accuracy": 0.0,
        "utilization_accuracy": 0.0,
        "action_success_rate": 0.0,
        "pricing_impact": 0.0,
        "sample_size": 0,
    }
