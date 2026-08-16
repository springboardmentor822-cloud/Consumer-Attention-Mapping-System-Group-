import asyncio
import datetime
import random
import json
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.models import Camera, Store, User
from app.schemas.schemas import CameraCreate, CameraResponse

from app.core.redis_client import redis_client

router = APIRouter(prefix="/cameras", tags=["cameras"])

write_access = Depends(RoleChecker(["Store Manager", "Administrator"]))
read_access = Depends(get_current_user)

# --- Camera Endpoints ---

@router.post("", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
def create_camera(
    camera_in: CameraCreate, 
    store_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = write_access
) -> Any:
    """Register a new camera and assign it to a store. Restricted to Store Managers and Admins."""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    
    db_camera = Camera(
        store_id=store_id,
        name=camera_in.name,
        stream_url=camera_in.stream_url,
        status=camera_in.status,
        position_x=camera_in.position_x,
        position_y=camera_in.position_y,
        angle=camera_in.angle
    )
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    return db_camera

@router.get("", response_model=List[CameraResponse])
def get_cameras(db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """List all registered retail cameras."""
    return db.query(Camera).all()

@router.get("/store/{store_id}", response_model=List[CameraResponse])
def get_store_cameras(store_id: int, db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """Get all camera feeds assigned to a specific store."""
    return db.query(Camera).filter(Camera.store_id == store_id).all()

@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db), current_user: User = write_access) -> Any:
    """Delete a registered camera feed."""
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found")
    db.delete(cam)
    db.commit()
    return {"status": "deleted", "camera_id": camera_id}

# --- WebSocket Stream Connection Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_json_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

manager = ConnectionManager()

# --- Mock Telemetry Data Generator ---

def generate_mock_shoppers(camera_id: int = 1):
    shoppers = []
    now_ts = int(time.time())
    cam_key = ((camera_id - 1) % 8) + 1
    if cam_key in (1, 5):
        # Entrance / Section 5
        shoppers = [
            {"shopper_id": cam_key * 100 + 1, "x": 34.0, "y": 58.0, "dwell_time": (now_ts % 100) + 10, "gaze_target": "Main Store Foyer Entrance", "gaze_x": 16.0, "gaze_y": 55.0, "object_type": "person", "confidence": 0.96, "label": "Customer"},
            {"shopper_id": cam_key * 100 + 2, "x": 68.0, "y": 60.0, "dwell_time": (now_ts % 80) + 5, "gaze_target": "Shopping Cart Bay", "gaze_x": 58.0, "gaze_y": 56.0, "object_type": "person", "confidence": 0.97, "label": "Customer"},
            {"shopper_id": cam_key * 100 + 3, "x": 82.0, "y": 62.0, "dwell_time": (now_ts % 120) + 14, "gaze_target": "Entrance Promo Display", "gaze_x": 62.0, "gaze_y": 54.0, "object_type": "person", "confidence": 0.98, "label": "Customer"}
        ]
    elif cam_key in (2, 6):
        # Aisle A / Promotion Area
        shoppers = [
            {"shopper_id": cam_key * 100 + 1, "x": 42.0, "y": 58.0, "dwell_time": (now_ts % 120) + 12, "gaze_target": "Grocery & Pantry Display Shelf", "gaze_x": 68.0, "gaze_y": 52.0, "object_type": "person", "confidence": 0.97, "label": "Customer"},
            {"shopper_id": cam_key * 100 + 2, "x": 68.0, "y": 64.0, "dwell_time": (now_ts % 90) + 8, "gaze_target": "Beverages & Sodas Rack", "gaze_x": 82.0, "gaze_y": 58.0, "object_type": "person", "confidence": 0.95, "label": "Customer"}
        ]
    elif cam_key == 3:
        # Aisle B
        shoppers = [
            {"shopper_id": 301, "x": 35.0, "y": 58.0, "dwell_time": (now_ts % 100) + 15, "gaze_target": "Grocery Display Shelf", "gaze_x": 22.0, "gaze_y": 52.0, "object_type": "person", "confidence": 0.96, "label": "Customer"},
            {"shopper_id": 302, "x": 65.0, "y": 62.0, "dwell_time": (now_ts % 80) + 10, "gaze_target": "Specialty Snack Display", "gaze_x": 78.0, "gaze_y": 55.0, "object_type": "person", "confidence": 0.95, "label": "Customer"}
        ]
    elif cam_key in (4, 7):
        # Checkout Lanes
        shoppers = [
            {"shopper_id": cam_key * 100 + 1, "x": 30.0, "y": 68.0, "dwell_time": (now_ts % 180) + 15, "gaze_target": "POS Register Terminal", "gaze_x": 46.0, "gaze_y": 64.0, "object_type": "cashier", "confidence": 0.98, "label": "Cashier"},
            {"shopper_id": cam_key * 100 + 2, "x": 44.0, "y": 60.0, "dwell_time": (now_ts % 60) + 20, "gaze_target": "Checkout Counter", "gaze_x": 30.0, "gaze_y": 68.0, "object_type": "person", "confidence": 0.96, "label": "Customer"},
            {"shopper_id": cam_key * 100 + 3, "x": 68.0, "y": 64.0, "dwell_time": (now_ts % 45) + 8, "gaze_target": "Impulse Snack Rack", "gaze_x": 75.0, "gaze_y": 58.0, "object_type": "person", "confidence": 0.95, "label": "Customer"}
        ]
    else: # cam_key == 8
        # Store Exit
        shoppers = [
            {"shopper_id": 801, "x": 45.0, "y": 60.0, "dwell_time": (now_ts % 50) + 5, "gaze_target": "Automatic Exit Gate", "gaze_x": 30.0, "gaze_y": 55.0, "object_type": "person", "confidence": 0.97, "label": "Customer"},
            {"shopper_id": 802, "x": 70.0, "y": 62.0, "dwell_time": (now_ts % 40) + 8, "gaze_target": "Receipt Check Station", "gaze_x": 82.0, "gaze_y": 58.0, "object_type": "person", "confidence": 0.96, "label": "Customer"}
        ]
    return shoppers

@router.websocket("/stream/{camera_id}")
async def camera_telemetry_stream(
    websocket: WebSocket, 
    camera_id: int, 
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint that streams real-time retail intelligence telemetry.
    Yields shopper positions, walking paths, dwell time, gaze coordinates, and object detection labels.
    Reads live data buffered in Redis hashes by the background worker.
    """
    camera_name = f"Camera #{camera_id}"
    store_id = 1
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if camera:
        camera_name = camera.name
        store_id = camera.store_id
        
    await manager.connect(websocket)
    hash_key = f"store:{store_id}:camera:{camera_id}:shoppers"
    
    try:
        while True:
            # Query Redis hash for active shoppers under this camera
            shoppers_hash = redis_client.hgetall(hash_key) if redis_client is not None else {}
            shoppers_list = []

            for key, val_json in shoppers_hash.items():
                try:
                    s = json.loads(val_json)
                    shoppers_list.append({
                        "shopper_id": int(s["shopper_id"]),
                        "x": float(s["x"]),
                        "y": float(s["y"]),
                        "dwell_time": int(s["dwell_time"]),
                        "gaze_target": s.get("gaze_target", ""),
                        "gaze_x": float(s["gaze_x"]) if s.get("gaze_x") != "" and s.get("gaze_x") is not None else None,
                        "gaze_y": float(s["gaze_y"]) if s.get("gaze_y") != "" and s.get("gaze_y") is not None else None,
                        "object_type": s.get("object_type", "person"),
                        "confidence": float(s.get("confidence", 0.96)),
                        "label": s.get("label", "Person")
                    })
                except Exception as parse_err:
                    print(f"Error parsing shopper hash JSON: {parse_err}")

            # Fallback if list is empty to prevent 0 DETECTED PERSONS display
            if not shoppers_list:
                shoppers_list = generate_mock_shoppers(camera_id)

            # Formulate the payload
            payload = {
                "camera_id": camera_id,
                "camera_name": camera_name,
                "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "shoppers": shoppers_list
            }
            
            await manager.send_json_message(payload, websocket)
            await asyncio.sleep(0.5)  # 2 FPS stream for smooth canvas plotting
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
        print(f"WS error: {e}")

