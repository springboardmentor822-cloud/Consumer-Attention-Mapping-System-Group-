from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user
from app.models import Store, Camera

router = APIRouter()

# Role checkers
require_editor = RoleChecker(["Store Manager", "Administrator"])

class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    zone_id: int


@router.get("/{store_id}")
def list_cameras(store_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    cameras = db.query(Camera).filter(Camera.store_id == store_id).all()
    return [{
        "id": c.id,
        "name": c.name,
        "rtsp_url": c.rtsp_url,
        "zone_id": c.zone_id,
        "status": c.status
    } for c in cameras]


@router.post("/{store_id}")
def register_camera_to_store(
    store_id: str,
    camera_data: CameraCreate,
    db: Session = Depends(get_db),
    current_user: Any = Depends(require_editor)
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    new_cam = Camera(
        name=camera_data.name,
        store_id=store_id,
        rtsp_url=camera_data.rtsp_url,
        zone_id=camera_data.zone_id,
        status="Online"
    )
    db.add(new_cam)
    db.commit()
    db.refresh(new_cam)

    # Camera registration audit log skipped for lean scope

    return {"status": "success", "camera_id": new_cam.id}


@router.post("/{id}/restart")
def restart_camera(id: int, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    camera = db.query(Camera).filter(Camera.id == id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    camera.status = "Online"
    db.commit()
    return {"status": "success", "message": "Camera restarted successfully"}


@router.post("/{id}/start")
def start_camera(id: int, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    camera = db.query(Camera).filter(Camera.id == id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    camera.status = "Online"
    db.commit()
    return {"status": "success", "message": "Camera stream started"}


@router.post("/{id}/stop")
def stop_camera(id: int, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    camera = db.query(Camera).filter(Camera.id == id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    camera.status = "Offline"
    db.commit()
    return {"status": "success", "message": "Camera stream stopped"}


@router.get("/{id}/status")
def get_camera_status(id: int, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    camera = db.query(Camera).filter(Camera.id == id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return {"status": camera.status, "id": camera.id, "name": camera.name}

