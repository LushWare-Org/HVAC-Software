from __future__ import annotations

import logging
import math
import pickle
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Mapping

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DEMAND_MODEL_PATH = PROJECT_ROOT / "models" / "demand_forecast_model.pkl"
DEFAULT_UTILIZATION_MODEL_PATH = PROJECT_ROOT / "models" / "utilization_model.pkl"
DEFAULT_PRICING_MODEL_PATH = PROJECT_ROOT / "models" / "pricing_model.pkl"
DEFAULT_TOTAL_TECHNICIANS = 10
DEFAULT_AVG_JOBS_PER_TECH = 7.0
DEFAULT_AVG_JOB_DURATION = 1.5
DEFAULT_TEMPERATURE = 82.0
DEFAULT_CURRENT_PRICE = 150.0
DEFAULT_MIN_PRICE = 100.0
DEFAULT_MAX_PRICE = 250.0
DEFAULT_MAX_DISCOUNT_PCT = 0.20
DEFAULT_MAX_PRICE_SPIKE_PCT = 0.35
DEFAULT_UNIT_COST = 70.0
DEFAULT_MIN_MARGIN_PCT = 0.25
DEFAULT_CANDIDATE_PRICES = (100.0, 120.0, 150.0, 180.0, 200.0, 250.0)


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
    total_technicians: int
    num_technicians: int
    avg_jobs_per_tech: float
    avg_job_duration: float
    capacity: float
    expected_demand: float
    demand_gap: float
    capacity_status: str
    idle_capacity: float
    customer_segment: str
    urgency: str
    current_price: float
    optimal_price: float
    expected_revenue: float
    demand_forecast_available: bool
    demand_forecast_source: str
    utilization_forecast_available: bool
    utilization_forecast_source: str
    pricing_model_available: bool
    pricing_model_source: str
    demand_forecast_error: str | None = None
    utilization_forecast_error: str | None = None
    pricing_model_error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


DEFAULT_MOCK_STATE = RevenueState(
    utilization=0.52,
    churn_risk=0.42,
    ltv=2450.00,
    pending_quotes=14,
    conversion_rate=0.31,
    total_technicians=DEFAULT_TOTAL_TECHNICIANS,
    num_technicians=DEFAULT_TOTAL_TECHNICIANS,
    avg_jobs_per_tech=DEFAULT_AVG_JOBS_PER_TECH,
    avg_job_duration=DEFAULT_AVG_JOB_DURATION,
    capacity=DEFAULT_TOTAL_TECHNICIANS * DEFAULT_AVG_JOBS_PER_TECH,
    expected_demand=round(0.52 * DEFAULT_TOTAL_TECHNICIANS * DEFAULT_AVG_JOBS_PER_TECH, 2),
    demand_gap=round(
        (0.52 * DEFAULT_TOTAL_TECHNICIANS * DEFAULT_AVG_JOBS_PER_TECH)
        - (DEFAULT_TOTAL_TECHNICIANS * DEFAULT_AVG_JOBS_PER_TECH),
        2,
    ),
    capacity_status="LOW",
    idle_capacity=0.48,
    customer_segment="standard",
    urgency="medium",
    current_price=DEFAULT_CURRENT_PRICE,
    optimal_price=DEFAULT_CURRENT_PRICE,
    expected_revenue=0.0,
    demand_forecast_available=False,
    demand_forecast_source="default_mock",
    utilization_forecast_available=False,
    utilization_forecast_source="default_mock",
    pricing_model_available=False,
    pricing_model_source="default_mock",
)

