import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.camera import Camera
from app.models.enums import CameraStatusEnum
from app.models.user import User
from app.schemas.store import CameraCreate, CameraOut, CameraUpdate

router = APIRouter()


@router.post("", response_model=CameraOut, status_code=201)
def create_camera(
    payload: CameraCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    camera = Camera(**payload.model_dump(), status=CameraStatusEnum.CONFIGURING)
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera


@router.get("", response_model=list[CameraOut])
def list_cameras(
    store_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Camera)
    if store_id:
        query = query.filter(Camera.store_id == store_id)
    return query.all()


@router.get("/{camera_id}", response_model=CameraOut)
def get_camera(camera_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.put("/{camera_id}", response_model=CameraOut)
def update_camera(
    camera_id: int,
    payload: CameraUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(camera, field, value)
    db.commit()
    db.refresh(camera)
    return camera


@router.post("/{camera_id}/heartbeat", response_model=CameraOut)
def camera_heartbeat(camera_id: int, db: Session = Depends(get_db)):
    """Called by the edge/inference process to report the camera is alive."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    camera.last_heartbeat_at = dt.datetime.utcnow()
    camera.status = CameraStatusEnum.ONLINE
    db.commit()
    db.refresh(camera)
    return camera


@router.delete("/{camera_id}", status_code=204)
def delete_camera(
    camera_id: int, db: Session = Depends(get_db), _user: User = Depends(require_admin_or_manager)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(camera)
    db.commit()
    return None
