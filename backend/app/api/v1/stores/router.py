from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.auth import RoleChecker, get_current_user
from app.models import Store

router = APIRouter()

# Role checkers
require_editor = RoleChecker(["Store Manager", "Administrator"])

class StoreCreate(BaseModel):
    name: str
    location: str
    metadata_json: Dict[str, Any] = None


@router.get("/")
def list_stores(db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    stores = db.query(Store).all()
    return [{
        "id": s.id,
        "name": s.name,
        "location": s.location,
        "metadata": s.metadata_json
    } for s in stores]


@router.post("/")
def create_store(store_data: StoreCreate, db: Session = Depends(get_db), current_user: Any = Depends(require_editor)):
    new_store = Store(
        name=store_data.name,
        location=store_data.location,
        metadata_json=store_data.metadata_json
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    
    # Store registration audit log skipped for lean scope
    return {
        "id": new_store.id,
        "name": new_store.name,
        "location": new_store.location,
        "metadata": new_store.metadata_json
    }
