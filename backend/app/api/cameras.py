import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.camera import Camera
from app.models.store import Store
from app.models.zone import Zone
from app.models.event_log import EventCategory
from app.services.audit import log_event
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CameraCreate(BaseModel):
    zone_id: uuid.UUID
    name: str
    source_path: str
    is_active: Optional[bool] = True


class CameraActiveUpdate(BaseModel):
    is_active: bool


@router.get("/{store_id}/cameras")
def list_cameras(
    store_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return session.exec(select(Camera).where(Camera.store_id == store_id)).all()


@router.post("/{store_id}/cameras", status_code=201)
def create_camera(
    store_id: uuid.UUID,
    payload: CameraCreate,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Extra check beyond what shelves.py does: confirm the zone_id in the
    # payload actually belongs to THIS store. Without this, you could
    # create a Camera under store A that points at a Zone belonging to
    # store B - silently wrong data, no error, and confusing to debug
    # later since nothing else would catch it either.
    zone = session.get(Zone, payload.zone_id)
    if not zone or zone.store_id != store_id:
        raise HTTPException(
            status_code=404,
            detail="Zone not found for this store",
        )

    camera = Camera(store_id=store_id, **payload.model_dump())
    session.add(camera)
    session.commit()
    session.refresh(camera)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="camera_added",
        description=f"Camera added: {camera.name}",
        actor_user_id=_.id if _ else None,
        target_type="camera",
        target_id=camera.id,
        metadata={"store_id": str(store_id), "zone_id": str(camera.zone_id)},
    )
    return camera


@router.patch("/{store_id}/cameras/{camera_id}/active")
def set_camera_active(
    store_id: uuid.UUID,
    camera_id: uuid.UUID,
    payload: CameraActiveUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    # This flips the is_active flag in the DB. tracking_runner.py's
    # heartbeat (runs ~every 15s) re-checks this same flag and exits
    # cleanly once it sees is_active=False - see the FIXED comment
    # there. So toggling this off DOES actually stop that camera's
    # running process, just not instantly: expect up to one heartbeat
    # interval (~15s) of delay, not immediate termination.
    camera = session.get(Camera, camera_id)
    if not camera or camera.store_id != store_id:
        raise HTTPException(status_code=404, detail="Camera not found for this store")

    previous_active = camera.is_active
    camera.is_active = payload.is_active
    session.add(camera)
    session.commit()
    session.refresh(camera)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="camera_status_changed",
        description=f"Camera {camera.name} active status changed: {previous_active} -> {camera.is_active}",
        actor_user_id=_.id if _ else None,
        target_type="camera",
        target_id=camera.id,
        metadata={"old_is_active": previous_active, "new_is_active": camera.is_active},
    )
    return camera
