import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.zone import Zone, ZoneType
from app.models.store import Store
from pydantic import BaseModel

router = APIRouter()


class ZoneCreate(BaseModel):
    name: str
    zone_type: ZoneType


@router.get("/{store_id}/zones")
def list_zones(
    store_id: uuid.UUID,
    session: Session = Depends(get_session),
    _=Depends(get_current_user),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return session.exec(select(Zone).where(Zone.store_id == store_id)).all()


@router.post("/{store_id}/zones", status_code=201)
def create_zone(
    store_id: uuid.UUID,
    payload: ZoneCreate,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    store = session.get(Store, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    zone = Zone(store_id=store_id, **payload.model_dump())
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone
