"""
Real object detection + multi-object tracking pipeline (Milestone 2, Steps 2-4).

Unlike tracking_simulator.py, nothing in this file is simulated: it loads a
genuine pretrained YOLOv8 model and runs Ultralytics' bundled ByteTrack
tracker over an uploaded video, exactly as Steps 2-4 of the brief describe.

What's real:
  - Step 2 (Object Detection): a real YOLOv8n model, pretrained on the COCO
    dataset - which is literally the dataset the assignment names for
    "baseline weights for tracking human bodies (Shoppers)". No training
    step is needed for this part; COCO's "person" class already does the job.
  - Step 2, product detection: a SECOND real model, transfer-learned from
    the same YOLOv8n base onto a 500-image subset of SKU-110K (dense shelf
    products) via Google Colab's free T4 GPU. Real mAP50 ~0.86 on its own
    held-out validation images. Runs alongside the person detector on every
    frame and broadcasts results live - see PRODUCT_MODEL_PATH below.
  - Step 3 & 4 (Multi-Object Tracking): Ultralytics ships ByteTrack built in.
    `model.track(...)` assigns each detected person a persistent ID that
    survives brief occlusion, frame to frame - the actual algorithm the
    brief asks for, not a stand-in.

Also real (added after the above, once shelves could actually be placed on
Store Layout): product-level attention/dwell tracking, via the same
app/services/attention_tracking.py module the simulator uses. Every tracked
person's floor position is checked each frame against that store's *placed*
shelves; lingering near one for long enough writes a real AttentionEvent
(and a chance of a PICKED_UP/PURCHASED interaction), so scoring_service.py
and recommendation_service.py get real signal from an actual uploaded video,
not just from the simulator.

What's honestly still missing, and why:
  - Persistent tracking IDs for products (ByteTrack is only applied to the
    person model here). Products don't move on their own, so this matters
    far less than it does for shoppers - each frame's detections are
    reported fresh rather than tracked across frames.
  - Real camera calibration. With no physical camera mounted, there's no
    real floor-plan homography to project pixel coordinates onto actual
    store coordinates. This uses a simple heuristic instead (top third of
    frame = Entrance, middle third = Aisle, bottom third = Checkout) -
    swap in real calibration once an actual camera exists. Product-attention
    proximity (above) inherits this same approximation, since it's built on
    the same normalized-coordinate -> floor-coordinate mapping.
  - A genuine PICKED_UP detection. Like the simulator, a pickup here is a
    duration-weighted probability, not something the model observed (there's
    no hand/product-removal signal in a person-detection model) - see
    attention_tracking.py for exactly how that estimate is made.
  - A real Retail Store Traffic Dataset video. This pipeline works on ANY
    video containing people (a webcam clip, a public domain clip, etc.) -
    upload one to see it run for real.

Everything downstream of this file is identical to the simulator's: the
same Redis Stream, the same batching consumer, the same Postgres table,
the same WebSocket broadcast, the same heatmap dashboard. This is a
drop-in alternative producer - swap this in for tracking_simulator.py and
nothing else in the pipeline needs to know the difference.
"""
import asyncio
import datetime as dt
import logging
import os
import uuid

from sqlalchemy.orm import Session

from app.core.redis_client import get_redis, occupancy_key, stream_key
from app.core.websocket_manager import manager
from app.database import SessionLocal
from app.models.session import ShopperSession
from app.models.store import Store
from app.services.attention_tracking import (
    AttentionState,
    close_attention,
    load_shelf_targets,
    update_attention,
)
from app.services.occupancy_alerts import check_overcrowding
from app.services.tracking_simulator import ensure_zones_and_cameras

logger = logging.getLogger("detection_pipeline")

_model = None  # lazy singleton - loading weights takes a couple of seconds
_product_model = None  # lazy singleton for the custom-trained product detector
_running: dict[int, asyncio.Task] = {}

# Trained on a 500-image subset of SKU-110K (dense shelf products), via
# transfer learning from yolov8n's COCO weights - see the training notebook
# for the full pipeline. Single class: "product". Real mAP50 ~0.86 on this
# model's own held-out validation set.
PRODUCT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml_models", "product_detector.pt")


def is_processing(store_id: int) -> bool:
    task = _running.get(store_id)
    return task is not None and not task.done()


def _get_model():
    """Loads the pretrained YOLOv8n weights once and reuses them for every
    subsequent video - this download is the exact `yolov8n.pt` file from
    `yolo predict model=yolov8n.pt ...`."""
    global _model
    if _model is None:
        from ultralytics import YOLO

        logger.info("Loading YOLOv8n (COCO pretrained) weights...")
        _model = YOLO("yolov8n.pt")
    return _model


