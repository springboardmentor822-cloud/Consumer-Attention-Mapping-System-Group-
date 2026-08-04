from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user, get_user_email
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse
from app.services.camera_service import CameraService
from app.utils.logging import get_structured_logger

logger = get_structured_logger("camera_api")
router = APIRouter()

require_editor = RoleChecker(["Store Manager", "Administrator"])

@router.post(
    "/",
    response_model=CameraResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new camera",
    description="Registers a new camera node in a store with location details (Store Manager or Administrator access required)."
)
def create_camera(camera_in: CameraCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Creating camera '{camera_in.name}' in store '{camera_in.store_id}' by user '{user_email}'")
    camera = CameraService.create_camera(db, camera_in)
    logger.info(f"Camera '{camera.name}' created successfully with ID: {camera.id}")
    return camera


@router.get(
    "/",
    response_model=List[CameraResponse],
    summary="List all cameras",
    description="Retrieve a paginated list of all registered cameras."
)
def list_cameras(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return CameraService.list_cameras(db, skip, limit)


@router.get(
    "/store/{store_id}",
    response_model=List[CameraResponse],
    summary="List cameras by store",
    description="Retrieve a list of cameras belonging to a specific store."
)
def list_store_cameras(store_id: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return CameraService.list_store_cameras(db, store_id, skip, limit)


@router.get(
    "/{camera_id}",
    response_model=CameraResponse,
    summary="Get camera details",
    description="Retrieve detailed info about a specific camera node."
)
def get_camera(camera_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    return CameraService.get_camera(db, camera_id)


@router.put(
    "/{camera_id}",
    response_model=CameraResponse,
    summary="Update camera settings",
    description="Modify coordinates, stream url, or name of a camera (Store Manager or Administrator access required)."
)
def update_camera(camera_id: str, camera_in: CameraUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Updating camera '{camera_id}' by user '{user_email}'")
    camera = CameraService.update_camera(db, camera_id, camera_in)
    logger.info(f"Camera '{camera_id}' updated successfully")
    return camera


@router.delete(
    "/{camera_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a camera",
    description="Remove a camera node from the mapping system (Store Manager or Administrator access required)."
)
def delete_camera(camera_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    user_email = get_user_email(current_user)
    logger.info(f"Deleting camera '{camera_id}' by user '{user_email}'")
    CameraService.delete_camera(db, camera_id)
    logger.info(f"Camera '{camera_id}' deleted successfully")
    return None


@router.post(
    "/{camera_id}/verify",
    summary="Verify camera connection",
    description="Triggers connection validation sequence for the camera stream stream_url."
)
def verify_camera_connection(camera_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    user_email = get_user_email(current_user)
    logger.info(f"Verifying camera connection for camera '{camera_id}' by user '{user_email}'")
    result = CameraService.verify_camera_connection(camera_id, db)
    if result.get("connected"):
        logger.info(f"Camera '{camera_id}' verified ONLINE", extra={"camera_id": camera_id, "status": "online"})
    else:
        logger.warning(f"Camera '{camera_id}' verified OFFLINE", extra={"camera_id": camera_id, "status": "offline", "reason": result.get("reason")})
    return result


from fastapi.responses import StreamingResponse
import asyncio
from app.services.video_ingestion import latest_frames

async def mjpeg_generator(camera_id: str):
    while True:
        frame = latest_frames.get(camera_id)
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        await asyncio.sleep(0.04) # ~25 FPS

@router.get(
    "/{camera_id}/stream",
    summary="Get live camera video stream",
    description="Provides an MJPEG streaming interface displaying real-time YOLO bounding boxes, ByteTrack tracking, and dynamic metadata overlays."
)
def stream_camera(camera_id: str):
    return StreamingResponse(
        mjpeg_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

