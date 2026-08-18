"""
Shared helpers used by traffic_analytics.py's two chart queries below.

compute_dwell_time.py's compute_dwell_time_data() already has its own
copy of this same "isolate the most recent run" + "read real FPS from
the video file" logic, written before this file existed. Deliberately
NOT refactoring compute_dwell_time.py to call this instead — it's
already verified working end-to-end against real data (see chat), and
touching it again this close to a deadline for a pure de-duplication
win isn't worth the risk of breaking something that currently works.
New callers (traffic-over-time, zone-traffic) use this shared version
instead of copy-pasting a third/fourth time.
"""
import uuid

import cv2
from sqlmodel import Session, select

from app.core.timescale_db import timescale_engine
from app.models.tracking_event import TrackingEvent
from app.services.frame_pipeline import DATA_DIR


def get_video_fps(source_path: str) -> float:
    cap = cv2.VideoCapture(str(DATA_DIR / source_path))
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    if not fps:
        raise RuntimeError(f"Could not read FPS from {source_path} — check the file exists and isn't corrupt.")
    return fps


def get_latest_run_person_events(camera_id: uuid.UUID) -> list[TrackingEvent]:
    """
    All PersonDetector events (class_name is None) for this camera,
    filtered to only the most recent tracking_runner.py run - same
    run-boundary detection as compute_dwell_time.py: walk events in
    event_time order, find the last point frame_index drops back to a
    lower value (a fresh run starting), keep only what's after that.
    Returns [] if there are no events at all for this camera - not an
    error, just means tracking_runner hasn't been run against it yet.
    """
    with Session(timescale_engine) as ts_session:
        events = ts_session.exec(
            select(TrackingEvent)
            .where(TrackingEvent.camera_id == str(camera_id))
            .where(TrackingEvent.class_name.is_(None))
            .order_by(TrackingEvent.frame_index)
        ).all()

    if not events:
        return []

    events_by_time = sorted(events, key=lambda e: e.event_time)
    run_start = 0
    for i in range(1, len(events_by_time)):
        if events_by_time[i].frame_index < events_by_time[i - 1].frame_index:
            run_start = i
    return events_by_time[run_start:]
