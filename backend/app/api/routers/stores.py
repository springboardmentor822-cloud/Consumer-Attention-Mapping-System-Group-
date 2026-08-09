from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, write_access
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.common import Message
from app.schemas.store import StoreCreate, StoreResponse, StoreUpdate
from app.services.crud import CRUDService


router = APIRouter(prefix="/stores", tags=["Store Management"])
service = CRUDService[Store, StoreCreate, StoreUpdate](Store, "Store")


@router.get("", response_model=list[StoreResponse])
def list_stores(_: object = Depends(dashboard_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=StoreResponse)
def create_store(payload: StoreCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=StoreResponse)
def update_store(item_id: int, payload: StoreUpdate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_store(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)
