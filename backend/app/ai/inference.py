"""
AI Processing Pipeline - Generates annotated video with bounding boxes + IDs
"""

from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import Callable

import cv2
import numpy as np

from app.ai import coordinates as coord_module
from app.ai.detector import detect_people, detect_products_and_shelves
from app.ai.preprocessing import enhance_frame
from app.ai.tracker import CustomerTracker, ProductTracker
from app.ai.video_processor import extract_frames, get_video_metadata, load_video, resize_frames

logger = logging.getLogger(__name__)

BACKEND_ROOT = Path(__file__).resolve().parents[2]
ANNOTATED_DIR = BACKEND_ROOT / "uploads" / "annotated"
ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)

# YOLO-World (product/shelf) is ~9x slower per-frame than the person model on
# this CPU and dominates total processing time. Running it every Nth
# processed frame instead of every frame - and reusing the last-known boxes
# in between - cuts total processing time substantially with minimal loss of
# coverage, since shelves/products don't move frame-to-frame the way people
# do. Person detection + tracking still runs on every processed frame.
WORLD_DETECT_INTERVAL = 3

# The VP8/WebM writer becomes unreliable (corrupts the container) on very
# large frames over a long processing run - confirmed on a 3840x2160 source,
# consistently, regardless of contention. Capping the *output* video's
# height (never upscaling) keeps the writer stable; detection still runs
# against the full-resolution frame beforehand, so box placement accuracy
# is unaffected - only the saved video's pixel dimensions shrink.
MAX_OUTPUT_HEIGHT = 1080


def latest_snapshot_url(camera_id: int) -> str | None:
    """URL for the most recent annotated frame saved for this camera, or None if it has never been processed."""
    path = ANNOTATED_DIR / f"camera_{camera_id}_latest.jpg"
    if not path.exists():
        return None
    # Every reprocessing run overwrites this same filename, so a cache-busting
    # query param is required - otherwise the browser (and React, which keys
    # off this URL) never notices the file changed and keeps showing whatever
    # was fetched from a previous run.
    return f"/annotated/{path.name}?v={int(path.stat().st_mtime)}"


def latest_video_url(camera_id: int) -> str | None:
    """URL for the most recent full annotated video for this camera, or None if it has never been processed."""
    path = ANNOTATED_DIR / f"camera_{camera_id}_latest.webm"
    if not path.exists():
        return None
    return f"/annotated/{path.name}?v={int(path.stat().st_mtime)}"


def detect_products_on_latest_snapshot(camera_id: int) -> int | None:
    """Live product count from this camera's most recent raw (unannotated)
    snapshot, for the shelf empty/missing-product cross-check in
    analytics_dashboard.py's shelf_analysis(). Returns None if this camera
    has never been processed - a shelf with no snapshot yet has nothing to
    cross-check against, which is different from a shelf that was checked
    and found empty (0)."""
    path = ANNOTATED_DIR / f"camera_{camera_id}_latest_raw.jpg"
    if not path.exists():
        return None
    frame = cv2.imread(str(path))
    if frame is None:
        return None
    products, _shelves = detect_products_and_shelves(frame)
    return len(products)


