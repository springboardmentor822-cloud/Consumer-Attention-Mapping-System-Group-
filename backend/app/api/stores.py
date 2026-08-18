import uuid

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.deps import require_roles, get_current_user
from app.models.store import Store
from app.models.event_log import EventCategory
from app.services.audit import log_event
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class StoreCreate(BaseModel):
    name: str
    location: Optional[str] = None
    store_metadata: Optional[dict] = None


@router.get("")
def list_stores(
    session: Session = Depends(get_session),
    current_user=Depends(get_current_user),
):
    role_name = current_user.role.name if current_user.role else None

    # Scoped to StoreManager only. Analyst/SuperAdmin/MarketingManager
    # stay unrestricted — matches their existing unrestricted access on
    # every other analytics endpoint in this project (dwell-time,
    # traffic, attractiveness, heatmaps, recommendations all already
    # allow Analyst across every store, no per-store gate). Scoping
    # list_stores alone for Analyst while leaving those open would be
    # an inconsistent, confusing restriction, not a safer one.
    if role_name == "StoreManager":
        return session.exec(
            select(Store).where(Store.owner_id == current_user.id)
        ).all()

    return session.exec(select(Store)).all()


@router.post("", status_code=201)
def create_store(
    payload: StoreCreate,
    session: Session = Depends(get_session),
    current_user=Depends(require_roles("StoreManager", "SuperAdmin")),
):
    role_name = current_user.role.name if current_user.role else None

    # A StoreManager creating a store should own it by default — without
    # this, a StoreManager could create a store and then immediately be
    # unable to see it in list_stores, since owner_id would be NULL.
    # SuperAdmin creating a store leaves owner_id unset (NULL) — no
    # single-owner assumption makes sense for an admin-created store;
    # assigning an owner afterward is a separate, deliberate action, not
    # something to guess at here.
    owner_id = current_user.id if role_name == "StoreManager" else None

    store = Store(owner_id=owner_id, **payload.model_dump())
    session.add(store)
    session.commit()
    session.refresh(store)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="store_updated",
        description=f"Store created: {store.name}",
        actor_user_id=current_user.id,
        target_type="store",
        target_id=store.id,
        metadata={"action": "create"},
    )
    return store
