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

    message = (
        "Mock discount offer sent for low utilization "
        f"(utilization={state['utilization']:.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "discount-offer-mock")


def trigger_campaign(decision: Decision, state: Mapping[str, Any]) -> ExecutionResult:
    """Mock campaign trigger for revenue recovery workflows."""

    message = (
        "Mock reactivation campaign triggered "
        f"(conversion_rate={state['conversion_rate']:.2f})"
    )
    logger.info(message)
    print(f"ACTION: {message}")
    return _result(decision.action.value, "mocked", message, "campaign-mock")


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

