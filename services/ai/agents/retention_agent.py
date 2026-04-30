from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Literal, TypedDict

import joblib
import pandas as pd


logger = logging.getLogger(__name__)

Action = Literal[
    "premium_contract_offer",
    "discount_retention_offer",
    "maintenance_plan_offer",
    "no_action",
]
Channel = Literal["whatsapp", "email", "call"]
Priority = Literal["low", "medium", "high"]


class CustomerRecord(TypedDict, total=False):
    customer_id: str
    total_spend: float
    num_repairs: int
    avg_ticket_size: float
    days_since_last_service: int
    equipment_age: float
    preferred_channel: Channel


class Predictions(TypedDict):
    p_convert: float
    ltv: float
    churn_probability: float


class Offer(TypedDict):
    type: str
    discount: int


class RetentionOutput(TypedDict):
    customer_id: str
    p_convert: float
    ltv: float
    churn_probability: float
    score: float
    action: Action
    offer: Offer
    recommended_channel: Channel
    priority: Priority
    trigger_immediately: bool
    reason: str


class RetentionAgent:
    FEATURE_ORDER = [
        "total_spend",
        "num_repairs",
        "avg_ticket_size",
        "days_since_last_service",
        "equipment_age",
    ]
    VALID_CHANNELS: set[str] = {"whatsapp", "email", "call"}
    DEFAULT_CHANNEL: Channel = "email"

    def __init__(self, model_dir: str | Path | None = None) -> None:
        self.model_dir = Path(model_dir).resolve() if model_dir else self._default_model_dir()
        self.conversion_model = self._load_model("conversion_model.pkl")
        self.ltv_model = self._load_model("ltv_model.pkl")
        self.churn_model = self._load_model("churn_model.pkl")

    def build_features(self, customer: CustomerRecord) -> pd.DataFrame:
        normalized = self._normalize_customer(customer)
        feature_values = {
            feature: normalized[feature]
            for feature in self.FEATURE_ORDER
        }
        return pd.DataFrame([feature_values], columns=self.FEATURE_ORDER)

    def predict(self, customer: CustomerRecord) -> Predictions:
        features = self.build_features(customer)

        p_convert = self._predict_positive_probability(self.conversion_model, features)
        churn_probability = self._predict_positive_probability(self.churn_model, features)
        ltv = self._predict_regression_value(self.ltv_model, features)

        return {
            "p_convert": p_convert,
            "ltv": max(0.0, ltv),
            "churn_probability": churn_probability,
        }

    def decide_action(self, customer: CustomerRecord, predictions: Predictions) -> Action:
        normalized = self._normalize_customer(customer)
        p_convert = predictions["p_convert"]
        ltv = predictions["ltv"]
        churn_probability = predictions["churn_probability"]

        if p_convert > 0.75 and ltv > 1500:
            return "premium_contract_offer"

        if churn_probability > 0.7:
            return "discount_retention_offer"

        if normalized["num_repairs"] >= 3:
            return "maintenance_plan_offer"

        return "no_action"

    def generate_output(self, customer: CustomerRecord) -> RetentionOutput:
        normalized = self._normalize_customer(customer)
        predictions = self.predict(normalized)
        action = self.decide_action(normalized, predictions)
        score = self._calculate_score(predictions)

        output: RetentionOutput = {
            "customer_id": str(normalized["customer_id"]),
            "p_convert": round(predictions["p_convert"], 6),
            "ltv": round(predictions["ltv"], 2),
            "churn_probability": round(predictions["churn_probability"], 6),
            "score": round(score, 2),
            "action": action,
            "offer": self._build_offer(action),
            "recommended_channel": normalized["preferred_channel"],
            "priority": self._priority(score),
            "trigger_immediately": normalized["num_repairs"] >= 3,
            "reason": self._build_reason(normalized, predictions, action),
        }

        logger.info(
            "Retention decision generated",
            extra={
                "customer_id": output["customer_id"],
                "action": output["action"],
                "priority": output["priority"],
                "score": output["score"],
            },
        )
        return output

    def _load_model(self, file_name: str) -> Any:
        path = self.model_dir / file_name
        try:
            model = joblib.load(path)
        except FileNotFoundError as exc:
            logger.exception("Retention model artifact not found: %s", path)
            raise RuntimeError(f"Retention model artifact not found: {path}") from exc
        except Exception as exc:
            logger.exception("Failed to load retention model artifact: %s", path)
            raise RuntimeError(f"Failed to load retention model artifact: {path}") from exc

        logger.info("Loaded retention model artifact: %s", path)
        return model

    @classmethod
    def _default_model_dir(cls) -> Path:
        env_model_dir = os.getenv("RETENTION_MODEL_DIR")
        if env_model_dir:
            return Path(env_model_dir).resolve()

        current_file = Path(__file__).resolve()
        repo_root = current_file.parents[3]
        candidates = [
            current_file.parent / "models",
            current_file.parents[1] / "models",
            repo_root / "apps" / "churn-service" / "src" / "models",
            repo_root / "Server" / "src" / "services" / "ai" / "models",
            Path.cwd() / "apps" / "churn-service" / "src" / "models",
        ]

        required_files = {
            "conversion_model.pkl",
            "ltv_model.pkl",
            "churn_model.pkl",
        }
        for candidate in candidates:
            if all((candidate / file_name).exists() for file_name in required_files):
                return candidate.resolve()

        return candidates[0].resolve()

    @classmethod
    def _normalize_customer(cls, customer: CustomerRecord) -> dict[str, Any]:
        preferred_channel = str(customer.get("preferred_channel") or cls.DEFAULT_CHANNEL).lower()
        if preferred_channel not in cls.VALID_CHANNELS:
            preferred_channel = cls.DEFAULT_CHANNEL

        return {
            "customer_id": str(customer.get("customer_id") or ""),
            "total_spend": cls._safe_float(customer.get("total_spend")),
            "num_repairs": int(max(0, cls._safe_float(customer.get("num_repairs")))),
            "avg_ticket_size": cls._safe_float(customer.get("avg_ticket_size")),
            "days_since_last_service": int(
                max(0, cls._safe_float(customer.get("days_since_last_service")))
            ),
            "equipment_age": cls._safe_float(customer.get("equipment_age")),
            "preferred_channel": preferred_channel,
        }

    @staticmethod
    def _safe_float(value: Any, default: float = 0.0) -> float:
        if value is None:
            return default
        try:
            number = float(value)
        except (TypeError, ValueError):
            return default
        if pd.isna(number):
            return default
        return number

    @classmethod
    def _predict_positive_probability(cls, model: Any, features: pd.DataFrame) -> float:
        if not hasattr(model, "predict_proba"):
            raise RuntimeError(f"{type(model).__name__} does not support predict_proba")

        probabilities = model.predict_proba(features)[0]
        positive_index = cls._positive_class_index(model)
        if positive_index >= len(probabilities):
            positive_index = len(probabilities) - 1

        return cls._clamp_probability(float(probabilities[positive_index]))

    @staticmethod
    def _positive_class_index(model: Any) -> int:
        classes = getattr(model, "classes_", None)
        if classes is None:
            return 1

        for index, class_name in enumerate(classes):
            if str(class_name).lower() in {"1", "true", "yes", "convert", "converted", "churn"}:
                return index

        return 1 if len(classes) > 1 else 0

    @staticmethod
    def _predict_regression_value(model: Any, features: pd.DataFrame) -> float:
        if not hasattr(model, "predict"):
            raise RuntimeError(f"{type(model).__name__} does not support predict")
        return float(model.predict(features)[0])

    @staticmethod
    def _clamp_probability(value: float) -> float:
        return min(1.0, max(0.0, value))

    @staticmethod
    def _calculate_score(predictions: Predictions) -> float:
        return (
            predictions["p_convert"]
            * predictions["ltv"]
            * (1.0 - predictions["churn_probability"])
        )

    @staticmethod
    def _priority(score: float) -> Priority:
        if score > 1500:
            return "high"
        if 500 <= score <= 1500:
            return "medium"
        return "low"

    @staticmethod
    def _build_offer(action: Action) -> Offer:
        offers: dict[Action, Offer] = {
            "premium_contract_offer": {"type": "premium", "discount": 0},
            "discount_retention_offer": {"type": "discounted", "discount": 20},
            "maintenance_plan_offer": {"type": "standard", "discount": 10},
            "no_action": {"type": "none", "discount": 0},
        }
        return offers[action]

    @staticmethod
    def _build_reason(customer: dict[str, Any], predictions: Predictions, action: Action) -> str:
        if action == "premium_contract_offer":
            return "High conversion probability and high predicted lifetime value"
        if action == "discount_retention_offer":
            return "High churn probability"
        if action == "maintenance_plan_offer":
            if predictions["p_convert"] > 0.75:
                return "High repair frequency and high conversion probability"
            return "High repair frequency"
        if customer["num_repairs"] >= 3:
            return "High repair frequency requires immediate review"
        return "Customer does not meet retention targeting thresholds"


def run_retention_pipeline(customers: list[CustomerRecord]) -> list[RetentionOutput]:
    agent = RetentionAgent()
    results: list[RetentionOutput] = []

    for customer in customers:
        try:
            results.append(agent.generate_output(customer))
        except Exception:
            logger.exception(
                "Failed to generate retention output",
                extra={"customer_id": customer.get("customer_id", "")},
            )
            raise

    return results
