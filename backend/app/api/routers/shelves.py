from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, write_access
from app.db.session import get_db
from app.models.shelf import Shelf
from app.models.user import User
from app.schemas.common import Message
from app.schemas.shelf import ShelfCreate, ShelfResponse, ShelfUpdate
from app.services.crud import CRUDService


router = APIRouter(prefix="/shelves", tags=["Shelf Management"])
service = CRUDService[Shelf, ShelfCreate, ShelfUpdate](Shelf, "Shelf")


@router.get("", response_model=list[ShelfResponse])
def list_shelves(_: object = Depends(dashboard_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=ShelfResponse)
def create_shelf(payload: ShelfCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=ShelfResponse)
def update_shelf(item_id: int, payload: ShelfUpdate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_shelf(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)
