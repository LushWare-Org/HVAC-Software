from pydantic import BaseModel, Field


class FailureInput(BaseModel):
    equipment_age_days: float = Field(..., ge=0)
    days_since_last_service: float = Field(..., ge=0)
    service_count_last_year: float = Field(..., ge=0)
    usage_intensity: float = Field(..., ge=0)
    failure_history: float = Field(..., ge=0)


class FailureResponse(BaseModel):
    failure_probability: float = Field(..., ge=0, le=1)