_DEMAND_MODEL_CACHE: Any | None = None
_UTILIZATION_MODEL_CACHE: Any | None = None
_PRICING_MODEL_CACHE: Any | None = None


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

    total_technicians = max(0, int(state_values.get("total_technicians", DEFAULT_TOTAL_TECHNICIANS)))
    num_technicians = max(
        0,
        int(state_values.get("num_technicians", total_technicians or DEFAULT_TOTAL_TECHNICIANS)),
    )
    avg_jobs_per_tech = max(
        0.0,
        float(state_values.get("avg_jobs_per_tech", DEFAULT_AVG_JOBS_PER_TECH)),
    )
    avg_job_duration = max(
        0.0,
        float(state_values.get("avg_job_duration", DEFAULT_AVG_JOB_DURATION)),
    )
    capacity = total_technicians * avg_jobs_per_tech
    forecast_time = state_values.get("forecast_time")
    temperature = state_values.get("temperature", DEFAULT_TEMPERATURE)

    forecast = forecast_demand(
        utilization=_clamp_probability(state_values["utilization"]),
        capacity=capacity,
        model_path=state_values.get("demand_model_path", DEFAULT_DEMAND_MODEL_PATH),
        now=forecast_time,
        temperature=temperature,
    )
    utilization_forecast = forecast_utilization(
        state={
            **state_values,
            "expected_demand": forecast["expected_demand"],
            "demand_gap": forecast["demand_gap"],
            "capacity": capacity,
            "total_technicians": total_technicians,
            "num_technicians": num_technicians,
            "avg_jobs_per_tech": avg_jobs_per_tech,
            "avg_job_duration": avg_job_duration,
            "forecast_time": forecast_time,
            "temperature": temperature,
        },
        fallback_utilization=state_values["utilization"],
        model_path=state_values.get("utilization_model_path", DEFAULT_UTILIZATION_MODEL_PATH),
    )
    utilization = utilization_forecast["utilization"]
    pricing_state = {
        **state_values,
        "expected_demand": forecast["expected_demand"],
        "utilization": utilization,
        "current_price": state_values.get("current_price", DEFAULT_CURRENT_PRICE),
        "customer_segment": state_values.get("customer_segment", DEFAULT_MOCK_STATE.customer_segment),
        "urgency": state_values.get("urgency", DEFAULT_MOCK_STATE.urgency),
    }
    pricing = find_optimal_price(
        pricing_state,
        model_path=state_values.get("pricing_model_path", DEFAULT_PRICING_MODEL_PATH),
    )

    return RevenueState(
        utilization=utilization,
        churn_risk=_clamp_probability(state_values["churn_risk"]),
        ltv=max(0.0, float(state_values["ltv"])),
        pending_quotes=max(0, int(state_values["pending_quotes"])),
        conversion_rate=_clamp_probability(state_values["conversion_rate"]),
        total_technicians=total_technicians,
        num_technicians=num_technicians,
        avg_jobs_per_tech=avg_jobs_per_tech,
        avg_job_duration=avg_job_duration,
        capacity=round(capacity, 2),
        expected_demand=forecast["expected_demand"],
        demand_gap=forecast["demand_gap"],
        capacity_status=capacity_status(utilization),
        idle_capacity=round(max(0.0, 1.0 - utilization), 2),
        customer_segment=str(state_values.get("customer_segment", DEFAULT_MOCK_STATE.customer_segment)),
        urgency=str(state_values.get("urgency", DEFAULT_MOCK_STATE.urgency)),
        current_price=round(_guarded_price(state_values.get("current_price", DEFAULT_CURRENT_PRICE), state_values), 2),
        optimal_price=pricing["optimal_price"],
        expected_revenue=pricing["expected_revenue"],
        demand_forecast_available=forecast["available"],
        demand_forecast_source=forecast["source"],
        utilization_forecast_available=utilization_forecast["available"],
        utilization_forecast_source=utilization_forecast["source"],
        pricing_model_available=pricing["available"],
        pricing_model_source=pricing["source"],
        demand_forecast_error=forecast["error"],
        utilization_forecast_error=utilization_forecast["error"],
        pricing_model_error=pricing["error"],
    )


def load_demand_model(model_path: str | Path = DEFAULT_DEMAND_MODEL_PATH) -> Any:
    """Load the demand forecasting model from disk.

    Model loading stays in the state layer so the decision engine only receives
    normalized business state, not forecasting implementation details.
    """

    global _DEMAND_MODEL_CACHE

    path = Path(model_path)
    if _DEMAND_MODEL_CACHE is None:
        with path.open("rb") as handle:
            _DEMAND_MODEL_CACHE = pickle.load(handle)

    return _DEMAND_MODEL_CACHE


