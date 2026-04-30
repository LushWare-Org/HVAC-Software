from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd


DEFAULT_FEATURE_ORDER = [
    "equipment_age",
    "failure_count",
    "last_service_days",
    "avg_spend",
    "usage_hours_per_week",
]
DEFAULT_LABELS = ["maintenance_plan", "replacement", "service"]
MODEL_FILE_NAME = "upsell_recommendation_model.pkl"


def rule_engine(data) -> str | None:
    if data.equipment_age > 8:
        return "replacement"

    if data.failure_count > 2:
        return "maintenance_plan"

    if data.last_service_days > 180:
        return "service"

    return None


class UpsellModelRegistry:
    _model: Any | None = None
    _features: list[str] | None = None
    _labels: list[str] | None = None
    _label_encoder: Any | None = None

    @classmethod
    def load(cls) -> None:
        if cls._model is not None:
            return

        model_path = cls._find_artifact(MODEL_FILE_NAME)
        try:
            cls._model = joblib.load(model_path)
        except FileNotFoundError as exc:
            raise RuntimeError(f"Upsell model artifact not found: {model_path}") from exc
        except Exception as exc:
            raise RuntimeError(f"Failed to load upsell model artifact: {model_path}") from exc

        cls._features = cls._load_optional_artifact("upsell_features.pkl", DEFAULT_FEATURE_ORDER)
        cls._label_encoder = cls._load_optional_artifact("upsell_label_encoder.pkl", None)
        cls._labels = cls._resolve_labels(cls._model, cls._label_encoder)

    @classmethod
    def get_model(cls) -> Any:
        cls.load()
        return cls._model

    @classmethod
    def get_features(cls) -> list[str]:
        cls.load()
        return cls._features or DEFAULT_FEATURE_ORDER

    @classmethod
    def get_labels(cls) -> list[str]:
        cls.load()
        return cls._labels or DEFAULT_LABELS

    @classmethod
    def _find_artifact(cls, file_name: str) -> Path:
        service_models_dir = Path(__file__).resolve().parent.parent / "models"
        candidates = [
            service_models_dir / file_name,
        ]

        parents = Path(__file__).resolve().parents
        if len(parents) > 4:
            candidates.append(parents[4] / "Server" / "src" / "services" / "ai" / "models" / file_name)

        for path in candidates:
            if path.exists():
                return path

        return candidates[0]

    @classmethod
    def _load_optional_artifact(cls, file_name: str, fallback):
        path = cls._find_artifact(file_name)
        if not path.exists():
            return fallback
        return joblib.load(path)

    @classmethod
    def _resolve_labels(cls, model, label_encoder) -> list[str]:
        if label_encoder is not None and hasattr(label_encoder, "classes_"):
            return [str(label) for label in label_encoder.classes_]
        if hasattr(model, "classes_"):
            return [str(label) for label in model.classes_]
        return DEFAULT_LABELS


def extract_features(data) -> pd.DataFrame:
    features = UpsellModelRegistry.get_features()
    values = {feature: getattr(data, feature, 0) for feature in features}
    return pd.DataFrame([values], columns=features)


def recommend_offer(data) -> dict[str, Any]:
    model = UpsellModelRegistry.get_model()
    labels = UpsellModelRegistry.get_labels()
    df = extract_features(data)

    probs = model.predict_proba(df)[0]
    scores = {
        labels[index] if index < len(labels) else str(index): float(probability)
        for index, probability in enumerate(probs)
    }

    rule_offer = rule_engine(data)
    if rule_offer:
        scores[rule_offer] = min(1.0, scores.get(rule_offer, 0.0) + 0.2)

    total = sum(scores.values())
    if total > 1:
        scores = {offer: score / total for offer, score in scores.items()}

    recommended_offer, confidence = max(scores.items(), key=lambda item: item[1])
    model_offer = labels[int(probs.argmax())] if len(labels) > int(probs.argmax()) else str(int(probs.argmax()))
    priority_score = min(
        1.0,
        (confidence * 0.7)
        + ((data.churn_probability or 0) * 0.15)
        + ((data.failure_risk or 0) * 0.15),
    )

    return {
        "recommended_offer": recommended_offer,
        "confidence": round(float(confidence), 4),
        "all_scores": {offer: round(float(score), 4) for offer, score in scores.items()},
        "rule_offer": rule_offer,
        "model_offer": model_offer,
        "priority_score": round(float(priority_score), 4),
    }
