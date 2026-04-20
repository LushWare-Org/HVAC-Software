from __future__ import annotations

import logging
import math
import pickle
from dataclasses import asdict, dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Mapping

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ACTION_MODEL_PATH = PROJECT_ROOT / "models" / "action_effect_models.pkl"

MODEL_ACTIONS = ("discount_10", "discount_20", "call", "none")
ACTION_COSTS: dict[str, float] = {
    "discount_10": 300.0,
    "discount_20": 800.0,
    "call": 100.0,
    "none": 0.0,
    "increase_price": 0.0,
}


class ActionType(str, Enum):
    DISCOUNT_10 = "discount_10"
    DISCOUNT_20 = "discount_20"
    CALL = "call"
    NONE = "none"
    INCREASE_PRICE = "increase_price"
    TRIGGER_CAMPAIGN_LOW_DEMAND = "trigger_campaign_low_demand"
    GEO_TARGET_DISCOUNT = "geo_target_discount"
    SAME_DAY_OFFER = "same_day_offer"

    # Backward-compatible action names used by the original rules.v1 engine.
    SEND_DISCOUNT_OFFER = "send_discount_offer"
    CREATE_RETENTION_CALL_TASK = "create_retention_call_task"
    FOLLOW_UP_PENDING_QUOTES = "follow_up_pending_quotes"
    TRIGGER_REACTIVATION_CAMPAIGN = "trigger_reactivation_campaign"
    NO_ACTION = "no_action"


@dataclass(frozen=True)
class RuleConfig:
    """Centralized business thresholds for the fallback rule-based policy."""

    low_utilization_threshold: float = 0.60
    high_churn_threshold: float = 0.70
    pending_quotes_threshold: int = 10
    low_conversion_threshold: float = 0.35
    high_ltv_threshold: float = 2000.00


@dataclass(frozen=True)
class ConstraintConfig:
    low_ltv_threshold: float = 1000.00
    high_churn_threshold: float = 0.70
    minimum_discount_ltv: float = 500.00


@dataclass(frozen=True)
class ProactiveDemandConfig:
    """Thresholds for forecast-driven demand recovery actions."""

    low_demand_gap_threshold: float = -20.0
    low_utilization_threshold: float = 0.60
    medium_utilization_threshold: float = 0.85
    high_utilization_threshold: float = 0.90
    discount_safety_threshold: float = 0.95


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


_ACTION_MODELS_CACHE: dict[str, Any] | None = None


def load_action_models(model_path: str | Path = DEFAULT_ACTION_MODEL_PATH) -> dict[str, Any]:
    """Load per-action revenue outcome models from disk."""

    path = Path(model_path)
    with path.open("rb") as handle:
        models = pickle.load(handle)

    if not isinstance(models, dict):
        raise ValueError("action_effect_models.pkl must contain a dictionary")

    missing_actions = [action for action in MODEL_ACTIONS if action not in models]
    if missing_actions:
        raise ValueError(f"action model file is missing actions: {missing_actions}")

    return {action: models[action] for action in MODEL_ACTIONS}


def evaluate_actions(
    state: Mapping[str, Any],
    models: Mapping[str, Any] | None = None,
) -> dict[str, float]:
    """Predict gross revenue for every available action."""

    action_models = dict(models or _get_cached_action_models())
    predictions: dict[str, float] = {}

    for action, model in action_models.items():
        features = _state_to_feature_frame(state, {action: model})
        raw_prediction = model.predict(features)
        predictions[action] = _prediction_to_float(raw_prediction)

    return predictions


def choose_best(predictions: Mapping[str, float], costs: Mapping[str, float] = ACTION_COSTS) -> str:
    """Choose the action with the highest predicted revenue after action cost."""

    if not predictions:
        raise ValueError("No action predictions were provided")

    return max(predictions, key=lambda action: predictions[action] - costs.get(action, 0.0))


