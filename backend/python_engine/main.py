"""
CAMS FastAPI Backend — Main Entry Point
=======================================
Extends existing REST analytics endpoints with:
  - WebSocket streaming: /cams/stream/{cameraId}
  - One independent detection session per camera
  - YOLOv8 + ByteTrack via detection_engine.py

Existing REST endpoints are UNCHANGED.
"""

import sys
import os
import asyncio
import logging
import json
from pathlib import Path

from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Load .env from backend directory
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Add directory to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from behavior_engine import behavior_engine
from heatmap_engine import heatmap_engine
from attractiveness_engine import attractiveness_engine
from recommendation_engine import recommendation_engine
from detection_engine import get_or_create_session, get_session, YOLO_MODEL, YOLO_DEVICE

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Video file paths — relative to project root
# The frontend serves these from /public/videos/ but the backend reads the
# same files directly from the filesystem via their absolute path.
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent.parent
VIDEO_ROOT   = PROJECT_ROOT / "frontend" / "public" / "videos"

CAMERA_VIDEO_MAP = {
    "CAM-01": str(VIDEO_ROOT / "store1.mp4"),
    "CAM-02": str(VIDEO_ROOT / "aisle1.mp4"),
    "CAM-03": str(VIDEO_ROOT / "checkout1.mp4"),
    "CAM-04": str(VIDEO_ROOT / "checkout2.mp4"),
}

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CAMS Retail Analytics AI Engine",
    description=(
        "Consumer Attention Mapping System — Behavior, Heatmap, Attractiveness, "
        "Recommendation, and Live Person Detection API"
    ),
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup: pre-load model and pre-start all camera sessions
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("CAMS Backend starting up...")
    logger.info(f"YOLO model: {YOLO_MODEL}  device: {YOLO_DEVICE}")
    logger.info(f"Video root: {VIDEO_ROOT}")

    # Pre-load YOLO model so first WebSocket connection is fast
    try:
        from detection_engine import get_yolo_model
        await asyncio.get_running_loop().run_in_executor(None, get_yolo_model)
        logger.info("YOLO model pre-loaded ✓")
    except Exception as exc:
        logger.error(f"YOLO model pre-load failed: {exc}")

    # Pre-start detection sessions for all cameras
    for cam_id, video_path in CAMERA_VIDEO_MAP.items():
        if not Path(video_path).exists():
            logger.warning(f"Video file missing for {cam_id}: {video_path}")
            continue
        get_or_create_session(cam_id, video_path)
        logger.info(f"Detection session started: {cam_id}")


# ---------------------------------------------------------------------------
# WebSocket — Live Person Tracking Stream
# ---------------------------------------------------------------------------
@app.websocket("/cams/stream/{camera_id}")
async def websocket_stream(websocket: WebSocket, camera_id: str):
    """
    Per-camera WebSocket endpoint.
    Sends JSON tracking payloads as YOLOv8+ByteTrack detects people.

    Payload format:
    {
      "type": "tracks",
      "cameraId": "CAM-01",
      "source": { "width": 1920, "height": 1080 },
      "tracks": [ { "trackId": "TRK-001", "bbox": {x,y,w,h}, "confidence": 0.87, ... } ],
      "timestamp": 1699999999999
    }
    """
    await websocket.accept()
    logger.info(f"WebSocket connected: {camera_id} from {websocket.client}")

    camera_id_upper = camera_id.upper()

    if camera_id_upper not in CAMERA_VIDEO_MAP:
        await websocket.send_json({
            "type": "error",
            "message": f"Unknown camera ID: {camera_id}. Valid: {list(CAMERA_VIDEO_MAP.keys())}",
        })
        await websocket.close(code=4004)
        return

    video_path = CAMERA_VIDEO_MAP[camera_id_upper]
    if not Path(video_path).exists():
        await websocket.send_json({
            "type": "error",
            "message": f"Video file not found: {video_path}",
        })
        await websocket.close(code=4005)
        return

    # Get or create the detection session
    session = get_or_create_session(camera_id_upper, video_path)

    # Register this WebSocket's send function as a subscriber
    async def send_fn(message: str):
        await websocket.send_text(message)

    await session.add_subscriber(send_fn)

    # Notify client of connection success
    await websocket.send_json({
        "type": "connected",
        "cameraId": camera_id_upper,
        "message": f"Streaming {camera_id_upper} — YOLO: {YOLO_MODEL}",
    })

    try:
        # Keep the connection alive by receiving messages/pings
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_text("pong")
                    continue

                # Parse client JSON payloads
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "sync" and "time" in msg:
                        session.request_sync_time(float(msg["time"]))
                except Exception:
                    pass
            except asyncio.TimeoutError:
                # Send keepalive ping
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {camera_id_upper}")
    except Exception as exc:
        logger.warning(f"WebSocket error {camera_id_upper}: {exc}")
    finally:
        await session.remove_subscriber(send_fn)


