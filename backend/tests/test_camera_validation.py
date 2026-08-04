import os
import cv2
import numpy as np
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models import Store, Camera
from app.services.camera_service import CameraService

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_camera_val.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

TEST_VIDEO_FILE = "dummy_test_video.mp4"

@pytest.fixture(autouse=True)
def setup_db_and_video():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    store = Store(id="store-c", name="Camera Store", code="CS1", address="Road 1", width=10.0, height=10.0)
    db.add(store)
    db.commit()
    db.close()
    
    # Create a dummy video file with 5 frames using OpenCV
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(TEST_VIDEO_FILE, fourcc, 10.0, (640, 480))
    for _ in range(5):
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        out.write(frame)
    out.release()
    
    yield
    
    Base.metadata.drop_all(bind=engine)
    if os.path.exists(TEST_VIDEO_FILE):
        os.remove(TEST_VIDEO_FILE)

def test_verify_camera_valid_local_file():
    db = TestingSessionLocal()
    # Absolute path to dummy video
    abs_path = os.path.abspath(TEST_VIDEO_FILE)
    
    camera = Camera(id="cam-valid", store_id="store-c", name="Valid Local Camera", stream_url=abs_path, location_name="Front", x=1.0, y=1.0)
    db.add(camera)
    db.commit()
    
    res = CameraService.verify_camera_connection("cam-valid", db)
    db.close()
    
    assert res["status"] == "online"
    assert res["width"] == 640
    assert res["height"] == 480
    assert res["fps"] == 10.0

def test_verify_camera_invalid_stream():
    db = TestingSessionLocal()
    
    camera = Camera(id="cam-invalid", store_id="store-c", name="Invalid Camera", stream_url="rtsp://nonexistent-rtsp-address", location_name="Back", x=2.0, y=2.0)
    db.add(camera)
    db.commit()
    
    res = CameraService.verify_camera_connection("cam-invalid", db)
    db.close()
    
    assert res["status"] == "offline"
    assert "reason" in res

def test_verify_camera_disconnected_camera():
    db = TestingSessionLocal()
    
    # Nonexistent local file
    camera = Camera(id="cam-missing-file", store_id="store-c", name="Missing File Camera", stream_url="missing_video_file.mp4", location_name="Left", x=3.0, y=3.0)
    db.add(camera)
    db.commit()
    
    res = CameraService.verify_camera_connection("cam-missing-file", db)
    db.close()
    
    assert res["status"] == "offline"
