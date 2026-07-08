from uuid import UUID

from fastapi import APIRouter, Depends
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
    del current_user
    return camera_service.list_cameras(db)


@router.post(
    "",
    response_model=CameraRead,
    status_code=201,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def create_camera(payload: CameraCreate, db: Session = Depends(get_db)) -> CameraRead:
    return camera_service.create_camera(db, payload)


@router.put(
    "/{camera_id}",
    response_model=CameraRead,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def update_camera(camera_id: UUID, payload: CameraUpdate, db: Session = Depends(get_db)) -> CameraRead:
    return camera_service.update_camera(db, camera_id, payload)


@router.delete(
    "/{camera_id}",
    status_code=204,
    dependencies=[Depends(require_roles("SuperAdmin", "StoreManager"))],
)
def delete_camera(camera_id: UUID, db: Session = Depends(get_db)) -> None:
    camera_service.delete_camera(db, camera_id)
