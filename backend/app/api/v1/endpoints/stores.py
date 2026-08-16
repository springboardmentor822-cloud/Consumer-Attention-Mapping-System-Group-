from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.store import Store, StoreZone
from app.models.user import User
from app.schemas.store import (
    StoreCreate,
    StoreOut,
    StoreUpdate,
    StoreZoneCreate,
    StoreZoneOut,
)

router = APIRouter()


@router.post("", response_model=StoreOut, status_code=201)
def create_store(
    payload: StoreCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    store = Store(**payload.model_dump())
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("", response_model=list[StoreOut])
def list_stores(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(Store).offset(skip).limit(limit).all()


@router.get("/{store_id}", response_model=StoreOut)
def get_store(store_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.put("/{store_id}", response_model=StoreOut)
def update_store(
    store_id: int,
    payload: StoreUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(store, field, value)
    db.commit()
    db.refresh(store)
    return store


@router.delete("/{store_id}", status_code=204)
def delete_store(
    store_id: int, db: Session = Depends(get_db), _user: User = Depends(require_admin_or_manager)
):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    db.delete(store)
    db.commit()
    return None


@router.post("/zones", response_model=StoreZoneOut, status_code=201)
def create_zone(
    payload: StoreZoneCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    zone = StoreZone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/{store_id}/zones", response_model=list[StoreZoneOut])
def list_zones(store_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return db.query(StoreZone).filter(StoreZone.store_id == store_id).all()
