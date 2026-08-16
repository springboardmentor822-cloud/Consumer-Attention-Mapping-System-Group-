from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.shelf import Shelf, ShelfCategory
from app.models.user import User
from app.schemas.catalog import (
    ShelfCategoryCreate,
    ShelfCategoryOut,
    ShelfCreate,
    ShelfOut,
    ShelfUpdate,
)

router = APIRouter()


@router.post("/categories", response_model=ShelfCategoryOut, status_code=201)
def create_shelf_category(
    payload: ShelfCategoryCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    existing = db.query(ShelfCategory).filter(ShelfCategory.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A shelf category with this name already exists")
    category = ShelfCategory(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/categories", response_model=list[ShelfCategoryOut])
def list_shelf_categories(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return db.query(ShelfCategory).all()


@router.post("", response_model=ShelfOut, status_code=201)
def create_shelf(
    payload: ShelfCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    shelf = Shelf(**payload.model_dump(exclude_none=True))
    db.add(shelf)
    db.commit()
    db.refresh(shelf)
    return shelf


@router.get("", response_model=list[ShelfOut])
def list_shelves(
    store_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Shelf)
    if store_id:
        query = query.filter(Shelf.store_id == store_id)
    return query.all()


@router.get("/{shelf_id}", response_model=ShelfOut)
def get_shelf(shelf_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf


@router.put("/{shelf_id}", response_model=ShelfOut)
def update_shelf(
    shelf_id: int,
    payload: ShelfUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(shelf, field, value)
    db.commit()
    db.refresh(shelf)
    return shelf


@router.delete("/{shelf_id}", status_code=204)
def delete_shelf(
    shelf_id: int, db: Session = Depends(get_db), _user: User = Depends(require_admin_or_manager)
):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    db.delete(shelf)
    db.commit()
    return None
