from pydantic import BaseModel, Field


class ChurnInput(BaseModel):
    days_since_last_service: float = Field(..., ge=0)
    service_count_last_year: float = Field(..., ge=0)
    avg_monthly_spend: float = Field(..., ge=0)
    customer_tenure_days: float = Field(..., ge=0)


class ChurnResponse(BaseModel):
    churn_probability: float = Field(..., ge=0, le=1)
