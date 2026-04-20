from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from typing import Any, Mapping

try:
    from .decision_engine import ActionType, Decision
except ImportError:  # Allows running modules directly from the agent directory.
    from decision_engine import ActionType, Decision


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ExecutionResult:
    action: str
    status: str
    message: str
    external_id: str | None
    executed_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def execute_action(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Route the selected action to the correct executor function."""

    handlers = {
        ActionType.DISCOUNT_10: send_discount_offer,
        ActionType.DISCOUNT_20: send_discount_offer,
        ActionType.CALL: create_call_task,
        ActionType.NONE: no_action,
        ActionType.INCREASE_PRICE: increase_price,
        ActionType.APPLY_DYNAMIC_PRICE: execute_dynamic_price,
        ActionType.DISCOUNT_WITH_PRICE_OVERRIDE: discount_with_price_override,
        ActionType.TRIGGER_CAMPAIGN_LOW_DEMAND: trigger_campaign_low_demand,
        ActionType.GEO_TARGET_DISCOUNT: geo_target_discount,
        ActionType.SAME_DAY_OFFER: same_day_offer,
        ActionType.SEND_DISCOUNT_OFFER: send_discount_offer,
        ActionType.CREATE_RETENTION_CALL_TASK: create_call_task,
        ActionType.FOLLOW_UP_PENDING_QUOTES: create_call_task,
        ActionType.TRIGGER_REACTIVATION_CAMPAIGN: trigger_campaign,
        ActionType.NO_ACTION: no_action,
    }
    return handlers[decision.action](decision, state)


def send_discount_offer(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock discount offer dispatch.

    Replace this with email/SMS/WhatsApp or CRM campaign API calls when
    integrations are available.
    """

    discount_label = "20%" if decision.action == ActionType.DISCOUNT_20 else "10%"
    message = (
        f"Mock {discount_label} discount offer sent "
        f"(utilization={state['utilization']:.2f}, ltv={state['ltv']:.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "discount-offer-mock")


def apply_dynamic_price(price: float) -> None:
    """Mock pricing system write; replace with catalog/API integration later."""

    print(f"Setting price to {price:.2f}")


def execute_dynamic_price(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Apply the pricing model's guarded optimal price."""

    price = float(state.get("optimal_price", state.get("current_price", 0.0)))
    apply_dynamic_price(price)
    message = (
        "Mock dynamic price applied "
        f"(optimal_price={price:.2f}, expected_revenue={state.get('expected_revenue', 0):.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "dynamic-price-mock")


def discount_with_price_override(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Send a discount while keeping the final price inside pricing guardrails."""

    price = float(state.get("optimal_price", state.get("current_price", 0.0)))
    apply_dynamic_price(price)
    message = (
        "Mock 20% discount offer sent with dynamic price override "
        f"(optimal_price={price:.2f}, utilization={state['utilization']:.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "discount-price-override-mock")


def increase_price(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock price increase for constrained technician capacity."""

    price = float(state.get("optimal_price", state.get("current_price", 0.0)))
    apply_dynamic_price(price)
    message = (
        "Mock price increase applied "
        f"(optimal_price={price:.2f}, utilization={state['utilization']:.2f}, "
        f"capacity_status={state.get('capacity_status', 'UNKNOWN')})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "price-increase-mock")


def trigger_campaign(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock campaign trigger for revenue recovery workflows."""

    message = (
        "Mock reactivation campaign triggered "
        f"(conversion_rate={state['conversion_rate']:.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "campaign-mock")


def trigger_campaign_low_demand(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock campaign trigger for forecasted low-demand periods."""

    message = (
        "Mock low-demand campaign triggered "
        f"(expected_demand={state.get('expected_demand', 0):.2f}, "
        f"demand_gap={state.get('demand_gap', 0):.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "low-demand-campaign-mock")


def geo_target_discount(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock geo-targeted discount for underfilled future demand."""

    message = (
        "Mock geo-targeted discount launched "
        f"(capacity={state.get('capacity', 0):.2f}, "
        f"demand_gap={state.get('demand_gap', 0):.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "geo-discount-mock")


def same_day_offer(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock same-day offer for forecasted schedule slack."""

    message = (
        "Mock same-day offer sent "
        f"(expected_demand={state.get('expected_demand', 0):.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "same-day-offer-mock")


def create_call_task(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock CRM task creation for retention or quote follow-up."""

    if decision.action == ActionType.FOLLOW_UP_PENDING_QUOTES:
        message = (
            "Mock quote follow-up task created "
            f"(pending_quotes={state['pending_quotes']})"
        )
        external_id = "quote-follow-up-task-mock"
    else:
        message = (
            "Mock retention call task created "
            f"(churn_risk={state['churn_risk']:.2f}, ltv={state['ltv']:.2f})"
        )
        external_id = "retention-call-task-mock"

    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, external_id)


def no_action(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    message = "No action executed"
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "skipped", message, None)


def _result(action: str, status: str, message: str, external_id: str | None) -> ExecutionResult:
    return ExecutionResult(
        action=action,
        status=status,
        message=message,
        external_id=external_id,
        executed_at=datetime.now(UTC).isoformat(),
    )