def get_person_model():
    """Public entry point for the person/shopper detector - used by the
    video-upload pipeline and the live-camera endpoint alike, so both
    reuse the exact same loaded model instead of loading it twice."""
    return _get_model()


def _get_product_model():
    """Loads the custom-trained product/shelf detector (transfer-learned
    from YOLOv8n on a SKU-110K subset). Returns None if the weights file
    hasn't been supplied yet, so product detection degrades gracefully
    instead of crashing the whole pipeline."""
    global _product_model
    if _product_model is None:
        if not os.path.exists(PRODUCT_MODEL_PATH):
            logger.warning("Product detector weights not found at %s - skipping product detection.", PRODUCT_MODEL_PATH)
            return None
        from ultralytics import YOLO

        logger.info("Loading custom product-detection weights...")
        _product_model = YOLO(PRODUCT_MODEL_PATH)
    return _product_model


def get_product_model():
    """Public entry point for the product detector - same reasoning as
    get_person_model() above."""
    return _get_product_model()


def _zone_index_for_y(norm_y: float) -> int:
    """Simplified camera-position -> store-zone mapping (see module
    docstring for why this stands in for real calibration)."""
    if norm_y < 0.33:
        return 0  # Entrance / Exit Foyer
    if norm_y < 0.66:
        return 1  # Main Product Aisle
    return 2  # Checkout Lanes


def start_video_processing(store_id: int, video_path: str) -> bool:
    """Kicks off background processing of an uploaded video for this store.
    Returns False if this store is already processing one."""
    if is_processing(store_id):
        return False
    from app.services.tracking_consumer import consumer_loop  # local import avoids a cycle

    # The producer (below) pushes detected points into a Redis Stream, same
    # as the simulator does - but unlike the simulator's start(), nothing
    # was reading that stream and forwarding it to the browser. This
    # consumer is what turns those queued points into live WebSocket
    # updates and batched Postgres writes; without it, points sat in Redis
    # unread and the canvas stayed blank even though occupancy counters
    # (updated directly, separately) were correct.
    consumer_task = asyncio.create_task(consumer_loop(store_id))
    task = asyncio.create_task(_process_video(store_id, video_path, consumer_task))
    _running[store_id] = task
    return True


