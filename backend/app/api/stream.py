import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
import redis

from backend.app.core.config import settings
from backend.app.core.security import require_roles
from backend.app.models.user import User
from pydantic import BaseModel
from typing import Optional
router = APIRouter(prefix="/stream", tags=["Stream Ingestion"])

# Simple connection pool for Redis
redis_client = redis.from_url(settings.redis_url)


class CoordinatePayload(BaseModel):
    store_id: UUID
    camera_id: str
    shopper_id: str
    x: float
    y: float
    timestamp: str  # ISO format


class FramePayload(BaseModel):
    store_id: UUID
    camera_id: str
    frame_base64: str
    timestamp: str

@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_coordinate(
    payload: CoordinatePayload,
    # In a real scenario, this would be authenticated via API keys or similar
    # For now, we allow it without strict role checks or use a generic one
):
    try:
        # Convert payload to dict and then json string to store in Redis
        data_dict = {
            "store_id": str(payload.store_id),
            "camera_id": payload.camera_id,
            "shopper_id": payload.shopper_id,
            "x": payload.x,
            "y": payload.y,
            "timestamp": payload.timestamp
        }
        
        # Add to Redis Stream
        redis_client.xadd("tracking_stream", {"data": json.dumps(data_dict)})
        return {"status": "accepted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/frame", status_code=status.HTTP_202_ACCEPTED)
async def ingest_frame(
    payload: FramePayload,
):
    try:
        data_dict = {
            "store_id": str(payload.store_id),
            "camera_id": payload.camera_id,
            "frame_base64": payload.frame_base64,
            "timestamp": payload.timestamp
        }
        
        # Add to Redis Stream specifically for frames
        redis_client.xadd("frame_stream", {"data": json.dumps(data_dict)})
        return {"status": "accepted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
