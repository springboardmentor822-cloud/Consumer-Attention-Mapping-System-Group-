import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
import redis

from backend.app.core.config import settings
from backend.app.core.security import require_roles
from backend.app.models.user import User
from pydantic import BaseModel
from typing import Optional, List, Union
from backend.app.api.websockets import manager, video_manager
from backend.app.workers.db_worker import coordinate_queue

router = APIRouter(prefix="/stream", tags=["Stream Ingestion"])

# Simple connection pool for Redis (fail silently if not running)
try:
    redis_client = redis.from_url(settings.redis_url)
    redis_client.ping()
except Exception:
    redis_client = None


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
    payload: Union[CoordinatePayload, List[CoordinatePayload]],
):
    try:
        payloads = payload if isinstance(payload, list) else [payload]
        for p in payloads:
            # Convert payload to dict and then json string to store in Redis
            data_dict = {
                "store_id": str(p.store_id),
                "camera_id": p.camera_id,
                "shopper_id": p.shopper_id,
                "x": p.x,
                "y": p.y,
                "timestamp": p.timestamp
            }
            
            # Broadcast directly to websocket managers
            await manager.broadcast_to_store(json.dumps(data_dict), str(p.store_id))
            
            # Add to local queue for DB saving and spatial processing
            coordinate_queue.put_nowait(data_dict)
            
        return {"status": "accepted"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/zones/{store_id}")
def get_stream_zones(store_id: UUID):
    from backend.app.core.database import SessionLocal
    from backend.app.models.zone import Zone
    db = SessionLocal()
    try:
        zones = db.query(Zone).filter(Zone.store_id == store_id).all()
        return [{"id": z.id, "zone_name": z.zone_name, "coordinates": z.coordinates} for z in zones]
    finally:
        db.close()

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
        
        # Broadcast directly to websocket managers
        await video_manager.broadcast_to_store(json.dumps(data_dict), str(payload.store_id))
        return {"status": "accepted"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