# ---------------------------------------------------------------------------
# Existing Pydantic Models (unchanged)
# ---------------------------------------------------------------------------
class TrackingPoint(BaseModel):
    x: float
    y: float
    t: Optional[float] = None


class TrajectoryRequest(BaseModel):
    shopper_id: str
    points: List[TrackingPoint]
    pickups: Optional[int] = 0
    returns: Optional[int] = 0
    comparisons: Optional[int] = 0


# ---------------------------------------------------------------------------
# Existing REST Endpoints (ALL UNCHANGED)
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "system": "Consumer Attention Mapping System (CAMS) Engine",
        "version": "4.0.0",
        "status": "Online",
        "docs_url": "/docs",
        "websocket": "/cams/stream/{cameraId}",
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "CAMS Milestone 4 — YOLOv8 + ByteTrack",
        "yolo_model": YOLO_MODEL,
        "cameras": list(CAMERA_VIDEO_MAP.keys()),
    }


@app.post("/api/v1/behavior/trajectory")
def calculate_shopper_trajectory(req: TrajectoryRequest):
    pts = [{"x": p.x, "y": p.y, "t": p.t} for p in req.points]
    trajectory = behavior_engine.calculate_trajectory(pts)
    segment = behavior_engine.classify_shopper_segment(
        trajectory, req.pickups, req.returns, req.comparisons
    )
    return {
        "shopper_id": req.shopper_id,
        "trajectory": trajectory,
        "segmentation": segment,
    }


@app.get("/api/v1/heatmap")
def get_heatmap(
    layer: str = Query("Store Traffic"),
    period: str = Query("Last 7 Days"),
):
    return heatmap_engine.get_heatmap_layer(layer, period)


@app.get("/api/v1/attractiveness/scores")
def get_attractiveness_scores():
    return attractiveness_engine.compute_sku_scores()


@app.get("/api/v1/recommendations")
def get_merchandising_recommendations():
    scores = attractiveness_engine.compute_sku_scores()
    return recommendation_engine.generate_recommendations(scores)


@app.get("/api/v1/dashboards/store-manager")
def get_store_manager_analytics(period: str = Query("Last 7 Days")):
    heatmap_data = heatmap_engine.get_heatmap_layer("Store Traffic", period)
    scores = attractiveness_engine.compute_sku_scores()
    recs = recommendation_engine.generate_recommendations(scores)
    return {
        "period": period,
        "kpis": {
            "totalVisitors": 2450 if period == "Last 7 Days" else 350,
            "avgDwellTime": 18.5,
            "conversionRate": 24.2,
            "productsPicked": 1245,
        },
        "heatmap": heatmap_data,
        "attractiveness_scores": scores[:5],
        "recommendations": recs,
    }


@app.get("/api/v1/dashboards/retail-analyst")
def get_retail_analyst_analytics(period: str = Query("Last 7 Days")):
    scores = attractiveness_engine.compute_sku_scores()
    return {
        "period": period,
        "segmentation": [
            {"segment": "Explorer",              "share": "32%", "count": 784},
            {"segment": "Quick Buyer",           "share": "28%", "count": 686},
            {"segment": "Comparison Shopper",    "share": "18%", "count": 441},
            {"segment": "Impulse Buyer",         "share": "14%", "count": 343},
            {"segment": "Brand Loyal Customer",  "share": "8%",  "count": 196},
        ],
        "sku_rankings": scores,
    }


@app.get("/api/v1/dashboards/marketing-manager")
def get_marketing_manager_analytics(period: str = Query("Last 7 Days")):
    return {
        "period": period,
        "campaigns": [
            {"name": "Summer Organic Festival",    "reach": 4200, "conversion": "32.4%", "roi": "4.2x"},
            {"name": "Bakery Artisan Promo",       "reach": 2800, "conversion": "28.6%", "roi": "3.8x"},
            {"name": "Beverages Hydration Hub",    "reach": 5100, "conversion": "41.2%", "roi": "5.1x"},
        ],
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
