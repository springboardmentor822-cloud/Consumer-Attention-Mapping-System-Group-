from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user
from app.models import Store, Shelf

router = APIRouter()

# Role checkers
require_editor = RoleChecker(["Store Manager", "Administrator"])

class ShelfCreate(BaseModel):
    name: str
    zone_id: int
    coordinates: Dict[str, Any]


@router.get("/{store_id}")
def list_shelves(store_id: str, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    return [{
        "id": sh.id,
        "name": sh.name,
        "zone_id": sh.zone_id,
        "coordinates": sh.coordinates
    } for sh in shelves]


@router.post("/{store_id}")
def create_shelf(store_id: str, shelf_data: ShelfCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    # Verify store
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    new_shelf = Shelf(
        store_id=store_id,
        name=shelf_data.name,
        zone_id=shelf_data.zone_id,
        coordinates=shelf_data.coordinates
    )
    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)
    
    # Shelf creation audit log skipped for lean scope
    return {
        "id": new_shelf.id,
        "name": new_shelf.name,
        "zone_id": new_shelf.zone_id,
        "coordinates": new_shelf.coordinates
    }
