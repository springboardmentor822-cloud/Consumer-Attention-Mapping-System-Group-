from fastapi import APIRouter, status
from pydantic import BaseModel
from app.core.redis import redis_client

router = APIRouter()

class HealthResponse(BaseModel):
    status: str

class ReadyResponse(BaseModel):
    status: str
    redis: str

@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Get application health status",
    description="Returns 'healthy' if the service is up and running."
)
def health():
    return HealthResponse(status="healthy")

@router.get(
    "/ready",
    response_model=ReadyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get database and cache readiness status",
    description="Performs checks against external systems like Redis to verify system readiness."
)
def ready():
    # Standard health-check checks if DB or Redis are active
    redis_ok = redis_client.is_connected
    return ReadyResponse(
        status="ready" if redis_ok else "degraded",
        redis="connected" if redis_ok else "disconnected"
    )

@router.get(
    "/live",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Liveness check",
    description="Simple probe to check if the process container is alive."
)
def live():
    return HealthResponse(status="live")
