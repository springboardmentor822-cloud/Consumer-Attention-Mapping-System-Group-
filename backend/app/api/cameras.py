from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.schemas.camera import CameraCreate, CameraRead, CameraUpdate
from backend.app.services.camera_service import camera_service


router = APIRouter(prefix="/cameras", tags=["Cameras"])

@router.get("", response_model=list[CameraRead])
def list_cameras(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CameraRead]:
    # Retail Analyst and Marketing Manager have absolutely no access to cameras
    if current_user.role.role_name in ["Retail Analyst", "Marketing Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to camera management."
        )

    # Store Managers can only see cameras in their assigned store
    if current_user.role.role_name == "Store Manager":
        if not current_user.store_id:
            return []
        return [c for c in camera_service.list_cameras(db) if c.store_id == current_user.store_id]
    
    # Administrator can list all platform cameras for health monitoring
    return camera_service.list_cameras(db)


@router.post("", response_model=CameraRead, status_code=201)
def create_camera(
    payload: CameraCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> CameraRead:
    return camera_service.create_camera(db, payload)


@router.put("/{camera_id}", response_model=CameraRead)
def update_camera(
    camera_id: UUID,
    payload: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> CameraRead:
    return camera_service.update_camera(db, camera_id, payload)


@router.delete("/{camera_id}", status_code=204)
def delete_camera(
    camera_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator")),
) -> None:
    camera_service.delete_camera(db, camera_id)
