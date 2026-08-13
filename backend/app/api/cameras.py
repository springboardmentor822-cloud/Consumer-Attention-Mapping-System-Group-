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
from app.services.video_ingestion import latest_frames, latest_clean_frames

async def mjpeg_generator(camera_id: str, clean: bool = False):
    while True:
        frame_dict = latest_clean_frames if clean else latest_frames
        frame = frame_dict.get(camera_id)
        if frame:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        await asyncio.sleep(0.04) # ~25 FPS

@router.get(
    "/{camera_id}/stream",
    summary="Get live camera video stream",
    description="Provides an MJPEG streaming interface displaying real-time YOLO bounding boxes, ByteTrack tracking, and dynamic metadata overlays."
)
async def stream_camera(camera_id: str, clean: bool = False):
    logger.info(f"stream_camera requested for camera_id={camera_id}, clean={clean}")
    return StreamingResponse(
        mjpeg_generator(camera_id, clean=clean),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


from fastapi import HTTPException
from fastapi.responses import Response

@router.get(
    "/{camera_id}/frame",
    summary="Get latest camera frame",
    description="Retrieve the single latest JPEG frame from the camera."
)
async def get_camera_frame(camera_id: str, clean: bool = False):
    logger.info(f"get_camera_frame requested for camera_id={camera_id}, clean={clean}")
    frame_dict = latest_clean_frames if clean else latest_frames
    frame = frame_dict.get(camera_id)
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not available")
    return Response(content=frame, media_type="image/jpeg")


from app.schemas.camera import CameraCalibrationCreate, CameraCalibrationResponse
from app.models.calibration import CameraCalibration
from app.models.camera import Camera
from fastapi import HTTPException
import numpy as np
import cv2

@router.post(
    "/{camera_id}/calibration",
    response_model=CameraCalibrationResponse,
    summary="Save camera calibration",
    description="Saves or updates 4-point image-to-floorplan calibration and calculates the homography matrix."
)
def save_calibration(
    camera_id: str,
    calibration_in: CameraCalibrationCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_editor)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    src = np.float32(calibration_in.src_points)
    dst = np.float32(calibration_in.dst_points)
    
    try:
        matrix = cv2.getPerspectiveTransform(src, dst)
        homography_matrix = matrix.tolist()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to calculate homography matrix: {e}")

    calibration = db.query(CameraCalibration).filter(CameraCalibration.camera_id == camera_id).first()
    if calibration:
        calibration.src_points = calibration_in.src_points
        calibration.dst_points = calibration_in.dst_points
        calibration.homography_matrix = homography_matrix
    else:
        calibration = CameraCalibration(
            camera_id=camera_id,
            src_points=calibration_in.src_points,
            dst_points=calibration_in.dst_points,
            homography_matrix=homography_matrix
        )
        db.add(calibration)
    
    db.commit()
    db.refresh(calibration)
    return calibration

@router.get(
    "/{camera_id}/calibration",
    response_model=CameraCalibrationResponse,
    summary="Get camera calibration",
    description="Retrieves the persisted calibration points and homography matrix for a camera."
)
def get_calibration(camera_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    calibration = db.query(CameraCalibration).filter(CameraCalibration.camera_id == camera_id).first()
    if not calibration:
        raise HTTPException(status_code=404, detail="Calibration not found for this camera")
    return calibration

