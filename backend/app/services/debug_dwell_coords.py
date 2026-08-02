"""
Diagnostic: prints the coordinate range of real person tracking events
for a camera, next to the coordinate range of its marked shelf polygons.
If these ranges don't overlap at all, that's the actual bug behind a
0.0s dwell-time result - not "nobody visited," a real geometry mismatch.

Usage:
    python -m app.services.debug_dwell_coords <camera_id>
"""
import argparse
import uuid

from sqlmodel import Session, select

from app.core.db import engine
from app.core.timescale_db import timescale_engine
from app.models.camera import Camera
from app.models.shelf_camera_view import ShelfCameraView
from app.models.store import Shelf
from app.models.tracking_event import TrackingEvent

parser = argparse.ArgumentParser()
parser.add_argument("camera_id", type=str)
args = parser.parse_args()
camera_id = uuid.UUID(args.camera_id)

with Session(engine) as session:
    camera = session.get(Camera, camera_id)
    views = session.exec(select(ShelfCameraView).where(ShelfCameraView.camera_id == camera_id)).all()
    for v in views:
        shelf = session.get(Shelf, v.shelf_id)
        xs = [p[0] for p in v.zone_coordinates]
        ys = [p[1] for p in v.zone_coordinates]
        print(f"Shelf '{shelf.shelf_name if shelf else v.shelf_id}': x range {min(xs)}-{max(xs)}, y range {min(ys)}-{max(ys)}")

with Session(timescale_engine) as ts_session:
    events = ts_session.exec(
        select(TrackingEvent)
        .where(TrackingEvent.camera_id == str(camera_id))
        .where(TrackingEvent.class_name.is_(None))
    ).all()

if events:
    cxs = [(e.x1 + e.x2) / 2 for e in events]
    cys = [(e.y1 + e.y2) / 2 for e in events]
    print(f"\n{len(events)} person events. Box-center x range: {min(cxs):.0f}-{max(cxs):.0f}, y range: {min(cys):.0f}-{max(cys):.0f}")
    print(f"Sample raw box (first event): x1={events[0].x1:.0f} y1={events[0].y1:.0f} x2={events[0].x2:.0f} y2={events[0].y2:.0f}")
else:
    print("\nNo person events found at all for this camera.")
