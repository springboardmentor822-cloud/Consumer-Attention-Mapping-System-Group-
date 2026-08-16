import datetime as dt

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.session import ShopperSession
from app.models.user import User
from app.schemas.behavior import ShopperSessionCreate, ShopperSessionOut, ShopperSessionUpdate
from app.services.journey_service import apply_journey_metrics
from app.services.segmentation_service import classify_sessions_for_store

router = APIRouter()


@router.post("", response_model=ShopperSessionOut, status_code=201)
def create_session(
    payload: ShopperSessionCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Called by the tracking pipeline when a new shopper entry is detected."""
    session = ShopperSession(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[ShopperSessionOut])
def list_sessions(
    store_id: int | None = None,
    active_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(ShopperSession)
    if store_id:
        query = query.filter(ShopperSession.store_id == store_id)
    if active_only:
        query = query.filter(ShopperSession.exit_time.is_(None))
    return query.order_by(ShopperSession.entry_time.desc()).offset(skip).limit(limit).all()


@router.get("/{session_id}", response_model=ShopperSessionOut)
def get_session(session_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    session = db.query(ShopperSession).filter(ShopperSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.put("/{session_id}", response_model=ShopperSessionOut)
def update_session(
    session_id: int,
    payload: ShopperSessionUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Called by the tracking pipeline on exit detection to close out a session."""
    session = db.query(ShopperSession).filter(ShopperSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    if session.exit_time and session.entry_time:
        session.total_duration_seconds = (
            session.exit_time - session.entry_time
        ).total_seconds()
        # Trajectory analysis: derive total path distance, average
        # velocity, and entry/exit zone from the session's raw tracking
        # points now that it's complete (see journey_service docstring).
        apply_journey_metrics(db, session)

    db.commit()
    db.refresh(session)
    return session


@router.post("/segment/compute", response_model=list[ShopperSessionOut])
def compute_segments(
    store_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Classifies every completed session in a store into a customer
    segment (Explorer, Quick Buyer, Comparison Shopper, Impulse Buyer,
    Brand Loyal) based on its interaction/attention data."""
    return classify_sessions_for_store(db, store_id)
