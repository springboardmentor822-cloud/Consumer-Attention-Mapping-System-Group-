import pytest
import time
from app.services.video_ingestion import start_stream, stop_stream, active_streams

def test_video_ingestion_stream_lifecycle():
    camera_id = "test-cam-lifecycle"
    video_source = "nonexistent.mp4"
    
    start_stream(camera_id, video_source, store_id="store-a", zone_id=1)
    assert camera_id in active_streams
    
    time.sleep(0.5)
    stop_stream(camera_id)
