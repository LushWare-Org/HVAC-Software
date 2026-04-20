from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Mapping


@dataclass(frozen=True)
class RevenueState:
    """Snapshot of CRM and AI signals used by the revenue agent.

    The current implementation is intentionally mock-friendly. Real MongoDB,
    CRM API, and model service clients can be passed into build_state later
    without changing the agent loop or decision interface.
    """

    utilization: float
    churn_risk: float
    ltv: float
    pending_quotes: int
    conversion_rate: float

    def to_dict(self) -> dict[str, float | int]:
        return asdict(self)


DEFAULT_MOCK_STATE = RevenueState(
    utilization=0.52,
    churn_risk=0.78,
    ltv=2450.00,
    pending_quotes=14,
    conversion_rate=0.31,
)


def build_state(
    crm_client: Any | None = None,
    model_client: Any | None = None,
    overrides: Mapping[str, Any] | None = None,
) -> RevenueState:
    """Build the agent state from CRM and AI signals.

    Assumptions until live integrations are added:
    - crm_client will eventually read utilization and pending quote counts.
    - model_client will eventually read churn, LTV, and conversion outputs.
    - missing data falls back to deterministic mock values for local runs.
    """

    state_values = DEFAULT_MOCK_STATE.to_dict()

    if crm_client is not None:
        state_values.update(_read_crm_signals(crm_client))

    if model_client is not None:
        state_values.update(_read_model_signals(model_client))

    if overrides:
        state_values.update(dict(overrides))

    return RevenueState(
        utilization=_clamp_probability(state_values["utilization"]),
        churn_risk=_clamp_probability(state_values["churn_risk"]),
        ltv=max(0.0, float(state_values["ltv"])),
        pending_quotes=max(0, int(state_values["pending_quotes"])),
        conversion_rate=_clamp_probability(state_values["conversion_rate"]),
    )


def _read_crm_signals(crm_client: Any) -> dict[str, float | int]:
    """Adapter boundary for future CRM/MongoDB integration."""

    if hasattr(crm_client, "get_revenue_signals"):
        signals = crm_client.get_revenue_signals()
        return {
            "utilization": signals.get("utilization", DEFAULT_MOCK_STATE.utilization),
            "pending_quotes": signals.get("pending_quotes", DEFAULT_MOCK_STATE.pending_quotes),
        }

    return {}


def _read_model_signals(model_client: Any) -> dict[str, float]:
    """Adapter boundary for future model service integration."""

    if hasattr(model_client, "get_revenue_predictions"):
        predictions = model_client.get_revenue_predictions()
        return {
            "churn_risk": predictions.get("churn_risk", DEFAULT_MOCK_STATE.churn_risk),
            "ltv": predictions.get("ltv", DEFAULT_MOCK_STATE.ltv),
            "conversion_rate": predictions.get(
                "conversion_rate",
                DEFAULT_MOCK_STATE.conversion_rate,
            ),
        }

    return {}


def _clamp_probability(value: Any) -> float:
    number = float(value)
    return min(1.0, max(0.0, number))

