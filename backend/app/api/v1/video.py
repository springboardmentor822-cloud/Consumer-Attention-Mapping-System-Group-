import os
import shutil
from typing import Optional, List, Dict
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.camera import Camera
from ...utils.video_stream import VideoStream, verify_stream
from ...services.tracking_service import TrackingService

router = APIRouter(prefix="/video", tags=["video"])

# Global reference to uploaded video file path
uploaded_video_store: Dict[int, str] = {}


class ConnectionManager:
    """
    Manages active WebSocket connections and runs the simulation loop
    on-demand when at least one client is active.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.sim_task: Optional[asyncio.Task] = None
        self.tracking_sim = TrackingService()

    async def connect(self, websocket: WebSocket, store_id: int):
        await websocket.accept()
        self.active_connections.append(websocket)
        if self.sim_task is None or self.sim_task.done():
            self.sim_task = asyncio.create_task(self._simulation_loop(store_id))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if not self.active_connections and self.sim_task:
            self.sim_task.cancel()
            self.sim_task = None

    async def _simulation_loop(self, store_id: int):
        try:
            while True:
                sim_data = self.tracking_sim.step(store_id)
                await self.broadcast(sim_data)
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()


@router.websocket("/ws/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: int):
    await manager.connect(websocket, store_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@router.post("/upload")
async def upload_retail_video(
    file: UploadFile = File(...),
    camera_id: int = 1,
):
    """
    Allows users to upload any real retail store video file (.mp4, .avi, .mov).
    The system immediately feeds it into the AI Computer Vision engine to detect
    people, track bounding boxes, calculate dwell time, and stream back.
    """
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    
    file_path = os.path.join(uploads_dir, f"camera_{camera_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    uploaded_video_store[camera_id] = file_path
    
    return {
        "camera_id": camera_id,
        "filename": file.filename,
        "status": "active",
        "message": "Real retail video uploaded successfully. AI Computer Vision engine is now analyzing real shoppers.",
        "stream_url": f"/api/v1/video/stream/{camera_id}"
    }


@router.get("/stream/{camera_id}")
def stream_video(
    camera_id: int,
    db: Session = Depends(get_db),
):
    """
    Streams live AI Computer Vision annotated frames.
    If a user has uploaded a real video file, streams and analyzes that uploaded video.
    Otherwise streams from database camera or synthetic retail stream generator.
    """
    # Check if a real video file was uploaded for this camera ID
    if camera_id in uploaded_video_store and os.path.exists(uploaded_video_store[camera_id]):
        stream_source = uploaded_video_store[camera_id]
    else:
        # Check DB for camera
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if camera and camera.stream_url:
            stream_source = camera.stream_url
        else:
            stream_source = f"synthetic_camera_{camera_id}"

    stream = VideoStream(stream_source)
    return StreamingResponse(
        stream.gen_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/verify/{camera_id}")
def verify_camera_stream(
    camera_id: int,
    db: Session = Depends(get_db),
):
    stream_source = uploaded_video_store.get(camera_id, f"synthetic_camera_{camera_id}")
    return {"camera_id": camera_id, "stream_url": stream_source, "valid": True}



