from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from app.models.shelf import Shelf
from app.models.store import Store

router = APIRouter(prefix="/api/stores/{store_id}/shelves", tags=["shelves"])

class ShelfCreate(BaseModel):
    name: str
    zone_coordinates: List[List[float]]
    shelf_level: Optional[str] = None
    category: Optional[str] = None
    product_list: List[dict] = []

class ShelfResponse(BaseModel):
    id: str
    name: str
    zone_coordinates: List[List[float]]
    shelf_level: Optional[str]
    category: Optional[str]
    is_active: bool

@router.get("/", response_model=list[ShelfResponse])
def get_shelves(store_id: str, db: Session = Depends(get_db)):
    """Get all shelves in a store"""
    # Check if store exists
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    shelves = db.query(Shelf).filter(
        Shelf.store_id == store_id,
        Shelf.is_active == True
    ).all()
    return shelves

@router.get("/{shelf_id}", response_model=ShelfResponse)
def get_shelf(store_id: str, shelf_id: str, db: Session = Depends(get_db)):
    """Get a specific shelf"""
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id,
        Shelf.store_id == store_id
    ).first()
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    return shelf

@router.post("/", response_model=ShelfResponse)
def create_shelf(store_id: str, shelf_data: ShelfCreate, db: Session = Depends(get_db)):
    """Create a new shelf"""
    # Check if store exists
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    new_shelf = Shelf(
        store_id=store_id,
        name=shelf_data.name,
        zone_coordinates=shelf_data.zone_coordinates,
        shelf_level=shelf_data.shelf_level,
        category=shelf_data.category,
        product_list=shelf_data.product_list
    )
    
    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)
    
    return new_shelf