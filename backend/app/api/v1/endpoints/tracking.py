import os
import shutil
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin_or_manager
from app.core.redis_client import get_redis, occupancy_key
from app.database import get_db
from app.models.store import Store
from app.models.tracking import TrackingData
from app.models.user import User
from app.schemas.behavior import TrackingDataCreate, TrackingDataOut
from app.services import detection_pipeline, tracking_simulator

router = APIRouter()


@router.post("", response_model=TrackingDataOut, status_code=201)
def ingest_tracking_point(
    payload: TrackingDataCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Single-point ingest, called by the YOLOv8 + tracker inference pipeline."""
    point = TrackingData(**payload.model_dump())
    db.add(point)
    db.commit()
    db.refresh(point)
    return point


@router.post("/batch", response_model=list[TrackingDataOut], status_code=201)
def ingest_tracking_batch(
    payloads: list[TrackingDataCreate],
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Batch ingest - preferred for real-time pipelines emitting many points per frame."""
    points = [TrackingData(**p.model_dump()) for p in payloads]
    db.add_all(points)
    db.commit()
    for p in points:
        db.refresh(p)
    return points


@router.get("", response_model=list[TrackingDataOut])
def list_tracking_points(
    session_id: int | None = None,
    camera_id: int | None = None,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(TrackingData)
    if session_id:
        query = query.filter(TrackingData.session_id == session_id)
    if camera_id:
        query = query.filter(TrackingData.camera_id == camera_id)
    return query.order_by(TrackingData.timestamp.asc()).offset(skip).limit(limit).all()


@router.post("/simulate/{store_id}/start")
async def start_simulation(
    store_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    """
    Starts the simulated camera/tracking pipeline for a store: virtual
    shoppers walk through Entrance -> Aisle -> Checkout, generating real
    tracking_data rows via Redis Streams + a background consumer, and
    live-broadcasting over the store's WebSocket. Stands in for a real
    YOLOv8 + ByteTrack pipeline reading actual camera video.
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    started = tracking_simulator.start(store_id)
    return {"store_id": store_id, "running": True, "already_running": not started}


@router.post("/simulate/{store_id}/stop")
async def stop_simulation(
    store_id: int,
    _user: User = Depends(require_admin_or_manager),
):
    stopped = tracking_simulator.stop(store_id)
    return {"store_id": store_id, "running": False, "was_running": stopped}


@router.get("/simulate/{store_id}/status")
def simulation_status(
    store_id: int,
    _user: User = Depends(get_current_user),
):
    return {"store_id": store_id, "running": tracking_simulator.is_running(store_id)}


@router.get("/occupancy/{store_id}")
async def get_occupancy(
    store_id: int,
    _user: User = Depends(get_current_user),
):
    """Live headcount per zone, read straight from a Redis hash - no
    Postgres query needed, so this is instant even under heavy tracking load."""
    r = get_redis()
    raw = await r.hgetall(occupancy_key(store_id))
    zones = {}
    total = 0
    for key, value in raw.items():
        count = max(0, int(value))
        if key == "total":
            total = count
        elif key.startswith("zone:"):
            zones[key.split(":", 1)[1]] = count
    return {"store_id": store_id, "total": total, "by_zone_index": zones}


@router.post("/detect-video/{store_id}")
async def detect_video(
    store_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    """
    Genuine YOLOv8 + ByteTrack detection on an uploaded video - real object
    detection and multi-object tracking, not simulated. Detects and tracks
    PEOPLE (COCO class 0, standing in for shoppers); it does not detect
    shelf products, since that needs a model custom-trained on SKU-110K /
    Retail Product Checkout data, which needs a GPU and hours of training
    time not available in this deployment.

    Points flow through the exact same Redis Stream -> consumer -> Postgres
    -> WebSocket pipeline the simulator uses, so they show up live on the
    same heatmap dashboard.
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    if detection_pipeline.is_processing(store_id):
        raise HTTPException(status_code=409, detail="Already processing a video for this store")

    if tracking_simulator.is_running(store_id):
        raise HTTPException(
            status_code=409,
            detail="Stop the running simulation for this store before uploading a real video",
        )

    suffix = os.path.splitext(file.filename or "")[1] or ".mp4"
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        shutil.copyfileobj(file.file, f)

    started = detection_pipeline.start_video_processing(store_id, tmp_path)
    if not started:
        os.remove(tmp_path)
        raise HTTPException(status_code=409, detail="Already processing a video for this store")

    return {"store_id": store_id, "processing": True, "filename": file.filename}


@router.get("/detect-video/{store_id}/status")
def detect_video_status(
    store_id: int,
    _user: User = Depends(get_current_user),
):
    return {"store_id": store_id, "processing": detection_pipeline.is_processing(store_id)}


@router.post("/detect-frame/{store_id}")
def detect_frame(
    store_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    """
    Real-time camera module: the browser sends ONE image at a time (a
    frame grabbed from the person's own webcam, roughly once a second),
    and this endpoint runs both trained models on it and hands back the
    boxes it found. The browser draws those boxes over the live video.

    This is deliberately NOT async: running two YOLO models is CPU-heavy
    work, and a plain `def` endpoint tells FastAPI to run it on a worker
    thread instead of the main event loop - an `async def` here would
    freeze every other request (including the WebSocket) for the ~200-400ms
    each frame takes to process.

    Unlike detect-video (which tracks people across a whole video with
    persistent IDs via ByteTrack), this endpoint has no memory between
    calls - each frame is analyzed completely fresh. That's the right
    trade-off for a live feed: the browser already shows a continuous
    picture, so there's no need to stitch frames together server-side too.
    """
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    import cv2
    import numpy as np

    image_bytes = file.file.read()
    frame = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode that image")

    model = detection_pipeline.get_person_model()
    people = []
    person_result = model(frame, classes=[0], verbose=False, conf=0.4)[0]
    if person_result.boxes is not None:
        for (cx, cy, w, h), conf in zip(
            person_result.boxes.xywhn.tolist(), person_result.boxes.conf.tolist()
        ):
            people.append(
                {"norm_x": round(cx, 4), "norm_y": round(cy, 4), "norm_w": round(w, 4), "norm_h": round(h, 4), "confidence": round(float(conf), 3)}
            )

    products = []
    product_model = detection_pipeline.get_product_model()
    if product_model is not None:
        product_result = product_model(frame, verbose=False, conf=0.25)[0]
        if product_result.boxes is not None:
            for (cx, cy, w, h), conf in zip(
                product_result.boxes.xywhn.tolist(), product_result.boxes.conf.tolist()
            ):
                products.append(
                    {"norm_x": round(cx, 4), "norm_y": round(cy, 4), "norm_w": round(w, 4), "norm_h": round(h, 4), "confidence": round(float(conf), 3)}
                )

    return {
        "store_id": store_id,
        "people": people,
        "products": products,
        "people_count": len(people),
        "product_count": len(products),
    }
