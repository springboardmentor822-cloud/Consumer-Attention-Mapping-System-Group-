"""
Gaze-estimation proxy (see chat discussion — real eye-tracking isn't
feasible against this footage; dwell time positioned in front of a
shelf is used as the attention signal instead).

For a given camera, pulls its ShelfCameraView polygons and every person
TrackingEvent recorded against it, checks each event's box-center against
each shelf's horizontal (x) range, and reports:
  - total person-seconds spent in each shelf's horizontal lane
  - distinct track_ids that were ever in that lane

NOTE: uses horizontal (x) overlap only, not full polygon containment.
Confirmed via debug_dwell_coords.py that this camera's footage is a
steep, close-up top-down shot — shelf polygons sit near the top of the
frame (y ~31-824) while people's box-centers sit near the bottom
(y ~3321-4038), because a person standing in front of a shelf in this
geometry appears far below it in-frame, not overlapping it. Full
polygon containment produced 0.0s for every shelf as a result. X-range
alone is a reasonable proxy for "standing in that aisle lane" given this
camera's specific angle — revisit if a future camera has a more
front-on angle where full polygon containment would actually be correct.

Elapsed time uses frame_index / real video FPS, NOT event_time deltas —
event_time reflects processing speed (tracking_runner pushes frames as
fast as detection runs, not paced to real playback), so it would silently
under/overstate dwell time. FPS is read directly from the camera's own
video file via OpenCV rather than assumed, for the same reason.

Usage:
    python -m app.services.compute_dwell_time <camera_id>

compute_dwell_time_data() below is the same logic pulled out into a
reusable function - added so app/api/routes/dwell_time.py can call it
directly for the dashboard chart instead of re-implementing the run-
isolation / x-range logic a second time. main()/CLI output unchanged.
"""
import argparse
import uuid
from collections import defaultdict

import cv2
from sqlmodel import Session, select

from app.core.db import engine
from app.core.timescale_db import timescale_engine
from app.models.camera import Camera
from app.models.shelf_camera_view import ShelfCameraView
from app.models.store import Shelf
from app.models.tracking_event import TrackingEvent
from app.services.frame_pipeline import DATA_DIR


def get_video_fps(source_path: str) -> float:
    cap = cv2.VideoCapture(str(DATA_DIR / source_path))
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    if not fps:
        raise RuntimeError(f"Could not read FPS from {source_path} — check the file exists and isn't corrupt.")
    return fps


def shelf_x_range(polygon: list) -> tuple:
    xs = [p[0] for p in polygon]
    return min(xs), max(xs)


def x_in_range(cx: float, x_range: tuple) -> bool:
    return x_range[0] <= cx <= x_range[1]


class DwellTimeUnavailable(Exception):
    """Raised when there's nothing to compute (no camera, no shelf views,
    or no tracking events yet) - the API route turns this into a 404/200-
    with-empty-list rather than a 500, since none of these are server
    errors."""


def compute_dwell_time_data(camera_id: uuid.UUID) -> list[dict]:
    """
    Returns one dict per shelf:
      {"shelf_id": str, "shelf_name": str, "total_seconds": float, "distinct_visitors": int}
    Shelves with a configured ShelfCameraView but zero events inside it
    are included with total_seconds=0.0 - same "nobody stopped here is a
    real signal" reasoning as the CLI version, not silently omitted.
    Raises DwellTimeUnavailable if the camera doesn't exist, has no
    ShelfCameraView rows, or has no person tracking events at all.
    """
    with Session(engine) as session:
        camera = session.get(Camera, camera_id)
        if not camera:
            raise DwellTimeUnavailable(f"No Camera found with id {camera_id}")

        views = session.exec(
            select(ShelfCameraView).where(ShelfCameraView.camera_id == camera_id)
        ).all()
        if not views:
            raise DwellTimeUnavailable(f"No ShelfCameraView rows for camera {camera.name}")

        shelf_names = {}
        for v in views:
            shelf = session.get(Shelf, v.shelf_id)
            shelf_names[v.shelf_id] = shelf.shelf_name if shelf else str(v.shelf_id)

        source_path = camera.source_path

    fps = get_video_fps(source_path)
    seconds_per_frame = 1.0 / fps

    with Session(timescale_engine) as ts_session:
        events = ts_session.exec(
            select(TrackingEvent)
            .where(TrackingEvent.camera_id == str(camera_id))
            .where(TrackingEvent.class_name.is_(None))  # person events only, see note in main()
            .order_by(TrackingEvent.frame_index)
        ).all()

    if not events:
        raise DwellTimeUnavailable("No person tracking events found for this camera")

    # Isolate the most recent run only - see main()'s comment for why
    # separate runs' frame_index/track_id numbering isn't comparable.
    events_by_time = sorted(events, key=lambda e: e.event_time)
    run_start = 0
    for i in range(1, len(events_by_time)):
        if events_by_time[i].frame_index < events_by_time[i - 1].frame_index:
            run_start = i
    events = events_by_time[run_start:]

    frames_inside: dict = defaultdict(lambda: defaultdict(int))
    view_x_ranges = {view.id: shelf_x_range(view.zone_coordinates) for view in views if view.zone_coordinates}

    for event in events:
        cx = (event.x1 + event.x2) / 2
        for view in views:
            x_range = view_x_ranges.get(view.id)
            if not x_range:
                continue
            if x_in_range(cx, x_range):
                frames_inside[view.shelf_id][event.track_id] += 1

    results = []
    seen_shelf_ids = set()
    for shelf_id, per_track in frames_inside.items():
        total_frames = sum(per_track.values())
        results.append({
            "shelf_id": str(shelf_id),
            "shelf_name": shelf_names.get(shelf_id, str(shelf_id)),
            "total_seconds": round(total_frames * seconds_per_frame, 1),
            "distinct_visitors": len(per_track),
        })
        seen_shelf_ids.add(shelf_id)

    for view in views:
        if view.shelf_id not in seen_shelf_ids:
            results.append({
                "shelf_id": str(view.shelf_id),
                "shelf_name": shelf_names.get(view.shelf_id, str(view.shelf_id)),
                "total_seconds": 0.0,
                "distinct_visitors": 0,
            })

    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("camera_id", type=str)
    args = parser.parse_args()
    camera_id = uuid.UUID(args.camera_id)

    with Session(engine) as session:
        camera = session.get(Camera, camera_id)
        if not camera:
            print(f"No Camera found with id {camera_id}")
            return
        source_path = camera.source_path
        camera_name = camera.name

    print(f"Camera: {camera_name} | source: {source_path} | fps: {get_video_fps(source_path)}")

    try:
        results = compute_dwell_time_data(camera_id)
    except DwellTimeUnavailable as e:
        print(str(e))
        return

    with Session(timescale_engine) as ts_session:
        all_events = ts_session.exec(
            select(TrackingEvent)
            .where(TrackingEvent.camera_id == str(camera_id))
            .where(TrackingEvent.class_name.is_(None))
        ).all()
    print(f"{len(all_events)} total person tracking events found across ALL runs ever pushed for this camera.")

    print("\n--- Dwell time by shelf (this recorded run) ---")
    for r in results:
        if r["total_seconds"] == 0.0 and r["distinct_visitors"] == 0:
            print(f"{r['shelf_name']}: 0.0s (no events fell inside this zone)")
        else:
            print(
                f"{r['shelf_name']}: {r['total_seconds']:.1f}s total dwell, "
                f"{r['distinct_visitors']} distinct track_id(s) observed near it"
            )


if __name__ == "__main__":
    main()