def load_utilization_model(model_path: str | Path = DEFAULT_UTILIZATION_MODEL_PATH) -> Any:
    """Load the technician utilization forecasting model from disk."""

    global _UTILIZATION_MODEL_CACHE

    path = Path(model_path)
    if _UTILIZATION_MODEL_CACHE is None:
        with path.open("rb") as handle:
            _UTILIZATION_MODEL_CACHE = pickle.load(handle)

    return _UTILIZATION_MODEL_CACHE


def load_pricing_model(model_path: str | Path = DEFAULT_PRICING_MODEL_PATH) -> Any:
    """Load the dynamic pricing model from disk."""

    global _PRICING_MODEL_CACHE

    path = Path(model_path)
    if _PRICING_MODEL_CACHE is None:
        with path.open("rb") as handle:
            _PRICING_MODEL_CACHE = pickle.load(handle)

    return _PRICING_MODEL_CACHE


def forecast_demand(
    utilization: float,
    capacity: float,
    model_path: str | Path = DEFAULT_DEMAND_MODEL_PATH,
    now: datetime | str | None = None,
    temperature: Any = DEFAULT_TEMPERATURE,
) -> dict[str, Any]:
    """Predict future bookings and compare them with available job capacity."""

    try:
        model = load_demand_model(model_path)
        features = build_demand_features(now=now, temperature=temperature)
        expected_demand = _predict_demand(model, features)
        return {
            "expected_demand": round(expected_demand, 2),
            "demand_gap": round(expected_demand - capacity, 2),
            "available": True,
            "source": "demand_forecast_model",
            "error": None,
        }
    except Exception as exc:
        fallback_demand = max(0.0, utilization * capacity)
        logger.warning("Demand forecast failed; using utilization fallback: %s", exc)
        return {
            "expected_demand": round(fallback_demand, 2),
            "demand_gap": round(fallback_demand - capacity, 2),
            "available": False,
            "source": "utilization_fallback",
            "error": f"{type(exc).__name__}: {exc}",
        }


def build_demand_features(
    now: datetime | str | None = None,
    temperature: Any = DEFAULT_TEMPERATURE,
) -> dict[str, float | int]:
    """Create the time/weather features expected by demand_forecast_model.pkl."""

    forecast_time = _coerce_datetime(now)
    hour = forecast_time.hour
    month = forecast_time.month

    return {
        "hour": hour,
        "day_of_week": forecast_time.weekday(),
        "month": month,
        "temperature": float(temperature or DEFAULT_TEMPERATURE),
        "sin_hour": math.sin(2 * math.pi * hour / 24),
        "cos_hour": math.cos(2 * math.pi * hour / 24),
        "sin_month": math.sin(2 * math.pi * month / 12),
        "cos_month": math.cos(2 * math.pi * month / 12),
    }


def forecast_utilization(
    state: Mapping[str, Any],
    fallback_utilization: Any,
    model_path: str | Path = DEFAULT_UTILIZATION_MODEL_PATH,
) -> dict[str, Any]:
    """Predict workload utilization from demand, staffing, time, and weather."""

    try:
        model = load_utilization_model(model_path)
        features = build_utilization_features(state)
        utilization = _predict_utilization(model, features)
        return {
            "utilization": utilization,
            "available": True,
            "source": "utilization_model",
            "error": None,
        }
    except Exception as exc:
        fallback = _clamp_probability(fallback_utilization)
        logger.warning("Utilization forecast failed; using fallback utilization: %s", exc)
        return {
            "utilization": fallback,
            "available": False,
            "source": "state_fallback",
            "error": f"{type(exc).__name__}: {exc}",
        }


