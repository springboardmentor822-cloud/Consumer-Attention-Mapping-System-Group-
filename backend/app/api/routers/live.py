from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.ai.live_stream import get_registered_video, stream_camera
from app.db.session import get_db

router = APIRouter(prefix="/api/live", tags=["Live Camera"])


@router.get("/{camera_id}/stream")
def live_stream(camera_id: int, db: Session = Depends(get_db)):
    """
    MJPEG live feed for a camera: loops its last-processed video and runs
    detection + tracking on every frame in real time. 404 until a video has
    been processed for this camera at least once.

    Multiple simultaneous requests for the same camera_id all share one
    background CameraWorker (see app/ai/live_stream.py) - the capture and
    detection pipeline runs once per camera, not once per viewer.
    """
    video_path = get_registered_video(camera_id, db=db)
    if video_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No live source for camera {camera_id} yet. Process a video for this camera first.",
        )

    return StreamingResponse(
        stream_camera(camera_id, video_path),
        media_type="multipart/x-mixed-replace; boundary=frame",
        # multipart/x-mixed-replace isn't normally cached by browsers, but
        # some intermediary (a proxy, a browser extension) could still try -
        # explicit no-store makes sure nothing ever serves a stale/frozen
        # frame from a cache instead of actually connecting to the stream.
        headers={"Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache"},
    )