def draw_tracks(frame: np.ndarray, tracks: list[dict]) -> np.ndarray:
    annotated = frame.copy()

    for t in tracks:
        bbox = t.get("bbox") or t.get("xyxy")
        customer_id = t.get("customer_id") or t.get("track_id")
        conf = t.get("confidence", 0.0)

        if bbox is None or customer_id is None:
            continue

        x1, y1, x2, y2 = map(int, bbox)
        color = (59, 130, 246)  # Blue in BGR

        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        label = f"ID:{customer_id} {conf:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)

        cv2.rectangle(annotated, (x1, y1 - th - 10), (x1 + tw + 8, y1), color, -1)
        cv2.putText(
            annotated,
            label,
            (x1 + 4, y1 - 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

    return annotated


def draw_products(frame: np.ndarray, product_boxes: list[list[float]]) -> np.ndarray:
    """
    Draws product boxes in a different color/style than draw_tracks() - no
    ID label, since products aren't run through ByteTrack (they're static
    per-frame detections, not tracked objects with persistent identity).
    """
    annotated = frame.copy()
    color = (16, 185, 129)  # Green in BGR

    for bbox in product_boxes:
        x1, y1, x2, y2 = map(int, bbox)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 1)

    return annotated


def _scale_bbox(bbox: list[float], scale_x: float, scale_y: float) -> list[float]:
    return [c * scale_x if i % 2 == 0 else c * scale_y for i, c in enumerate(bbox)]


def draw_shelves(frame: np.ndarray, shelf_boxes: list[list[float]]) -> np.ndarray:
    """Shelf regions in a distinct color/thickness from product boxes, since
    they're typically much larger bounding areas, not individual items."""
    annotated = frame.copy()
    color = (0, 255, 255)  # Yellow in BGR

    for bbox in shelf_boxes:
        x1, y1, x2, y2 = map(int, bbox)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

    return annotated


def process_video(
    video_path: str | Path,
    camera_id: int,
    zone_id: int | None = None,
    frame_skip: int = 5,
    max_frames: int | None = None,
    on_frame: Callable[[int, list[dict]], None] | None = None,
) -> dict:
    video_path = Path(video_path)
    cap = load_video(video_path)
    metadata = get_video_metadata(cap)
    logger.info(
        "Processing video=%s camera_id=%s zone_id=%s metadata=%s frame_skip=%s max_frames=%s",
        video_path,
        camera_id,
        zone_id,
        metadata,
        frame_skip,
        max_frames,
    )

    tracker = CustomerTracker()
    product_tracker = ProductTracker()
    all_coordinates: list[dict] = []
    frames_processed = 0
    people_detections_total = 0
    product_detections_total = 0
    shelf_detections_total = 0

    # Get real frame size from first frame
    ret, first_frame = cap.read()
    if not ret:
        raise ValueError("Could not read first frame from video")

    height, width = first_frame.shape[:2]
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # reset to beginning

    if height > MAX_OUTPUT_HEIGHT:
        output_scale = MAX_OUTPUT_HEIGHT / height
        output_width, output_height = int(width * output_scale), MAX_OUTPUT_HEIGHT
    else:
        output_width, output_height = width, height

    # WebM/VP8, not MP4/mp4v: this machine has no H.264 encoder (OpenH264
    # fails to load), and mp4v-encoded MPEG-4 Part 2 video is not something
    # browsers' <video> tag can decode at all, even in an .mp4 container -
    # it would silently fail to play (MEDIA_ERR_SRC_NOT_SUPPORTED). VP8/WebM
    # is natively playable and is the only codec confirmed to actually work
    # in this environment.
    annotated_filename = f"annotated_{video_path.stem}.webm"
    annotated_path = ANNOTATED_DIR / annotated_filename
    out_path = str(annotated_path)
    snapshot_filename = f"camera_{camera_id}_latest.jpg"
    raw_snapshot_filename = f"camera_{camera_id}_latest_raw.jpg"

    fourcc = cv2.VideoWriter_fourcc(*"VP80")
    fps = metadata.get("fps", 25) or 25
    writer = cv2.VideoWriter(
        out_path, fourcc, max(fps / max(frame_skip, 1), 5), (output_width, output_height)
    )

    if not writer.isOpened():
        raise RuntimeError("Failed to open VideoWriter")

    last_products: list = []
    last_shelves: list = []

    for loop_index, (frame_number, frame) in enumerate(
        extract_frames(cap, frame_skip=frame_skip, max_frames=max_frames)
    ):
        original_frame = frame.copy()

        resized = resize_frames(frame)
        # Adaptive enhancement (brightness/contrast/denoise/sharpen) runs on
        # the resized frame - it's what the detector actually sees, and it's
        # smaller so enhancement stays cheap (~0.1-0.4s measured on real
        # footage, well under the ~0.6-0.9s a YOLO-World call already costs).
        # Only annotation/display uses original_frame, so enhancement never
        # alters what gets saved to the annotated video.
        enhanced = enhance_frame(resized)
        people = detect_people(enhanced)
        if loop_index % WORLD_DETECT_INTERVAL == 0:
            last_products, last_shelves = detect_products_and_shelves(enhanced)
            # Tracked only when a fresh detection pass actually ran - running
            # ByteTrack on the same cached boxes every intermediate frame
            # would look like identical detections reappearing every frame,
            # confusing its motion model. This is what turns "N products
            # detected this frame, repeated every frame" into "M distinct
            # products seen across the whole video" (see
            # unique_products_tracked in the stats below) - the actual
            # duplicate-detection-avoidance the tracker exists for.
            product_tracker.update(frame_number, last_products)
        products, shelves = last_products, last_shelves
        people_detections_total += len(people)
        product_detections_total += len(products)
        shelf_detections_total += len(shelves)

        frame_tracks = tracker.update(frame_number, people)

        # Scale boxes back to original size
        scale_x = original_frame.shape[1] / max(resized.shape[1], 1)
        scale_y = original_frame.shape[0] / max(resized.shape[0], 1)

        scaled_tracks = []
        for t in frame_tracks:
            t = dict(t)
            bbox = t.get("bbox") or t.get("xyxy")
            if bbox is not None:
                x1, y1, x2, y2 = bbox
                t["bbox"] = [x1 * scale_x, y1 * scale_y, x2 * scale_x, y2 * scale_y]
                t["x"] = round(float(t.get("x", 0.0)) * scale_x, 2)
                t["y"] = round(float(t.get("y", 0.0)) * scale_y, 2)
            scaled_tracks.append(t)

        scaled_product_boxes = [_scale_bbox(p.bbox.as_list(), scale_x, scale_y) for p in products]
        scaled_shelf_boxes = [_scale_bbox(s.bbox.as_list(), scale_x, scale_y) for s in shelves]

        logger.debug(
            "Frame %s detections=%s tracks=%s track_ids=%s",
            frame_number,
            len(people),
            len(scaled_tracks),
            [track.get("customer_id") for track in scaled_tracks],
        )

        annotated_frame = draw_tracks(original_frame, scaled_tracks)
        annotated_frame = draw_shelves(annotated_frame, scaled_shelf_boxes)
        annotated_frame = draw_products(annotated_frame, scaled_product_boxes)

        # Make sure size matches the writer's (possibly downscaled) output dimensions
        if annotated_frame.shape[1] != output_width or annotated_frame.shape[0] != output_height:
            annotated_frame = cv2.resize(annotated_frame, (output_width, output_height))

        writer.write(annotated_frame)
        # Overwritten every frame so it always reflects this camera's most
        # recently processed frame - a real snapshot, not a live stream.
        cv2.imwrite(str(ANNOTATED_DIR / snapshot_filename), annotated_frame)
        # A second, unannotated copy - needed because re-running detection on
        # the annotated snapshot would feed the model its own drawn boxes/text
        # as if they were real scene content. Used by the shelf empty/missing
        # -product cross-check (see analytics_dashboard.py shelf_analysis).
        cv2.imwrite(str(ANNOTATED_DIR / raw_snapshot_filename), original_frame)

        frame_coordinates = coord_module.generate_coordinates_for_frame(
            scaled_tracks, camera_id=camera_id, zone_id=zone_id
        )
        all_coordinates.extend(frame_coordinates)
        frames_processed += 1

        if on_frame is not None:
            on_frame(frame_number, frame_coordinates)

    writer.release()
    cap.release()

    latest_video_filename = f"camera_{camera_id}_latest.webm"
    if frames_processed > 0:
        shutil.copyfile(annotated_path, ANNOTATED_DIR / latest_video_filename)

    stats = {
        "video_path": str(video_path),
        "annotated_video": annotated_filename,
        "annotated_path": out_path,
        "snapshot_filename": snapshot_filename if frames_processed > 0 else None,
        "latest_video_filename": latest_video_filename if frames_processed > 0 else None,
        "camera_id": camera_id,
        "zone_id": zone_id,
        "video_metadata": metadata,
        "frames_processed": frames_processed,
        "frame_skip": frame_skip,
        "total_people_detections": people_detections_total,
        "total_product_detections": product_detections_total,
        "total_shelf_detections": shelf_detections_total,
        "unique_products_tracked": product_tracker.unique_product_count(),
        "unique_customers_tracked": tracker.unique_customer_count(),
        "coordinate_records_generated": len(all_coordinates),
    }

    return {
        "stats": stats,
        "coordinates": all_coordinates,
    }
