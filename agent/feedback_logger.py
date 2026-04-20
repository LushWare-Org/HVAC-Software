from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Mapping

try:
    from .decision_engine import Decision
    from .executor import ExecutionResult
except ImportError:  # Allows running modules directly from the agent directory.
    from decision_engine import Decision
    from executor import ExecutionResult


DEFAULT_LOG_PATH = Path(__file__).resolve().parent / "logs" / "revenue_agent_feedback.jsonl"


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
    capacity_status: str | None
    idle_capacity: float | None
    actual_demand: float | None
    demand_gap: float | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def log_feedback(
    state: Mapping[str, Any],
    decision: Decision,
    execution: ExecutionResult,
    log_path: str | Path = DEFAULT_LOG_PATH,
    actual_revenue: float | None = None,
    actual_demand: float | None = None,
) -> FeedbackRecord:
    """Persist the action outcome for future model training and evaluation."""

    state_payload = dict(state)
    expected_demand = _optional_float(state_payload.get("expected_demand"))
    utilization = _optional_float(state_payload.get("utilization"))
    idle_capacity = _optional_float(state_payload.get("idle_capacity"))
    demand_gap = _optional_float(state_payload.get("demand_gap"))
    realized_demand = actual_demand
    if realized_demand is None:
        realized_demand = _estimate_actual_demand(state_payload)

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
        utilization=utilization,
        capacity_status=_optional_string(state_payload.get("capacity_status")),
        idle_capacity=idle_capacity,
        actual_demand=realized_demand,
        demand_gap=demand_gap,
    )

    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record.to_dict(), sort_keys=True) + "\n")

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
