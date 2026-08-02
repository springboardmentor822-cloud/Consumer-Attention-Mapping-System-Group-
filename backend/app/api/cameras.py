import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.camera import Camera
from app.models.store import Store
from app.models.zone import Zone
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class CameraCreate(BaseModel):
    zone_id: uuid.UUID
    name: str
    source_path: str
    is_active: Optional[bool] = True


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
    return camera