def build_utilization_features(state: Mapping[str, Any]) -> dict[str, float | int]:
    """Create features for utilization_model.pkl."""

    forecast_time = _coerce_datetime(state.get("forecast_time"))

    return {
        "expected_demand": float(state.get("expected_demand", 0.0)),
        "num_technicians": int(state.get("num_technicians", state.get("total_technicians", DEFAULT_TOTAL_TECHNICIANS))),
        "avg_job_duration": float(state.get("avg_job_duration", DEFAULT_AVG_JOB_DURATION)),
        "hour": forecast_time.hour,
        "day_of_week": forecast_time.weekday(),
        "month": forecast_time.month,
        "temperature": float(state.get("temperature") or DEFAULT_TEMPERATURE),
    }


def build_pricing_features(state: Mapping[str, Any], price: float) -> dict[str, float | int]:
    """Create features for pricing_model.pkl, including price as a decision input."""

    segment = str(state.get("customer_segment", DEFAULT_MOCK_STATE.customer_segment)).lower()
    urgency = str(state.get("urgency", DEFAULT_MOCK_STATE.urgency)).lower()

    features: dict[str, float | int] = {
        "expected_demand": float(state.get("expected_demand", 0.0)),
        "utilization": _clamp_probability(state.get("utilization", 0.0)),
        "churn_risk": _clamp_probability(state.get("churn_risk", 0.0)),
        "ltv": max(0.0, float(state.get("ltv", 0.0))),
        "price": float(price),
        "customer_segment_budget": 1 if segment == "budget" else 0,
        "customer_segment_premium": 1 if segment == "premium" else 0,
        "customer_segment_standard": 1 if segment not in {"budget", "premium"} else 0,
        "urgency_high": 1 if urgency == "high" else 0,
        "urgency_low": 1 if urgency == "low" else 0,
        "urgency_medium": 1 if urgency not in {"high", "low"} else 0,
    }
    return features


def find_optimal_price(
    state: Mapping[str, Any],
    model: Any | None = None,
    model_path: str | Path = DEFAULT_PRICING_MODEL_PATH,
) -> dict[str, Any]:
    """Score candidate prices and return the guarded revenue-maximizing price."""

    try:
        pricing_model = model or load_pricing_model(model_path)
        predicted_revenue: dict[float, float] = {}

        for candidate_price in DEFAULT_CANDIDATE_PRICES:
            price = _guarded_price(candidate_price, state)
            features = build_pricing_features(state, price)
            predicted_revenue[price] = _predict_pricing_revenue(pricing_model, features)

        best_price = max(predicted_revenue, key=predicted_revenue.get)
        return {
            "optimal_price": round(best_price, 2),
            "expected_revenue": round(predicted_revenue[best_price], 2),
            "available": True,
            "source": "pricing_model",
            "error": None,
            "candidate_revenues": {
                str(round(price, 2)): round(revenue, 2)
                for price, revenue in predicted_revenue.items()
            },
        }
    except Exception as exc:
        fallback_price = _guarded_price(state.get("current_price", DEFAULT_CURRENT_PRICE), state)
        fallback_revenue = float(state.get("expected_demand", 0.0)) * fallback_price
        logger.warning("Pricing optimization failed; using guarded current price: %s", exc)
        return {
            "optimal_price": round(fallback_price, 2),
            "expected_revenue": round(fallback_revenue, 2),
            "available": False,
            "source": "current_price_fallback",
            "error": f"{type(exc).__name__}: {exc}",
            "candidate_revenues": {},
        }


def capacity_status(utilization: float) -> str:
    if utilization < 0.60:
        return "LOW"

    if utilization < 0.85:
        return "MEDIUM"

    return "HIGH"


