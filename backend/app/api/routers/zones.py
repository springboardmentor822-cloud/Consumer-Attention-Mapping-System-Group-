from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, write_access
from app.db.session import get_db
from app.models.zone import Zone
from app.models.user import User
from app.schemas.common import Message
from app.schemas.zone import ZoneCreate, ZoneResponse, ZoneUpdate
from app.services.crud import CRUDService

router = APIRouter(prefix="/zones", tags=["Zone Management"])

service = CRUDService[Zone, ZoneCreate, ZoneUpdate](Zone, "Zone")


@router.get("", response_model=list[ZoneResponse])
def list_zones(_: object = Depends(dashboard_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=ZoneResponse)
def create_zone(payload: ZoneCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=ZoneResponse)
def update_zone(item_id: int, payload: ZoneUpdate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_zone(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)
