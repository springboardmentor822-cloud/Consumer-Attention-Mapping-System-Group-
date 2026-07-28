from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.zone import Zone
from backend.app.schemas.zone import ZoneCreate, ZoneRead, ZoneUpdate


router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("", response_model=list[ZoneRead])
def list_zones(
    store_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ZoneRead]:
    query = db.query(Zone)
    if store_id:
        query = query.filter(Zone.store_id == store_id)
    return query.all()


@router.get("/{zone_id}", response_model=ZoneRead)
def get_zone(
    zone_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ZoneRead:
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return zone


@router.post("", response_model=ZoneRead, status_code=201)
def create_zone(
    store_id: UUID,
    payload: ZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Store Manager")),
) -> ZoneRead:
    zone = Zone(store_id=store_id, **payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/{zone_id}", response_model=ZoneRead)
def update_zone(
    zone_id: UUID,
    payload: ZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Store Manager")),
) -> ZoneRead:
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(zone, key, value)
        
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}", status_code=204)
def delete_zone(
    zone_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Store Manager")),
) -> None:
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    db.delete(zone)
    db.commit()
