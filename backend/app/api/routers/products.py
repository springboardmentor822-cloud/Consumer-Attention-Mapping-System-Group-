from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, write_access
from app.db.session import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.common import Message
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.crud import CRUDService


router = APIRouter(prefix="/products", tags=["Product Management"])
service = CRUDService[Product, ProductCreate, ProductUpdate](Product, "Product")


@router.get("", response_model=list[ProductResponse])
def list_products(_: object = Depends(dashboard_access), db: Session = Depends(get_db)):
    return service.list(db)


@router.post("", response_model=ProductResponse)
def create_product(payload: ProductCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=ProductResponse)
def update_product(item_id: int, payload: ProductUpdate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_product(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)
