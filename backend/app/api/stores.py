import uuid

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.store import Store
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class StoreCreate(BaseModel):
    name: str
    location: Optional[str] = None
    store_metadata: Optional[dict] = None


@router.get("")
def list_stores(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return session.exec(select(Store)).all()


@router.post("", status_code=201)
def create_store(
    payload: StoreCreate,
    session: Session = Depends(get_session),
    _=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    store = Store(**payload.model_dump())
    session.add(store)
    session.commit()
    session.refresh(store)
    return store
