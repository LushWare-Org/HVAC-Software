from __future__ import annotations

import json
import logging
from argparse import ArgumentParser
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

try:
    from .decision_engine import ActionType
    from .decision_engine import Decision, decide
    from .executor import ExecutionResult, execute_action
    from .feedback_logger import DEFAULT_LOG_PATH, FeedbackRecord, log_feedback
    from .state_builder import RevenueState, build_state
except ImportError:  # Allows `python revenue_agent.py` from inside agent/.
    from decision_engine import ActionType
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
        actual_utilization: float | None = None,
        customer_id: str | None = None,
        job_id: str | None = None,
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
        print(
            "PRICING: "
            f"current={state.current_price:.2f}, "
            f"optimal={state.optimal_price:.2f}, "
            f"expected_revenue={state.expected_revenue:.2f}, "
            f"source={state.pricing_model_source}"
        )

        decision = decide(state_payload)
        predictions = decision.metadata.get("predictions")
        if predictions:
            print("PREDICTIONS:")
            print(json.dumps(predictions, indent=2, sort_keys=True))

        print("DECISION:")
        print(json.dumps(decision.to_dict(), indent=2, sort_keys=True))

        execution = execute_action(decision, state_payload)
        applied_price = get_applied_price(state_payload, decision)
        baseline_revenue = get_baseline_revenue(state_payload)
        realized_demand = get_actual_demand(state_payload, actual_demand)
        realized_utilization = get_actual_utilization(
            state_payload,
            actual_utilization,
            realized_demand,
        )
        realized_revenue = get_actual_revenue(
            state_payload,
            decision,
            actual_revenue,
            realized_demand,
            applied_price,
        )
        feedback = log_feedback(
            state=state_payload,
            decision=decision,
            execution=execution,
            log_path=self.feedback_log_path,
            actual_revenue=realized_revenue,
            actual_demand=realized_demand,
            actual_utilization=realized_utilization,
            applied_price=applied_price,
            baseline_revenue=baseline_revenue,
            customer_id=customer_id,
            job_id=job_id,
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


def get_baseline_revenue(state: Mapping[str, Any]) -> float:
    """Estimate revenue if the agent took no action."""

    expected_demand = _float_or_default(state.get("expected_demand"), 0.0)
    current_price = _float_or_default(state.get("current_price"), 0.0)
    return round(expected_demand * current_price, 2)


def get_applied_price(state: Mapping[str, Any], decision: Decision) -> float:
    """Return the price actually written or implied by the selected action."""

    current_price = _float_or_default(state.get("current_price"), 0.0)
    optimal_price = _float_or_default(state.get("optimal_price"), current_price)

    if decision.action in {
        ActionType.INCREASE_PRICE,
        ActionType.APPLY_DYNAMIC_PRICE,
        ActionType.DISCOUNT_WITH_PRICE_OVERRIDE,
    }:
        return round(optimal_price, 2)

    if decision.action == ActionType.DISCOUNT_20:
        return round(current_price * 0.80, 2)

    if decision.action in {
        ActionType.DISCOUNT_10,
        ActionType.SEND_DISCOUNT_OFFER,
        ActionType.GEO_TARGET_DISCOUNT,
        ActionType.SAME_DAY_OFFER,
    }:
        return round(current_price * 0.90, 2)

    return round(current_price, 2)


def get_actual_demand(
    state: Mapping[str, Any],
    actual_demand: float | None = None,
) -> float:
    """Use supplied realized demand or a deterministic mock for local runs."""

    if actual_demand is not None:
        return round(max(0.0, actual_demand), 2)

    expected_demand = _float_or_default(state.get("expected_demand"), 0.0)
    demand_gap = _float_or_default(state.get("demand_gap"), 0.0)
    adjustment = 0.92 if demand_gap < 0 else 1.03
    return round(max(0.0, expected_demand * adjustment), 2)


def get_actual_utilization(
    state: Mapping[str, Any],
    actual_utilization: float | None = None,
    actual_demand: float | None = None,
) -> float:
    """Use supplied realized utilization or infer it from demand and capacity."""

    if actual_utilization is not None:
        return round(_clamp(actual_utilization, 0.0, 1.0), 4)

    capacity = _float_or_default(state.get("capacity"), 0.0)
    if capacity <= 0:
        return round(_clamp(_float_or_default(state.get("utilization"), 0.0), 0.0, 1.0), 4)

    demand = actual_demand if actual_demand is not None else get_actual_demand(state)
    return round(_clamp(demand / capacity, 0.0, 1.0), 4)


def get_actual_revenue(
    state: Mapping[str, Any],
    decision: Decision,
    actual_revenue: float | None = None,
    actual_demand: float | None = None,
    applied_price: float | None = None,
) -> float:
    """Use supplied revenue or mock realized revenue from demand, price, and action lift."""

    if actual_revenue is not None:
        return round(max(0.0, actual_revenue), 2)

    demand = actual_demand if actual_demand is not None else get_actual_demand(state)
    price = applied_price if applied_price is not None else get_applied_price(state, decision)
    action_lift = {
        ActionType.DISCOUNT_10: 1.08,
        ActionType.DISCOUNT_20: 1.12,
        ActionType.DISCOUNT_WITH_PRICE_OVERRIDE: 1.10,
        ActionType.CALL: 1.05,
        ActionType.INCREASE_PRICE: 0.97,
        ActionType.APPLY_DYNAMIC_PRICE: 1.02,
    }.get(decision.action, 1.0)

    return round(max(0.0, demand * price * action_lift), 2)


def _float_or_default(value: Any, default: float) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _clamp(value: float, lower: float, upper: float) -> float:
    return min(upper, max(lower, float(value)))


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
    parser.add_argument(
        "--actual-utilization",
        type=float,
        help="Optional realized technician utilization to store with feedback.",
    )
    parser.add_argument("--customer-id", help="Optional customer identifier for the log entry.")
    parser.add_argument("--job-id", help="Optional job identifier for the log entry.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    agent = RevenueAgent(feedback_log_path=args.feedback_log)
    agent.run(
        state_overrides=load_state_overrides(args.state_file),
        actual_revenue=args.actual_revenue,
        actual_demand=args.actual_demand,
        actual_utilization=args.actual_utilization,
        customer_id=args.customer_id,
        job_id=args.job_id,
    )


if __name__ == "__main__":
    main()
