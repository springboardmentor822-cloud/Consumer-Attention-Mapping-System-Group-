import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.store import Shelf
from app.models.camera import Camera
from app.models.shelf_camera_view import ShelfCameraView
from app.models.event_log import EventCategory
from app.services.audit import log_event
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ShelfCameraViewCreate(BaseModel):
    camera_id: uuid.UUID
    zone_coordinates: Optional[list] = None


@router.get("/{shelf_id}/camera-views")
def list_shelf_camera_views(
    shelf_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    shelf = session.get(Shelf, shelf_id)
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return session.exec(
        select(ShelfCameraView).where(ShelfCameraView.shelf_id == shelf_id)
    ).all()


@router.post("/{shelf_id}/camera-views", status_code=201)
def create_shelf_camera_view(
    shelf_id: uuid.UUID,
    payload: ShelfCameraViewCreate,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    shelf = session.get(Shelf, shelf_id)
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")

    camera = session.get(Camera, payload.camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    # Same store-ownership guard used in shelves.py/cameras.py — a shelf
    # and camera from two different stores being linked would be a real
    # data-integrity bug, not just an edge case.
    if camera.store_id != shelf.store_id:
        raise HTTPException(
            status_code=400,
            detail="Camera does not belong to the same store as this shelf",
        )

    # Dedup guard: this pair may already exist. No DB-level unique
    # constraint has been added (that's a schema migration decision,
    # deliberately deferred — see the DB-drift risk already known on this
    # project, e.g. the ShopperSegment/PasswordResetToken import gaps).
    # This is a route-level check instead: cheap, no migration required,
    # and it's what was actually causing duplicate rows in practice.
    existing = session.exec(
        select(ShelfCameraView).where(
            ShelfCameraView.shelf_id == shelf_id,
            ShelfCameraView.camera_id == payload.camera_id,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This shelf is already linked to this camera",
        )

    view = ShelfCameraView(shelf_id=shelf_id, **payload.model_dump())
    session.add(view)
    session.commit()
    session.refresh(view)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="shelf_modified",
        description=f"Shelf-camera view added for shelf {shelf.shelf_name}",
        actor_user_id=_.id if _ else None,
        target_type="shelf",
        target_id=shelf.id,
        metadata={
            "action": "camera_view_added",
            "camera_id": str(camera.id),
            "shelf_camera_view_id": str(view.id),
        },
    )
    return view
