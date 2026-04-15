from pydantic import BaseModel, Field


class UpsellInput(BaseModel):
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
