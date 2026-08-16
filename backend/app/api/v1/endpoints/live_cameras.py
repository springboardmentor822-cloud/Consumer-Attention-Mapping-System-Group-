"""
Live camera wall endpoints for the Store Manager dashboard's "Live Cameras"
panel. See app/services/live_camera_manager.py for the actual capture/YOLO
worker threads this reads from.
"""
import time

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from starlette.concurrency import iterate_in_threadpool

from app.core.config import settings
from app.services.live_camera_manager import live_camera_manager

router = APIRouter()


@router.get("")
def list_live_cameras():
    """Snapshot of every configured camera - status, live person count, and
    when it last produced a frame. Used for the panel's initial render and
    as a polling fallback; the WebSocket at /ws/live-cameras pushes the same
    shape continuously for live updates."""
    return live_camera_manager.list_snapshots()


@router.get("/{camera_id}")
def get_live_camera(camera_id: str):
    if camera_id not in live_camera_manager.camera_ids():
        raise HTTPException(status_code=404, detail="Unknown camera id")
    return next(s for s in live_camera_manager.list_snapshots() if s["id"] == camera_id)


def _mjpeg_frames(camera_id: str):
    boundary = b"--frame"
    frame_interval = 1.0 / max(1.0, settings.LIVE_CAMERA_STREAM_FPS)
    while True:
        jpeg = live_camera_manager.latest_jpeg(camera_id)
        if jpeg:
            yield (
                boundary + b"\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n" + jpeg + b"\r\n"
            )
        time.sleep(frame_interval)


@router.get("/{camera_id}/stream")
async def stream_live_camera(camera_id: str):
    """MJPEG stream (multipart/x-mixed-replace) for one camera - browsers
    render this natively from a plain <img src="..."> tag, which is what
    keeps the frontend simple: no WebRTC signaling, no custom video player,
    just a self-refreshing image that updates as fast as new frames arrive.
    Runs the blocking generator in a threadpool so it doesn't stall the
    event loop that every other camera's stream (and the rest of the API)
    shares."""
    if camera_id not in live_camera_manager.camera_ids():
        raise HTTPException(status_code=404, detail="Unknown camera id")
    return StreamingResponse(
        iterate_in_threadpool(_mjpeg_frames(camera_id)),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache, no-store", "Pragma": "no-cache", "Connection": "close"},
    )
