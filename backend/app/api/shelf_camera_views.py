import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.store import Shelf
from app.models.camera import Camera
from app.models.shelf_camera_view import ShelfCameraView
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

    # NOTE: no uniqueness check here yet. The model's docstring flags that
    # (shelf_id, camera_id) should probably be unique — deliberately not
    # enforced here since that's a schema-level decision (needs an ALTER
    # TABLE on the live DB, same drift risk as the shelf.zone_id issue
    # fixed earlier this session), not something to add silently inside
    # a route handler. Re-running this POST for the same shelf+camera
    # pair will currently just create a duplicate row.
    view = ShelfCameraView(shelf_id=shelf_id, **payload.model_dump())
    session.add(view)
    session.commit()
    session.refresh(view)
    return view
