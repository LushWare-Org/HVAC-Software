from __future__ import annotations

import json
import logging
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

try:
    from .decision_engine import Decision, decide
    from .executor import ExecutionResult, execute_action
    from .feedback_logger import DEFAULT_LOG_PATH, FeedbackRecord, log_feedback
    from .state_builder import RevenueState, build_state
except ImportError:  # Allows `python revenue_agent.py` from inside agent/.
    from decision_engine import Decision, decide
    from executor import ExecutionResult, execute_action
    from feedback_logger import DEFAULT_LOG_PATH, FeedbackRecord, log_feedback
    from state_builder import RevenueState, build_state


logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AgentRunResult:
    state: RevenueState
    decision: Decision
    execution: ExecutionResult
    feedback: FeedbackRecord


class RevenueAgent:
    """Agent-first revenue optimization pipeline.

    The loop is intentionally simple and stable:
    build state -> decide -> execute -> log feedback.
    Each stage is isolated so future ML models can replace the rule policy
    without rewriting CRM execution or feedback capture.
    """

    def __init__(self, feedback_log_path: str | Path = DEFAULT_LOG_PATH) -> None:
        self.feedback_log_path = Path(feedback_log_path)

    def run(
        self,
        state_overrides: Mapping[str, Any] | None = None,
        actual_revenue: float | None = None,
        actual_demand: float | None = None,
    ) -> AgentRunResult:
        state = build_state(overrides=state_overrides)
        state_payload = state.to_dict()
        print("STATE:")
        print(json.dumps(state_payload, indent=2, sort_keys=True))
        print(
            "DEMAND FORECAST: "
            f"expected={state.expected_demand:.2f}, "
            f"capacity={state.capacity:.2f}, "
            f"gap={state.demand_gap:.2f}, "
            f"source={state.demand_forecast_source}"
        )
        print(
            "UTILIZATION: "
            f"predicted={state.utilization:.2f}, "
            f"status={state.capacity_status}, "
            f"idle_capacity={state.idle_capacity:.2f}, "
            f"source={state.utilization_forecast_source}"
        )

        decision = decide(state_payload)
        predictions = decision.metadata.get("predictions")
        if predictions:
            print("PREDICTIONS:")
            print(json.dumps(predictions, indent=2, sort_keys=True))

        print("DECISION:")
        print(json.dumps(decision.to_dict(), indent=2, sort_keys=True))

        execution = execute_action(decision, state_payload)
        feedback = log_feedback(
            state=state_payload,
            decision=decision,
            execution=execution,
            log_path=self.feedback_log_path,
            actual_revenue=actual_revenue,
            actual_demand=actual_demand,
        )

        return AgentRunResult(
            state=state,
            decision=decision,
            execution=execution,
            feedback=feedback,
        )


def load_state_overrides(path: str | Path | None) -> dict[str, Any] | None:
    if path is None:
        return None

    with Path(path).open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, dict):
        raise ValueError("State override file must contain a JSON object")

    return payload


def parse_args() -> Any:
    parser = ArgumentParser(description="Run the revenue optimization agent loop.")
    parser.add_argument(
        "--state-file",
        help="Optional JSON file containing state overrides for local testing.",
    )
    parser.add_argument(
        "--feedback-log",
        default=str(DEFAULT_LOG_PATH),
        help="Path to the JSONL feedback log.",
    )
    parser.add_argument(
        "--actual-revenue",
        type=float,
        help="Optional realized revenue value to store with feedback.",
    )
    parser.add_argument(
        "--actual-demand",
        type=float,
        help="Optional realized booking count to store with feedback.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    agent = RevenueAgent(feedback_log_path=args.feedback_log)
    agent.run(
        state_overrides=load_state_overrides(args.state_file),
        actual_revenue=args.actual_revenue,
        actual_demand=args.actual_demand,
    )


if __name__ == "__main__":
    main()
