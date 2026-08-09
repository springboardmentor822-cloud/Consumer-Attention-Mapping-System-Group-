import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import write_access
from app.db.session import get_db
from app.schemas.video import (
    VideoUploadResponse,
    VideoProcessRequest,
    VideoProcessResponse,
    VideoProcessStats,
    VideoMetadata,
)
from app.ai.live_stream import register_camera_video
from app.models.camera import Camera
from app.services.alert_service import generate_alerts_for_video_processing
from app.services.video_service import VideoService
from app.services.tracking_repository import TrackingPersistenceError, TrackingRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["Video Processing"])


def _error_response(status_code: int, error: str, details: str, fix: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error,
            "details": details,
            "fix": fix,
        },
    )


@router.post("/upload", response_model=VideoUploadResponse)
async def upload_video(file: UploadFile):
    """Upload a video file for processing."""
    result = await VideoService.save_upload(file)
    return VideoUploadResponse(**result)


@router.post("/process", response_model=VideoProcessResponse)
def process_video_endpoint(
    payload: VideoProcessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Process uploaded video:
    - Extract frames
    - Detect people (YOLOv8)
    - Track people (ByteTrack)
    - Save coordinates to database
    """
    repo = TrackingRepository(db)

    try:
        camera_id, zone_id = repo.resolve_tracking_context(payload.camera_id, payload.zone_id)
    except TrackingPersistenceError as exc:
        return _error_response(status.HTTP_400_BAD_REQUEST, exc.error, exc.details, exc.fix)

    try:
        logger.info(
            "Starting video processing filename=%s camera_id=%s zone_id=%s frame_skip=%s max_frames=%s",
            payload.filename,
            camera_id,
            zone_id,
            payload.frame_skip,
            payload.max_frames,
        )
        result = VideoService.run_pipeline(
            filename=payload.filename,
            camera_id=camera_id,
            zone_id=zone_id,
            frame_skip=payload.frame_skip,
            max_frames=payload.max_frames,
        )

        saved = repo.bulk_save(result.get("coordinates", []))
        register_camera_video(camera_id, VideoService.resolve_path(payload.filename))

        # Runs after this response is sent (FastAPI BackgroundTasks), with
        # its own DB session - see alert_service's module docstring for why.
        # A bug or slow rule check here can never delay or break video
        # processing, which has already finished by this point.
        camera = db.get(Camera, camera_id)
        if camera is not None:
            # Persisted alongside the in-memory registration above so the
            # live feed survives a backend restart - see the field's
            # docstring on the Camera model for why this matters.
            camera.last_processed_video_filename = payload.filename
            db.commit()
            background_tasks.add_task(
                generate_alerts_for_video_processing,
                store_id=camera.store_id,
                camera_id=camera_id,
                zone_id=zone_id,
                coordinates=result.get("coordinates", []),
            )
    except HTTPException as exc:
        return _error_response(
            exc.status_code,
            "video_processing_failed",
            str(exc.detail),
            "Verify the video exists in uploads/videos and retry.",
        )
    except TrackingPersistenceError as exc:
        return _error_response(status.HTTP_400_BAD_REQUEST, exc.error, exc.details, exc.fix)
    except ValueError as exc:
        return _error_response(
            status.HTTP_400_BAD_REQUEST,
            "video_processing_failed",
            str(exc),
            "Verify the uploaded video can be read and contains valid frames.",
        )
    except Exception as exc:
        logger.exception("Unexpected video processing error")
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "video_processing_failed",
            str(exc),
            "Check backend logs for the failing pipeline stage.",
        )

    stats = result.get("stats", {})

    return VideoProcessResponse(
        message="Video processed successfully",
        stats=VideoProcessStats(
            video_path=stats.get("video_path", ""),
            camera_id=stats.get("camera_id", camera_id),
            zone_id=stats.get("zone_id", zone_id),
            video_metadata=VideoMetadata(**stats.get("video_metadata", {
                "fps": 0, "frame_count": 0, "width": 0, "height": 0
            })),
            frames_processed=stats.get("frames_processed", 0),
            frame_skip=stats.get("frame_skip", payload.frame_skip),
            total_people_detections=stats.get("total_people_detections", 0),
            total_product_detections=stats.get("total_product_detections", 0),
            total_shelf_detections=stats.get("total_shelf_detections", 0),
            unique_customers_tracked=stats.get("unique_customers_tracked", 0),
            coordinate_records_generated=stats.get("coordinate_records_generated", 0),
            records_saved_to_db=saved,
        ),
    )
