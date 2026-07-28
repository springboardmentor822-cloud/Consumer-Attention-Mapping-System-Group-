from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.models.tracking import ShopperSession, AttentionEvent, InteractionEvent
from backend.app.schemas.tracking import (
    ShopperSessionCreate, ShopperSessionRead, ShopperSessionUpdate,
    AttentionEventCreate, AttentionEventRead,
    InteractionEventCreate, InteractionEventRead
)


router = APIRouter(prefix="/tracking", tags=["Tracking & Analytics"])


@router.post("/sessions", response_model=ShopperSessionRead, status_code=201)
def create_shopper_session(
    store_id: UUID,
    payload: ShopperSessionCreate,
    db: Session = Depends(get_db),
    # Might be called by a service account or internal script
) -> ShopperSessionRead:
    session_obj = ShopperSession(store_id=store_id, **payload.model_dump())
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.put("/sessions/{session_id}", response_model=ShopperSessionRead)
def update_shopper_session(
    session_id: UUID,
    payload: ShopperSessionUpdate,
    db: Session = Depends(get_db),
) -> ShopperSessionRead:
    session_obj = db.query(ShopperSession).filter(ShopperSession.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session_obj, key, value)
        
    db.commit()
    db.refresh(session_obj)
    return session_obj


@router.post("/sessions/{session_id}/attention", response_model=AttentionEventRead, status_code=201)
def log_attention_event(
    session_id: UUID,
    payload: AttentionEventCreate,
    db: Session = Depends(get_db),
) -> AttentionEventRead:
    event = AttentionEvent(session_id=session_id, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/sessions/{session_id}/interaction", response_model=InteractionEventRead, status_code=201)
def log_interaction_event(
    session_id: UUID,
    payload: InteractionEventCreate,
    db: Session = Depends(get_db),
) -> InteractionEventRead:
    event = InteractionEvent(session_id=session_id, **payload.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
