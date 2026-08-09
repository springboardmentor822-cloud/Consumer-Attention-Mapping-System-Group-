from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import cv2
import numpy as np

from app.api.deps import dashboard_access, write_access
from app.db.session import get_db
from app.models.camera import Camera
from app.models.detection import Detection
from app.models.user import User
from app.schemas.camera import CameraCreate, CameraResponse, CameraUpdate
from app.schemas.common import Message
from app.services import alert_rules
from app.services.alert_service import record_alert_if_new
from app.services.crud import CRUDService


router = APIRouter(prefix="/cameras", tags=["Camera Management"])
service = CRUDService[Camera, CameraCreate, CameraUpdate](Camera, "Camera")


@router.get("", response_model=list[CameraResponse])
def list_cameras(_: object = Depends(dashboard_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=CameraResponse)
def create_camera(payload: CameraCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=CameraResponse)
def update_camera(item_id: int, payload: CameraUpdate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    camera = service.update(db, item_id, payload, actor=current_user)
    # A camera's status is set here directly by a manager/admin, not
    # inferred from a missing heartbeat (this system has no continuous
    # live-camera daemon - see alert_service's module docstring) - so
    # "camera offline" alerts fire the moment the status is changed to
    # anything other than Online, which is the real, honest trigger point.
    draft = alert_rules.check_camera_status(camera.id, camera.camera_name, camera.status)
    if draft:
        record_alert_if_new(db, camera.store_id, draft)
    return camera


@router.delete("/{item_id}", response_model=Message)
def delete_camera(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)


@router.post("/detect")
async def detect_people(
    file: UploadFile = File(...),
    camera_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not read image")

    from app.cv.service import CVService

    cv_service = CVService()
    result = cv_service.process_frame(frame)
    heatmap_frame = cv_service.generate_heatmap(frame, result["detections"])

    target_camera = db.get(Camera, camera_id) if camera_id else db.query(Camera).order_by(Camera.id.asc()).first()
    if target_camera:
        detection = Detection(
            camera_id=target_camera.id,
            people_count=result.get("count", 0),
            attention_score=0.8,
        )
        db.add(detection)
        db.commit()

    success, buffer = cv2.imencode(".jpg", heatmap_frame)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not encode output image")

    return StreamingResponse(iter([buffer.tobytes()]), media_type="image/jpeg")