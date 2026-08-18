import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.store import Shelf, Store
from app.models.zone import Zone
from app.models.event_log import EventCategory
from app.services.audit import log_event
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ShelfCreate(BaseModel):
    zone_id: uuid.UUID
    shelf_name: str
    # zone_coordinates REMOVED - it used to live directly on Shelf, but
    # was moved to ShelfCameraView earlier this session (one shelf can
    # have different pixel coordinates per camera, so it can't be a
    # single field here anymore). If you need to set a shelf's
    # coordinates at creation time, that now goes through a separate
    # ShelfCameraView create call after the shelf itself exists - not
    # part of this payload.


@router.get("/{store_id}/shelves")
def list_shelves(
    store_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return session.exec(select(Shelf).where(Shelf.store_id == store_id)).all()


@router.post("/{store_id}/shelves", status_code=201)
def create_shelf(
    store_id: uuid.UUID,
    payload: ShelfCreate,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Same zone-belongs-to-this-store check added to cameras.py, for the
    # same reason: without it you could attach a shelf to a zone that
    # belongs to a different store.
    zone = session.get(Zone, payload.zone_id)
    if not zone or zone.store_id != store_id:
        raise HTTPException(
            status_code=404,
            detail="Zone not found for this store",
        )

    shelf = Shelf(store_id=store_id, **payload.model_dump())
    session.add(shelf)
    session.commit()
    session.refresh(shelf)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="shelf_modified",
        description=f"Shelf created: {shelf.shelf_name}",
        actor_user_id=_.id if _ else None,
        target_type="shelf",
        target_id=shelf.id,
        metadata={"action": "create", "store_id": str(store_id), "zone_id": str(shelf.zone_id)},
    )
    return shelf
