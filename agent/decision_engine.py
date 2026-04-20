from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import Enum
from typing import Any, Mapping


class ActionType(str, Enum):
    SEND_DISCOUNT_OFFER = "send_discount_offer"
    CREATE_RETENTION_CALL_TASK = "create_retention_call_task"
    FOLLOW_UP_PENDING_QUOTES = "follow_up_pending_quotes"
    TRIGGER_REACTIVATION_CAMPAIGN = "trigger_reactivation_campaign"
    NO_ACTION = "no_action"


@dataclass(frozen=True)
class RuleConfig:
    """Centralized business thresholds for the initial rule-based policy."""

    low_utilization_threshold: float = 0.60
    high_churn_threshold: float = 0.70
    pending_quotes_threshold: int = 10
    low_conversion_threshold: float = 0.35
    high_ltv_threshold: float = 2000.00


@dataclass(frozen=True)
class Decision:
    action: ActionType
    reason: str
    priority: str
    expected_revenue: float
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["action"] = self.action.value
        return payload


def decide(state: Mapping[str, Any], config: RuleConfig | None = None) -> Decision:
    """Choose the next revenue action.

    This is the only policy function the agent loop depends on. Future ML
    integrations can replace this function with a decision_model.pkl,
    contextual bandit, or optimizer without changing state building,
    execution, or feedback logging.
    """

    rule_config = config or RuleConfig()
    normalized = _normalize_state(state)

    if normalized["churn_risk"] > rule_config.high_churn_threshold:
        return Decision(
            action=ActionType.CREATE_RETENTION_CALL_TASK,
            reason="High churn risk detected for high-value customer segment",
            priority="high" if normalized["ltv"] >= rule_config.high_ltv_threshold else "medium",
            expected_revenue=round(normalized["ltv"] * normalized["churn_risk"] * 0.20, 2),
            metadata={"policy": "rules.v1", "trigger": "churn_risk"},
        )

    if normalized["pending_quotes"] > rule_config.pending_quotes_threshold:
        return Decision(
            action=ActionType.FOLLOW_UP_PENDING_QUOTES,
            reason="Pending quote backlog exceeds follow-up threshold",
            priority="high",
            expected_revenue=round(
                normalized["pending_quotes"] * normalized["ltv"] * normalized["conversion_rate"] * 0.05,
                2,
            ),
            metadata={"policy": "rules.v1", "trigger": "pending_quotes"},
        )

    if normalized["utilization"] < rule_config.low_utilization_threshold:
        return Decision(
            action=ActionType.SEND_DISCOUNT_OFFER,
            reason="Technician utilization is below target",
            priority="medium",
            expected_revenue=round(normalized["ltv"] * 0.08, 2),
            metadata={"policy": "rules.v1", "trigger": "low_utilization"},
        )

    if normalized["conversion_rate"] < rule_config.low_conversion_threshold:
        return Decision(
            action=ActionType.TRIGGER_REACTIVATION_CAMPAIGN,
            reason="Conversion rate is below target",
            priority="medium",
            expected_revenue=round(normalized["ltv"] * 0.04, 2),
            metadata={"policy": "rules.v1", "trigger": "low_conversion"},
        )

    return Decision(
        action=ActionType.NO_ACTION,
        reason="No revenue intervention threshold was crossed",
        priority="low",
        expected_revenue=0.0,
        metadata={"policy": "rules.v1", "trigger": "none"},
    )


def _normalize_state(state: Mapping[str, Any]) -> dict[str, float | int]:
    return {
        "utilization": _clamp_probability(state["utilization"]),
        "churn_risk": _clamp_probability(state["churn_risk"]),
        "ltv": max(0.0, float(state["ltv"])),
        "pending_quotes": max(0, int(state["pending_quotes"])),
        "conversion_rate": _clamp_probability(state["conversion_rate"]),
    }


def _clamp_probability(value: Any) -> float:
    number = float(value)
    return min(1.0, max(0.0, number))

