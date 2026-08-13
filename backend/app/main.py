import asyncio
import os
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from app.core.config import settings
from app.core.error_handlers import setup_error_handlers
from app.api.router import router as api_router
from app.utils.logging import get_structured_logger
from contextlib import asynccontextmanager

logger = get_structured_logger("main")
main_loop = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global main_loop
    main_loop = asyncio.get_running_loop()
    logger.info("Application starting up...", extra={"debug": settings.DEBUG, "project": settings.PROJECT_NAME})
    
    # Auto-create all tables (ensures camera_calibrations exists)
    from app.core.database import engine
    from app.models.base import Base
    Base.metadata.create_all(bind=engine)
    
    # Start Partitioned Redis Consumers in the background thread
    from app.workers.redis_consumer import start_redis_consumers
    import threading
    t = threading.Thread(target=start_redis_consumers, daemon=True)
    t.start()

    # Start Near-Real-Time Analytics Compiler Node in the background
    from app.workers.analytics_worker import start_analytics_worker
    asyncio.create_task(start_analytics_worker(interval=10.0))
    
    # Query database and automatically spin up YOLO/ByteTrack stream ingestion threads for cameras
    from app.core.database import SessionLocal
    from app.models.camera import Camera
    from app.services.video_ingestion import start_stream
    
    db = SessionLocal()
    try:
        cameras = db.query(Camera).filter(Camera.is_active == True).all()
        for cam in cameras:
            # Map http stream url to local file path to speed up OpenCV video capture
            video_src = cam.stream_url
            if "localhost:8000/" in video_src:
                path_part = video_src.split("localhost:8000/")[-1]
                if os.path.exists(path_part):
                    video_src = path_part
            logger.info(f"Launching YOLO ingestion thread for camera {cam.id} using source: {video_src}")
            start_stream(cam.id, video_src, cam.store_id, 1)
    except Exception as e:
        logger.error(f"Failed to auto-spin camera streams: {e}")
    finally:
        db.close()

    yield
    logger.info("Application shutting down...")
    
    # Shut down active OpenCV threads
    from app.services.video_ingestion import stop_stream
    try:
        db = SessionLocal()
        cameras = db.query(Camera).all()
        for cam in cameras:
            stop_stream(cam.id)
    except Exception:
        pass
    finally:
        db.close()


app = FastAPI(
    title=settings.PROJECT_NAME, 
    lifespan=lifespan,
    debug=settings.DEBUG
)

setup_error_handlers(app)

# Configure CORS allowed origins from settings
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")] if settings.CORS_ORIGINS else ["*"]

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trust proxy headers (e.g. from Nginx or ALB)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Include APIs
app.include_router(api_router, prefix="/api")

# Mount datasets folder to serve sample videos
from fastapi.staticfiles import StaticFiles
import os
datasets_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "datasets"))
app.mount("/datasets", StaticFiles(directory=datasets_path), name="datasets")



# Live WebSocket Coordinator
class ConnectionManager:
    def __init__(self):
        # Maps store_id -> list of active websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, store_id: str, websocket: WebSocket):
        await websocket.accept()
        if store_id not in self.active_connections:
            self.active_connections[store_id] = []
        self.active_connections[store_id].append(websocket)
        logger.info(f"New WebSocket client connected to store: {store_id}", extra={"store_id": store_id})

    def disconnect(self, store_id: str, websocket: WebSocket):
        if store_id in self.active_connections:
            self.active_connections[store_id].remove(websocket)
            if not self.active_connections[store_id]:
                del self.active_connections[store_id]
        logger.info(f"WebSocket client disconnected from store: {store_id}", extra={"store_id": store_id})

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, store_id: str, message: dict):
        if store_id in self.active_connections:
            for connection in self.active_connections[store_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to socket: {e}", extra={"store_id": store_id})

manager = ConnectionManager()


@app.websocket("/api/ws/{store_id}")
async def websocket_endpoint(websocket: WebSocket, store_id: str):
    await manager.connect(store_id, websocket)
    try:
        while True:
            # We just keep the connection alive. Client doesn't need to send, only receive
            data = await websocket.receive_text()
            # If client sends anything, just echo it back or ignore
            await manager.send_personal_message({"status": "alive"}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(store_id, websocket)


@app.get("/", summary="Root endpoint", description="Check basic deployment settings and system status.")
def read_root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