def apply_constraints(
    action: str,
    state: Mapping[str, Any],
    config: ConstraintConfig | None = None,
) -> str:
    """Apply business safety constraints after model scoring."""

    constraint_config = config or ConstraintConfig()
    normalized = _normalize_state(state)

    valid_actions = set(MODEL_ACTIONS) | {ActionType.INCREASE_PRICE.value}
    if action not in valid_actions:
        logger.warning("Unknown model action '%s'; falling back to none", action)
        return "none"

    if prevent_discounts(normalized) and action.startswith("discount_"):
        return "increase_price"

    if normalized["churn_risk"] >= constraint_config.high_churn_threshold:
        return "call"

    if normalized["ltv"] < constraint_config.minimum_discount_ltv and action.startswith("discount_"):
        return "none"

    if normalized["ltv"] < constraint_config.low_ltv_threshold and action == "discount_20":
        return "discount_10"

    return action


def decide(state: Mapping[str, Any]) -> Decision:
    """Choose the next revenue action using capacity rules, then ML scoring."""

    capacity_decision = decide_capacity_aware(state)
    if capacity_decision is not None:
        return capacity_decision

    try:
        predictions = evaluate_actions(state)
        best_action = choose_best(predictions)
        final_action = apply_constraints(best_action, state)
        net_predictions = {
            action: round(predicted_revenue - ACTION_COSTS.get(action, 0.0), 2)
            for action, predicted_revenue in predictions.items()
        }

        if final_action != best_action:
            reason = (
                f"Model selected {best_action}, then constraints adjusted the action "
                f"to {final_action}"
            )
        else:
            reason = "Selected highest net predicted revenue action"

        return Decision(
            action=ActionType(final_action),
            reason=reason,
            priority=_priority_for_action(final_action, state),
            expected_revenue=round(predictions.get(final_action, predictions[best_action]), 2),
            metadata={
                "policy": "action_effect_models.v1",
                "model_path": str(DEFAULT_ACTION_MODEL_PATH),
                "predictions": {action: round(value, 2) for action, value in predictions.items()},
                "action_costs": ACTION_COSTS,
                "net_predictions": net_predictions,
                "model_best_action": best_action,
                "final_action": final_action,
            },
        )
    except Exception as exc:
        logger.error("Model-backed decision failed; using rule fallback: %s", exc)
        fallback_decision = decide_rule_based(state)
        fallback_metadata = dict(fallback_decision.metadata)
        fallback_metadata["fallback_reason"] = f"{type(exc).__name__}: {exc}"
        return Decision(
            action=fallback_decision.action,
            reason=f"Model decision failed; {fallback_decision.reason}",
            priority=fallback_decision.priority,
            expected_revenue=fallback_decision.expected_revenue,
            metadata=fallback_metadata,
        )


def prevent_discounts(state: Mapping[str, Any]) -> bool:
    return _normalize_state(state)["utilization"] > 0.95


def decide_capacity_aware(
    state: Mapping[str, Any],
    config: ProactiveDemandConfig | None = None,
) -> Decision | None:
    """Apply proactive capacity policy before normal action-effect scoring."""

    demand_config = config or ProactiveDemandConfig()
    normalized = _normalize_state(state)

    if normalized["capacity"] <= 0:
        return None

    if normalized["demand_gap"] < demand_config.low_demand_gap_threshold:
        if normalized["utilization"] < demand_config.low_utilization_threshold:
            return _capacity_decision(
                action="discount_20",
                state=state,
                normalized=normalized,
                trigger="low_demand_low_utilization",
                reason="Demand is below capacity and technician utilization is low",
                priority="high",
            )

        if normalized["utilization"] < demand_config.medium_utilization_threshold:
            return _capacity_decision(
                action="discount_10",
                state=state,
                normalized=normalized,
                trigger="low_demand_medium_utilization",
                reason="Demand is below capacity with moderate technician utilization",
                priority="medium",
            )

    if normalized["utilization"] > demand_config.high_utilization_threshold:
        return _capacity_decision(
            action="increase_price",
            state=state,
            normalized=normalized,
            trigger="high_utilization",
            reason="Technician utilization is high; preserving capacity and margin",
            priority="high" if normalized["utilization"] > demand_config.discount_safety_threshold else "medium",
        )

    return None


