import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.attention import AttentionEvent
from app.models.interaction import ProductInteraction
from app.models.shelf import Shelf
from app.models.user import User
from app.schemas.behavior import (
    AttentionEventCreate,
    AttentionEventOut,
    ProductInteractionCreate,
    ProductInteractionOut,
)

router = APIRouter()


@router.post("/events", response_model=AttentionEventOut, status_code=201)
def create_attention_event(
    payload: AttentionEventCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Called by the head-pose/gaze estimation pipeline when a sustained look is detected."""
    # Count prior attention events on the same product within this session for repeat-attention tracking
    repeat_count = 0
    if payload.product_id:
        repeat_count = (
            db.query(AttentionEvent)
            .filter(
                AttentionEvent.session_id == payload.session_id,
                AttentionEvent.product_id == payload.product_id,
            )
            .count()
        )
    event = AttentionEvent(**payload.model_dump(), is_repeat_attention=repeat_count)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/events", response_model=list[AttentionEventOut])
def list_attention_events(
    session_id: int | None = None,
    product_id: int | None = None,
    shelf_id: int | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(AttentionEvent)
    if session_id:
        query = query.filter(AttentionEvent.session_id == session_id)
    if product_id:
        query = query.filter(AttentionEvent.product_id == product_id)
    if shelf_id:
        query = query.filter(AttentionEvent.shelf_id == shelf_id)
    return query.order_by(AttentionEvent.start_time.desc()).offset(skip).limit(limit).all()


@router.get("/shelf-dwell")
def shelf_dwell_summary(
    store_id: int,
    period_start: dt.datetime = Query(...),
    period_end: dt.datetime = Query(...),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Per-shelf dwell-time aggregate for a period - what Store Layout uses
    to show each shelf's "how long are people actually looking at this"
    badge. Sourced from AttentionEvent.duration_seconds (see tracking_
    simulator.py's shelf-proximity tracking for how those rows get
    created), grouped by shelf and scoped to this store via a join so a
    shelf from another store's data never leaks in."""
    results = (
        db.query(
            AttentionEvent.shelf_id,
            func.coalesce(func.sum(AttentionEvent.duration_seconds), 0.0).label("total_seconds"),
            func.avg(AttentionEvent.duration_seconds).label("avg_seconds"),
            func.count(AttentionEvent.id).label("view_count"),
        )
        .join(Shelf, Shelf.id == AttentionEvent.shelf_id)
        .filter(
            Shelf.store_id == store_id,
            AttentionEvent.shelf_id.isnot(None),
            AttentionEvent.start_time >= period_start,
            AttentionEvent.start_time <= period_end,
        )
        .group_by(AttentionEvent.shelf_id)
        .all()
    )
    return [
        {
            "shelf_id": r.shelf_id,
            "total_dwell_seconds": round(r.total_seconds or 0.0, 1),
            "avg_dwell_seconds": round(r.avg_seconds or 0.0, 1),
            "view_count": r.view_count,
        }
        for r in results
    ]


@router.post("/interactions", response_model=ProductInteractionOut, status_code=201)
def create_interaction(
    payload: ProductInteractionCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    interaction = ProductInteraction(**payload.model_dump())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


@router.get("/interactions", response_model=list[ProductInteractionOut])
def list_interactions(
    session_id: int | None = None,
    product_id: int | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(ProductInteraction)
    if session_id:
        query = query.filter(ProductInteraction.session_id == session_id)
    if product_id:
        query = query.filter(ProductInteraction.product_id == product_id)
    return query.order_by(ProductInteraction.timestamp.desc()).offset(skip).limit(limit).all()
