from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.store import Store

router = APIRouter(prefix="/api/stores", tags=["stores"])

# Request/Response models
class StoreCreate(BaseModel):
    name: str
    location: str
    description: Optional[str] = None
    layout_config: dict = {}
    camera_config: dict = {}

class StoreResponse(BaseModel):
    id: str
    name: str
    location: str
    description: Optional[str]
    is_active: bool

@router.get("/", response_model=list[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    """Get all stores"""
    stores = db.query(Store).filter(Store.is_active == True).all()
    return stores

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: str, db: Session = Depends(get_db)):
    """Get a specific store"""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.post("/", response_model=StoreResponse)
def create_store(store_data: StoreCreate, db: Session = Depends(get_db)):
    """Create a new store"""
    new_store = Store(
        name=store_data.name,
        location=store_data.location,
        description=store_data.description,
        layout_config=store_data.layout_config,
        camera_config=store_data.camera_config
    )
    
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    
    return new_store

@router.delete("/{store_id}")
def delete_store(store_id: str, db: Session = Depends(get_db)):
    """Soft delete a store"""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    store.is_active = False
    db.commit()
    return {"message": "Store deleted"}