def decide_proactive_demand(
    state: Mapping[str, Any],
    config: ProactiveDemandConfig | None = None,
) -> Decision | None:
    """Backward-compatible alias for the capacity-aware proactive policy."""

    return decide_capacity_aware(state, config=config)


def _capacity_decision(
    action: str,
    state: Mapping[str, Any],
    normalized: Mapping[str, float | int],
    trigger: str,
    reason: str,
    priority: str,
) -> Decision:
    final_action = apply_constraints(action, state)

    return Decision(
        action=ActionType(final_action),
        reason=reason if final_action == action else f"{reason}; safety constraints selected {final_action}",
        priority=priority,
        expected_revenue=_estimate_capacity_revenue(final_action, normalized),
        metadata={
            "policy": "capacity_aware.v1",
            "trigger": trigger,
            "expected_demand": normalized["expected_demand"],
            "capacity": normalized["capacity"],
            "demand_gap": normalized["demand_gap"],
            "utilization": normalized["utilization"],
            "capacity_status": state.get("capacity_status"),
            "idle_capacity": state.get("idle_capacity"),
            "forecast_available": normalized["demand_forecast_available"],
            "forecast_source": state.get("demand_forecast_source"),
            "utilization_source": state.get("utilization_forecast_source"),
            "proposed_action": action,
            "final_action": final_action,
            "discounts_prevented": action.startswith("discount_") and final_action != action,
            "future_actions_supported": [
                ActionType.TRIGGER_CAMPAIGN_LOW_DEMAND.value,
                ActionType.GEO_TARGET_DISCOUNT.value,
                ActionType.SAME_DAY_OFFER.value,
            ],
        },
    )


def _estimate_capacity_revenue(action: str, normalized: Mapping[str, float | int]) -> float:
    if action == "increase_price":
        return round(float(normalized["expected_demand"]) * float(normalized["ltv"]) * 0.05, 2)

    if action == "discount_20":
        return round(float(normalized["idle_capacity"]) * float(normalized["capacity"]) * float(normalized["ltv"]) * 0.04, 2)

    if action == "discount_10":
        return round(float(normalized["idle_capacity"]) * float(normalized["capacity"]) * float(normalized["ltv"]) * 0.025, 2)

    if action == "call":
        return round(float(normalized["ltv"]) * float(normalized["churn_risk"]) * 0.20, 2)

    return 0.0


def decide_rule_based(state: Mapping[str, Any], config: RuleConfig | None = None) -> Decision:
    """Fallback rule policy retained for safety and local development."""

    rule_config = config or RuleConfig()
    normalized = _normalize_state(state)

    if normalized["churn_risk"] > rule_config.high_churn_threshold:
        return Decision(
            action=ActionType.CALL,
            reason="High churn risk detected for high-value customer segment",
            priority="high" if normalized["ltv"] >= rule_config.high_ltv_threshold else "medium",
            expected_revenue=round(normalized["ltv"] * normalized["churn_risk"] * 0.20, 2),
            metadata={"policy": "rules.v1", "trigger": "churn_risk"},
        )

    if normalized["pending_quotes"] > rule_config.pending_quotes_threshold:
        return Decision(
            action=ActionType.CALL,
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
            action=ActionType.DISCOUNT_10,
            reason="Technician utilization is below target",
            priority="medium",
            expected_revenue=round(normalized["ltv"] * 0.08, 2),
            metadata={"policy": "rules.v1", "trigger": "low_utilization"},
        )

    if normalized["conversion_rate"] < rule_config.low_conversion_threshold:
        return Decision(
            action=ActionType.DISCOUNT_10,
            reason="Conversion rate is below target",
            priority="medium",
            expected_revenue=round(normalized["ltv"] * 0.04, 2),
            metadata={"policy": "rules.v1", "trigger": "low_conversion"},
        )

    return Decision(
        action=ActionType.NONE,
        reason="No revenue intervention threshold was crossed",
        priority="low",
        expected_revenue=0.0,
        metadata={"policy": "rules.v1", "trigger": "none"},
    )


