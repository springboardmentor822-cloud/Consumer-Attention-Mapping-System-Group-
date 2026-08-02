"""
Smoke test for ProductDetector, mirroring the PersonDetector check.
Uses the same Camera row (Zone_2.mp4) - since it's a supermarket aisle
clip, this is actually a reasonable source for a product detector too,
unlike a person-only clip.
"""

from sqlmodel import Session, select

from app.core.db import engine
from app.models.camera import Camera
from app.services.detection import ProductDetector
from app.services.frame_pipeline import get_camera_source

with Session(engine) as session:
    cameras = session.exec(select(Camera).where(Camera.is_active == True)).all()

if not cameras:
    print("No active Camera rows found.")
else:
    camera = cameras[0]
    src = get_camera_source(camera)
    detector = ProductDetector()

    for i, det in enumerate(detector.detect_source(src)):
        print(f"frame {det['frame_index']}: classes={det['class_names']} track_ids={det['track_ids']}")
        if i >= 9:
            break
