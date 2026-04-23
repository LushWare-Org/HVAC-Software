from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from threading import Thread
from typing import Any, Mapping

try:
    from .decision_engine import Decision
    from .executor import ExecutionResult
except ImportError:  # Allows running modules directly from the agent directory.
    from decision_engine import Decision
    from executor import ExecutionResult


DEFAULT_LOG_PATH = Path(__file__).resolve().parent / "logs" / "revenue_agent_feedback.jsonl"
DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB = os.getenv("MONGO_DB_NAME", "hvac_software")
REVENUE_LOGS_COLLECTION = "revenue_logs"

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FeedbackRecord:
    timestamp: str
    state: dict[str, Any]
    action: str
    action_taken: str
    decision: dict[str, Any]
    execution: dict[str, Any]
    predicted_revenue: float
    actual_revenue: float | None
    expected_demand: float | None
    utilization: float | None
    optimal_price: float | None
    applied_price: float | None
    pricing_expected_revenue: float | None
    capacity_status: str | None
    idle_capacity: float | None
    actual_demand: float | None
    utilization_predicted: float | None
    utilization_actual: float | None
    demand_gap: float | None
    baseline_revenue: float | None
    customer_id: str | None
    job_id: str | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def log_feedback(
    state: Mapping[str, Any],
    decision: Decision,
    execution: ExecutionResult,
    log_path: str | Path = DEFAULT_LOG_PATH,
    actual_revenue: float | None = None,
    actual_demand: float | None = None,
    actual_utilization: float | None = None,
    applied_price: float | None = None,
    baseline_revenue: float | None = None,
    customer_id: str | None = None,
    job_id: str | None = None,
    mongo_uri: str | None = DEFAULT_MONGO_URI,
    mongo_db: str = DEFAULT_MONGO_DB,
) -> FeedbackRecord:
    """Persist the action outcome for future model training and evaluation."""

    state_payload = dict(state)
    expected_demand = _optional_float(state_payload.get("expected_demand"))
    utilization_predicted = _optional_float(state_payload.get("utilization"))
    optimal_price = _optional_float(state_payload.get("optimal_price"))
    realized_price = applied_price
    if realized_price is None:
        realized_price = optimal_price or _optional_float(state_payload.get("current_price"))
    pricing_expected_revenue = _optional_float(state_payload.get("expected_revenue"))
    idle_capacity = _optional_float(state_payload.get("idle_capacity"))
    demand_gap = _optional_float(state_payload.get("demand_gap"))
    realized_demand = actual_demand
    if realized_demand is None:
        realized_demand = _estimate_actual_demand(state_payload)
    realized_utilization = actual_utilization
    if realized_utilization is None:
        realized_utilization = _estimate_actual_utilization(state_payload, realized_demand)

    record = FeedbackRecord(
        timestamp=datetime.now(UTC).isoformat(),
        state=state_payload,
        action=decision.action.value,
        action_taken=decision.action.value,
        decision=decision.to_dict(),
        execution=execution.to_dict(),
        predicted_revenue=decision.expected_revenue,
        actual_revenue=actual_revenue,
        expected_demand=expected_demand,
        utilization=utilization_predicted,
        optimal_price=optimal_price,
        applied_price=_optional_float(realized_price),
        pricing_expected_revenue=pricing_expected_revenue,
        capacity_status=_optional_string(state_payload.get("capacity_status")),
        idle_capacity=idle_capacity,
        actual_demand=realized_demand,
        utilization_predicted=utilization_predicted,
        utilization_actual=realized_utilization,
        demand_gap=demand_gap,
        baseline_revenue=baseline_revenue,
        customer_id=_optional_string(customer_id or state_payload.get("customer_id")),
        job_id=_optional_string(job_id or state_payload.get("job_id")),
    )

    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record.to_dict(), sort_keys=True) + "\n")

    _insert_mongo_nonblocking(record.to_dict(), mongo_uri=mongo_uri, mongo_db=mongo_db)

    print(f"LOG: feedback recorded at {path}")
    return record


def _estimate_actual_demand(state: Mapping[str, Any]) -> float | None:
    if "actual_demand" in state:
        return _optional_float(state.get("actual_demand"))

    utilization = _optional_float(state.get("utilization"))
    capacity = _optional_float(state.get("capacity"))
    if utilization is None or capacity is None:
        return None

    return round(utilization * capacity, 2)


def _estimate_actual_utilization(
    state: Mapping[str, Any],
    actual_demand: float | None,
) -> float | None:
    if "actual_utilization" in state:
        return _optional_float(state.get("actual_utilization"))

    capacity = _optional_float(state.get("capacity"))
    if actual_demand is None or capacity in {None, 0.0}:
        return _optional_float(state.get("utilization"))

    return round(max(0.0, min(1.0, actual_demand / capacity)), 4)


def _insert_mongo_nonblocking(
    log_entry: dict[str, Any],
    mongo_uri: str | None,
    mongo_db: str,
) -> None:
    """Best-effort MongoDB write for dashboard queries without blocking the agent."""

    if not mongo_uri:
        return

    worker = Thread(
        target=_insert_mongo,
        args=(log_entry, mongo_uri, mongo_db),
        daemon=True,
    )
    worker.start()


def _insert_mongo(log_entry: dict[str, Any], mongo_uri: str, mongo_db: str) -> None:
    try:
        from pymongo import MongoClient

        document = dict(log_entry)
        document["timestamp"] = datetime.fromisoformat(
            str(document["timestamp"]).replace("Z", "+00:00")
        )

        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=500)
        db = client[mongo_db]
        db[REVENUE_LOGS_COLLECTION].insert_one(document)
        client.close()
    except Exception as exc:
        logger.warning("Revenue MongoDB feedback write skipped: %s", exc)


def _optional_float(value: Any) -> float | None:
    if value is None or value == "":
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _optional_string(value: Any) -> str | None:
    if value is None or value == "":
        return None

    return str(value)