def _read_crm_signals(crm_client: Any) -> dict[str, float | int]:
    """Adapter boundary for future CRM/MongoDB integration."""

    if hasattr(crm_client, "get_revenue_signals"):
        signals = crm_client.get_revenue_signals()
        return {
            "utilization": signals.get("utilization", DEFAULT_MOCK_STATE.utilization),
            "pending_quotes": signals.get("pending_quotes", DEFAULT_MOCK_STATE.pending_quotes),
            "total_technicians": signals.get(
                "total_technicians",
                DEFAULT_MOCK_STATE.total_technicians,
            ),
            "avg_jobs_per_tech": signals.get(
                "avg_jobs_per_tech",
                DEFAULT_MOCK_STATE.avg_jobs_per_tech,
            ),
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


def _predict_demand(model: Any, features: Mapping[str, float | int]) -> float:
    feature_frame = _demand_feature_frame(model, features)
    raw_prediction = model.predict(feature_frame)
    prediction = _prediction_to_float(raw_prediction)

    if not math.isfinite(prediction):
        raise ValueError(f"Demand model returned a non-finite prediction: {prediction}")

    return max(0.0, prediction)


def _predict_utilization(model: Any, features: Mapping[str, float | int]) -> float:
    feature_frame = _model_feature_frame(model, features)
    raw_prediction = model.predict(feature_frame)
    prediction = _prediction_to_float(raw_prediction)

    if not math.isfinite(prediction):
        raise ValueError(f"Utilization model returned a non-finite prediction: {prediction}")

    return _clamp_probability(prediction)


def _predict_pricing_revenue(model: Any, features: Mapping[str, float | int]) -> float:
    feature_frame = _model_feature_frame(model, features)
    raw_prediction = model.predict(feature_frame)
    prediction = _prediction_to_float(raw_prediction)

    if not math.isfinite(prediction):
        raise ValueError(f"Pricing model returned a non-finite prediction: {prediction}")

    return max(0.0, prediction)


def _demand_feature_frame(model: Any, features: Mapping[str, float | int]) -> Any:
    return _model_feature_frame(model, features)


def _model_feature_frame(model: Any, features: Mapping[str, float | int]) -> Any:
    try:
        import pandas as pd
    except ImportError as exc:
        raise RuntimeError("pandas is required to evaluate model forecasts") from exc

    feature_names = [str(name) for name in getattr(model, "feature_names_in_", [])] or list(features)
    row = {name: float(features.get(name, 0.0)) for name in feature_names}
    return pd.DataFrame([row], columns=feature_names)


def _prediction_to_float(raw_prediction: Any) -> float:
    if hasattr(raw_prediction, "iloc"):
        return float(raw_prediction.iloc[0])

    try:
        return float(raw_prediction[0])
    except (TypeError, IndexError, KeyError):
        return float(raw_prediction)


def _coerce_datetime(value: datetime | str | None) -> datetime:
    if isinstance(value, datetime):
        return value

    if isinstance(value, str) and value:
        return datetime.fromisoformat(value)

    return datetime.now()


def _guarded_price(price: Any, state: Mapping[str, Any]) -> float:
    """Apply pricing safety guardrails before scoring or execution."""

    candidate = max(0.0, float(price))
    current_price = max(0.0, float(state.get("current_price", DEFAULT_CURRENT_PRICE)))
    min_price = max(0.0, float(state.get("min_price", DEFAULT_MIN_PRICE)))
    max_price = max(min_price, float(state.get("max_price", DEFAULT_MAX_PRICE)))
    max_discount_pct = _clamp_probability(state.get("max_discount_pct", DEFAULT_MAX_DISCOUNT_PCT))
    max_price_spike_pct = max(0.0, float(state.get("max_price_spike_pct", DEFAULT_MAX_PRICE_SPIKE_PCT)))
    unit_cost = max(0.0, float(state.get("unit_cost", DEFAULT_UNIT_COST)))
    min_margin_pct = _clamp_probability(state.get("min_margin_pct", DEFAULT_MIN_MARGIN_PCT))

    if current_price > 0:
        min_price = max(min_price, current_price * (1.0 - max_discount_pct))
        max_price = min(max_price, current_price * (1.0 + max_price_spike_pct))

    if min_margin_pct < 1.0:
        margin_floor = unit_cost / (1.0 - min_margin_pct)
        min_price = max(min_price, margin_floor)

    if candidate < min_price:
        candidate = min_price

    if candidate > max_price:
        candidate = max_price

    return candidate
