from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from schemas import ChurnInput, ChurnResponse, FailureInput, FailureResponse
from services import compute_revenue_risk, predict_churn, predict_failure, recommend_action
from utils.logger import get_logger
from utils.model_loader import preload_models


LOGGER = get_logger("churn-service")


class RevenueRequest(BaseModel):
    churn: ChurnInput
    failure: FailureInput


class RevenueResponse(BaseModel):
    churn_probability: float = Field(..., ge=0, le=1)
    failure_probability: float = Field(..., ge=0, le=1)
    revenue_risk: float = Field(..., ge=0)
    recommended_action: str


@asynccontextmanager
async def lifespan(_: FastAPI):
    preload_models()
    yield


app = FastAPI(
    title="churn-service",
    version="1.0.0",
    description="Inference service for churn risk, failure risk, and revenue exposure.",
    lifespan=lifespan,
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid4())
    started_at = perf_counter()

    LOGGER.info(
        "request received",
        extra={
            "context": {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "client": request.client.host if request.client else None,
            }
        },
    )

    response = await call_next(request)

    duration_ms = round((perf_counter() - started_at) * 1000, 2)
    LOGGER.info(
        "request completed",
        extra={
            "context": {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            }
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    LOGGER.warning(
        "validation error",
        extra={
            "context": {
                "path": request.url.path,
                "errors": exc.errors(),
            }
        },
    )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(RuntimeError)
async def runtime_exception_handler(request: Request, exc: RuntimeError) -> JSONResponse:
    LOGGER.error(
        "runtime error",
        extra={
            "context": {
                "path": request.url.path,
                "error": str(exc),
            }
        },
    )
    return JSONResponse(status_code=500, content={"detail": str(exc)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    LOGGER.exception(
        "unhandled error",
        extra={
            "context": {
                "path": request.url.path,
                "error_type": type(exc).__name__,
            }
        },
    )
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict/churn", response_model=ChurnResponse)
async def predict_churn_endpoint(payload: ChurnInput) -> ChurnResponse:
    churn_probability = predict_churn(payload)
    return ChurnResponse(churn_probability=churn_probability)


@app.post("/predict/failure", response_model=FailureResponse)
async def predict_failure_endpoint(payload: FailureInput) -> FailureResponse:
    failure_probability = predict_failure(payload)
    return FailureResponse(failure_probability=failure_probability)


@app.post("/predict/revenue", response_model=RevenueResponse)
async def predict_revenue_endpoint(payload: RevenueRequest) -> RevenueResponse:
    try:
        churn_probability = predict_churn(payload.churn)
        failure_probability = predict_failure(payload.failure)
    except AttributeError as exc:
        raise HTTPException(status_code=400, detail="Invalid feature payload") from exc

    revenue_risk = compute_revenue_risk(
        churn_probability,
        failure_probability,
        payload.churn.avg_monthly_spend,
    )

    return RevenueResponse(
        churn_probability=churn_probability,
        failure_probability=failure_probability,
        revenue_risk=revenue_risk,
        recommended_action=recommend_action(churn_probability, failure_probability),
    )
