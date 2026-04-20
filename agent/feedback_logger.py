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
    action: dict[str, Any]
    execution: dict[str, Any]
    predicted_revenue: float
    actual_revenue: float | None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def log_feedback(
    state: Mapping[str, Any],
    decision: Decision,
    execution: ExecutionResult,
    log_path: str | Path = DEFAULT_LOG_PATH,
    actual_revenue: float | None = None,
) -> FeedbackRecord:
    """Persist the action outcome for future model training and evaluation."""

    record = FeedbackRecord(
        timestamp=datetime.now(UTC).isoformat(),
        state=dict(state),
        action=decision.to_dict(),
        execution=execution.to_dict(),
        predicted_revenue=decision.expected_revenue,
        actual_revenue=actual_revenue,
    )

    path = Path(log_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record.to_dict(), sort_keys=True) + "\n")

    print(f"LOG: feedback recorded at {path}")
    return record

