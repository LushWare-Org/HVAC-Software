from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


MODEL_DIR = Path(__file__).resolve().parent / "models"
MODEL_PATH = MODEL_DIR / "upsell_recommendation_model.pkl"
FEATURES_PATH = MODEL_DIR / "upsell_features.pkl"
LABEL_ENCODER_PATH = MODEL_DIR / "upsell_label_encoder.pkl"
DEFAULT_FEATURE_ORDER = [
    "equipment_age",
    "failure_count",
    "last_service_days",
    "avg_spend",
    "usage_hours_per_week",
]
DEFAULT_LABELS = ["maintenance_plan", "replacement", "service"]

model: Any | None = None
features: list[str] = DEFAULT_FEATURE_ORDER
labels: list[str] = DEFAULT_LABELS


class UpsellRequest(BaseModel):
    equipment_age: float = Field(..., ge=0)
    failure_count: int = Field(..., ge=0)
    last_service_days: int = Field(..., ge=0)
    avg_spend: float = Field(0, ge=0)
    usage_hours_per_week: float = Field(0, ge=0)
    churn_probability: float | None = Field(None, ge=0, le=1)
    failure_risk: float | None = Field(None, ge=0, le=1)


class UpsellResponse(BaseModel):
    recommended_offer: str
    confidence: float = Field(..., ge=0, le=1)
    all_scores: dict[str, float]
    rule_offer: str | None = None
    model_offer: str | None = None
    priority_score: float = Field(..., ge=0, le=1)


def load_model() -> None:
    global model, features, labels

    model = joblib.load(MODEL_PATH)
    if FEATURES_PATH.exists():
        features = list(joblib.load(FEATURES_PATH))

    if LABEL_ENCODER_PATH.exists():
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        labels = [str(label) for label in label_encoder.classes_]
    elif hasattr(model, "classes_"):
        labels = [str(label) for label in model.classes_]


app = FastAPI(title="upsell-agent", version="1.0.0")


@app.on_event("startup")
def startup() -> None:
    load_model()


def rule_engine(data: UpsellRequest) -> str | None:
    if data.equipment_age > 8:
        return "replacement"

    if data.failure_count > 2:
        return "maintenance_plan"

    if data.last_service_days > 180:
        return "service"

    return None


def extract_features(data: UpsellRequest) -> pd.DataFrame:
    row = {feature: getattr(data, feature, 0) for feature in features}
    return pd.DataFrame([row], columns=features)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommend-offer", response_model=UpsellResponse)
def recommend_offer(data: UpsellRequest) -> UpsellResponse:
    if model is None:
        raise HTTPException(status_code=503, detail="Upsell model is not loaded")

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

    return UpsellResponse(
        recommended_offer=recommended_offer,
        confidence=round(float(confidence), 4),
        all_scores={offer: round(float(score), 4) for offer, score in scores.items()},
        rule_offer=rule_offer,
        model_offer=model_offer,
        priority_score=round(float(priority_score), 4),
    )