def _get_cached_action_models() -> dict[str, Any]:
    global _ACTION_MODELS_CACHE

    if _ACTION_MODELS_CACHE is None:
        _ACTION_MODELS_CACHE = load_action_models()

    return _ACTION_MODELS_CACHE


def _state_to_feature_frame(
    state: Mapping[str, Any],
    models: Mapping[str, Any],
) -> Any:
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError("pandas is required to evaluate action models") from exc

    feature_names = _infer_feature_names(models) or list(_normalize_state(state).keys())
    normalized = _normalize_state(state)
    row: dict[str, float | int] = {}

    for feature in feature_names:
        row[feature] = _coerce_numeric(state.get(feature, normalized.get(feature, 0.0)))

    return pd.DataFrame([row], columns=feature_names)


def _infer_feature_names(models: Mapping[str, Any]) -> list[str]:
    feature_names: list[str] = []

    for model in models.values():
        names = getattr(model, "feature_names_in_", None)
        if names is None:
            continue

        for name in list(names):
            text_name = str(name)
            if text_name not in feature_names:
                feature_names.append(text_name)

    return feature_names


def _prediction_to_float(raw_prediction: Any) -> float:
    if hasattr(raw_prediction, "iloc"):
        prediction = float(raw_prediction.iloc[0])
        if not math.isfinite(prediction):
            raise ValueError(f"Model returned a non-finite prediction: {prediction}")
        return prediction

    try:
        prediction = float(raw_prediction[0])
    except (TypeError, IndexError, KeyError):
        prediction = float(raw_prediction)

    if not math.isfinite(prediction):
        raise ValueError(f"Model returned a non-finite prediction: {prediction}")

    return prediction


def _priority_for_action(action: str, state: Mapping[str, Any]) -> str:
    normalized = _normalize_state(state)

    if action == "call" and normalized["churn_risk"] >= 0.70:
        return "high"

    if action in {
        "discount_20",
        "call",
        "trigger_campaign_low_demand",
        "geo_target_discount",
        "same_day_offer",
    }:
        return "medium"

    if action == "discount_10" and normalized["utilization"] < 0.60:
        return "medium"

    return "low"


def _normalize_state(state: Mapping[str, Any]) -> dict[str, float | int]:
    return {
        "utilization": _clamp_probability(state.get("utilization", 0.0)),
        "churn_risk": _clamp_probability(state.get("churn_risk", 0.0)),
        "ltv": max(0.0, _coerce_numeric(state.get("ltv", 0.0))),
        "pending_quotes": max(0, int(_coerce_numeric(state.get("pending_quotes", 0)))),
        "conversion_rate": _clamp_probability(state.get("conversion_rate", 0.0)),
        "expected_demand": max(0.0, _coerce_numeric(state.get("expected_demand", 0.0))),
        "capacity": max(0.0, _coerce_numeric(state.get("capacity", 0.0))),
        "demand_gap": _coerce_numeric(state.get("demand_gap", 0.0)),
        "idle_capacity": max(0.0, _coerce_numeric(state.get("idle_capacity", 0.0))),
        "demand_forecast_available": bool(state.get("demand_forecast_available", False)),
    }


def _clamp_probability(value: Any) -> float:
    number = _coerce_numeric(value)
    return min(1.0, max(0.0, number))


def _coerce_numeric(value: Any) -> float:
    if value is None or value == "":
        return 0.0

    try:
        return float(value)
    except (TypeError, ValueError):
        logger.warning("Non-numeric state feature value %r coerced to 0.0", value)
        return 0.0
