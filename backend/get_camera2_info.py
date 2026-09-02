from sqlmodel import Session, select
from app.core.db import engine
from app.models.camera import Camera

with Session(engine) as s:
    cam = s.exec(select(Camera).where(Camera.name == "Camera 2")).first()
    if not cam:
        print("No camera named 'Camera 2' found.")
    else:
        print("id:", cam.id)
        print("source_path:", cam.source_path)
