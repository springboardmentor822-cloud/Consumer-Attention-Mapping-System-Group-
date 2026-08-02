"""
Confirms persist=True is actually carrying ByteTrack ID continuity across
per-frame .track() calls, not just returning a stable count that happens
to look right. Prints the real track_id values per frame instead of just
len(track_ids).
"""

from sqlmodel import Session, select

from app.core.db import engine
from app.models.camera import Camera
from app.services.detection import PersonDetector
from app.services.frame_pipeline import get_camera_source

with Session(engine) as session:
    cameras = session.exec(select(Camera).where(Camera.is_active == True)).all()

if not cameras:
    print("No active Camera rows found.")
else:
    camera = cameras[0]
    src = get_camera_source(camera)
    detector = PersonDetector()

    for i, det in enumerate(detector.detect_source(src)):
        print(f"frame {det['frame_index']}: track_ids={det['track_ids']}")
        if i >= 9:
            break