async def _process_video(store_id: int, video_path: str, consumer_task: asyncio.Task) -> None:
    db: Session = SessionLocal()
    try:
        zones, cameras = ensure_zones_and_cameras(db, store_id)
        store = db.query(Store).filter(Store.id == store_id).first()
        floor_w = float(store.floor_width_m) if store and store.floor_width_m else 30.0
        floor_h = float(store.floor_height_m) if store and store.floor_height_m else 18.0
        max_capacity = store.max_capacity if store else None
        zone_ids = [z.id for z in zones]
        camera_ids = [c.id for c in cameras]
        # Defensive on purpose - see the matching comment in
        # tracking_simulator.py's _producer_loop: this setup block runs
        # inside asyncio.create_task(), so an exception here kills video
        # processing silently with no way for the person to know it never
        # actually started. Core detection/tracking must never go dark just
        # because shelf-dwell data (an enhancement layered on top) failed.
        try:
            shelf_targets = load_shelf_targets(db, store_id)
        except Exception:  # noqa: BLE001
            logger.exception(
                "Could not load shelf targets for store %d - continuing without shelf-dwell tracking", store_id
            )
            shelf_targets = []
    finally:
        db.close()

    r = get_redis()
    model = _get_model()
    product_model = _get_product_model()

    import cv2

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    cap.release()
    # Pace emission to roughly match the video's own frame rate, so the live
    # dashboard "plays" the footage back at a realistic speed instead of
    # dumping an entire video's worth of points in a fraction of a second.
    frame_delay = max(0.02, min(1.0, 1.0 / fps))

    session_id_by_track: dict[int, int] = {}
    zone_by_track: dict[int, int] = {}
    attention_by_track: dict[int, AttentionState] = {}
    frames_processed = 0
    points_emitted = 0
    total_unique_people = 0
    SHELF_REFRESH_EVERY_FRAMES = 300  # picks up shelves placed after processing started

    def _open_session(track_id: int, zone_idx: int) -> int:
        """Creates a real ShopperSession row the first time a track ID is
        seen - same bookkeeping the simulator does for its virtual
        shoppers, so real detections show up in Analytics/session history
        too, not just the live heatmap."""
        db2 = SessionLocal()
        try:
            zone_id = zone_ids[min(zone_idx, len(zone_ids) - 1)] if zone_ids else None
            session = ShopperSession(
                store_id=store_id,
                shopper_uid=f"yolo-{store_id}-{track_id}-{uuid.uuid4().hex[:8]}",
                entry_time=dt.datetime.utcnow(),
                entry_zone_id=zone_id,
                zones_visited_count=1,
            )
            db2.add(session)
            db2.commit()
            db2.refresh(session)
            return session.id
        finally:
            db2.close()

    def _close_session(session_id: int, exit_zone_idx: int) -> None:
        db2 = SessionLocal()
        try:
            session = db2.query(ShopperSession).filter(ShopperSession.id == session_id).first()
            if session:
                session.exit_time = dt.datetime.utcnow()
                session.exit_zone_id = (
                    zone_ids[min(exit_zone_idx, len(zone_ids) - 1)] if zone_ids else None
                )
                session.total_duration_seconds = (
                    session.exit_time - session.entry_time
                ).total_seconds()
                db2.commit()
        finally:
            db2.close()

    try:
        results = model.track(
            source=video_path,
            tracker="bytetrack.yaml",
            classes=[0],  # COCO class 0 = person, standing in for "shopper"
            persist=True,
            stream=True,
            verbose=False,
        )
        for frame_result in results:
            frames_processed += 1
            boxes = frame_result.boxes

            current_frame_tracks: set[int] = set()
            if boxes is not None and boxes.id is not None:
                ids = boxes.id.tolist()
                xywhn = boxes.xywhn.tolist()
                confs = boxes.conf.tolist()

                # One DB session per frame (not per detection) for the
                # attention read/write below - update_attention/close_
                # attention each commit their own writes, so this just
                # amortizes connection setup across everyone in the frame.
                db_frame = SessionLocal()
                try:
                    for raw_id, (cx, cy, w, h), conf in zip(ids, xywhn, confs):
                        track_id = int(raw_id)
                        current_frame_tracks.add(track_id)
                        zone_idx = _zone_index_for_y(cy)

                        if track_id not in session_id_by_track:
                            session_id = _open_session(track_id, zone_idx)
                            session_id_by_track[track_id] = session_id
                            zone_by_track[track_id] = zone_idx
                            attention_by_track[track_id] = AttentionState(session_id=session_id)
                            total_unique_people += 1
                            await r.hincrby(occupancy_key(store_id), f"zone:{zone_idx}", 1)
                            new_total = await r.hincrby(occupancy_key(store_id), "total", 1)
                            await check_overcrowding(store_id, new_total, max_capacity)
                        elif zone_by_track.get(track_id) != zone_idx:
                            prev_zone = zone_by_track[track_id]
                            await r.hincrby(occupancy_key(store_id), f"zone:{prev_zone}", -1)
                            await r.hincrby(occupancy_key(store_id), f"zone:{zone_idx}", 1)
                            zone_by_track[track_id] = zone_idx

                        zone_id = zone_ids[min(zone_idx, len(zone_ids) - 1)] if zone_ids else None
                        camera_id = camera_ids[min(zone_idx, len(camera_ids) - 1)] if camera_ids else None

                        now_ts = dt.datetime.utcnow()
                        point = {
                            "session_id": session_id_by_track[track_id],
                            "camera_id": camera_id,
                            "zone_id": zone_id or "",
                            "track_id": track_id,
                            "floor_x": round(cx * floor_w, 2),
                            "floor_y": round(cy * floor_h, 2),
                            "norm_x": round(cx, 4),
                            "norm_y": round(cy, 4),
                            "norm_w": round(w, 4),
                            "norm_h": round(h, 4),
                            "bbox_x": round((cx - w / 2) * 1000, 1),
                            "bbox_y": round((cy - h / 2) * 600, 1),
                            "bbox_w": round(w * 1000, 1),
                            "bbox_h": round(h * 600, 1),
                            "detection_confidence": round(float(conf), 3),
                            "timestamp": now_ts.isoformat(),
                            "zone_index": zone_idx,
                        }
                        await r.xadd(stream_key(store_id), point, maxlen=20000, approximate=True)
                        points_emitted += 1

                        # Real product-level dwell tracking (see module
                        # docstring + app/services/attention_tracking.py) -
                        # a genuine detected person's floor position, checked
                        # against this store's placed shelves. Guarded on its
                        # own so a dwell-tracking failure for one person can
                        # never block the core position data (the xadd
                        # above, already sent) for the rest of this frame's
                        # detections.
                        try:
                            update_attention(
                                db_frame, attention_by_track[track_id], shelf_targets,
                                fx=point["floor_x"], fy=point["floor_y"],
                                camera_id=camera_id, now=now_ts,
                                in_aisle_zone=(zone_idx == 1),
                            )
                        except Exception:  # noqa: BLE001
                            logger.exception(
                                "update_attention failed for store %d track %d", store_id, track_id
                            )
                finally:
                    db_frame.close()

            # Real product/shelf detection - a second model, running on the
            # exact same frame the person-tracker just used (no extra video
            # decoding needed). Broadcast straight over the WebSocket rather
            # than through Redis Streams/Postgres: that pipeline's schema is
            # built around shopper sessions, which products aren't.
            if product_model is not None:
                product_boxes = product_model(frame_result.orig_img, verbose=False, conf=0.25)[0].boxes
                if product_boxes is not None and len(product_boxes) > 0:
                    products = []
                    for cx, cy, w, h in product_boxes.xywhn.tolist():
                        products.append({"norm_x": round(cx, 4), "norm_y": round(cy, 4), "norm_w": round(w, 4), "norm_h": round(h, 4)})
                    confs = product_boxes.conf.tolist()
                    for i, conf in enumerate(confs):
                        products[i]["confidence"] = round(float(conf), 3)
                    await manager.broadcast(
                        store_id,
                        {"type": "product_detections", "store_id": store_id, "count": len(products), "products": products},
                    )

            # Close out sessions for anyone who's left the frame (occlusion
            # tolerance is ByteTrack's job upstream; if a track truly ends,
            # this closes its session rather than leaving it open forever).
            vanished = set(session_id_by_track) - current_frame_tracks
            if vanished:
                db_vanish = SessionLocal()
                try:
                    now_ts = dt.datetime.utcnow()
                    for track_id in list(vanished):
                        state = attention_by_track.pop(track_id, None)
                        if state is not None:
                            try:
                                close_attention(db_vanish, state, now_ts)
                            except Exception:  # noqa: BLE001
                                logger.exception(
                                    "close_attention failed for store %d track %d", store_id, track_id
                                )
                        if track_id in zone_by_track:
                            zone_idx = zone_by_track.pop(track_id)
                            await r.hincrby(occupancy_key(store_id), f"zone:{zone_idx}", -1)
                            new_total = await r.hincrby(occupancy_key(store_id), "total", -1)
                            await check_overcrowding(store_id, new_total, max_capacity)
                            _close_session(session_id_by_track.pop(track_id), zone_idx)
                finally:
                    db_vanish.close()

            # Pick up shelves placed on Store Layout after this video started
            # processing, same as the simulator does.
            if frames_processed % SHELF_REFRESH_EVERY_FRAMES == 0:
                db_refresh = SessionLocal()
                try:
                    shelf_targets = load_shelf_targets(db_refresh, store_id)
                except Exception:  # noqa: BLE001
                    logger.exception("Could not refresh shelf targets for store %d", store_id)
                finally:
                    db_refresh.close()

            await asyncio.sleep(frame_delay)

    except Exception:  # noqa: BLE001
        logger.exception("Real detection pipeline failed for store %s", store_id)
    finally:
        # Close out anyone still "in store" when the video ended.
        now_ts = dt.datetime.utcnow()
        db_final = SessionLocal()
        try:
            for track_id, state in attention_by_track.items():
                try:
                    close_attention(db_final, state, now_ts)
                except Exception:  # noqa: BLE001
                    logger.exception("close_attention failed for store %d track %d", store_id, track_id)
        finally:
            db_final.close()

        for track_id, session_id in session_id_by_track.items():
            zone_idx = zone_by_track.get(track_id, 0)
            await r.hincrby(occupancy_key(store_id), f"zone:{zone_idx}", -1)
            new_total = await r.hincrby(occupancy_key(store_id), "total", -1)
            await check_overcrowding(store_id, new_total, max_capacity)
            _close_session(session_id, zone_idx)

        try:
            os.remove(video_path)
        except OSError:
            pass

        # Give the consumer a moment to drain and broadcast whatever's left
        # in the stream before stopping it - otherwise the last second or
        # so of points never reach the browser.
        await asyncio.sleep(3)
        consumer_task.cancel()

        logger.info(
            "Finished real detection for store %s: %d frames, %d unique people, %d points emitted",
            store_id, frames_processed, total_unique_people, points_emitted,
        )
