"""
Consumer Behavior Intelligence Engine - Phase 1 (dwell time, engagement,
traffic flow). Built entirely on real tracking_data via TrackingRepository
and app/analytics/. No fabricated metrics: engagement is documented as a
movement-derived proxy (no gaze/attention sensor exists), and conversion/
revenue are out of scope here since no sales data exists in this schema.
"""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.analytics.services import build_zone_flow, run_behavior_analysis
from app.api.deps import dashboard_access, resolve_camera_scope, resolve_store_scope
from app.db.session import get_db
from app.models.camera import Camera
from app.models.shelf import Shelf
from app.models.user import User
from app.models.zone import Zone
from app.schemas.analytics_engine import (
    DwellBreakdownItem,
    DwellResponse,
    EngagementResponse,
    TrafficResponse,
    ZoneFlowEdgeSchema,
    ZoneFlowNodeSchema,
)

router = APIRouter(prefix="/analytics", tags=["Consumer Behavior Intelligence"])


def _camera_ids_for_store(db: Session, store_id: int | None) -> list[int]:
    query = db.query(Camera.id)
    if store_id is not None:
        query = query.filter(Camera.store_id == store_id)
    return [c.id for c in query.all()]


def _zone_ids_for_store(db: Session, store_id: int | None) -> list[int]:
    query = db.query(Zone.id)
    if store_id is not None:
        query = query.filter(Zone.store_id == store_id)
    return [z.id for z in query.all()]


def _resolve_camera_scope(
    db: Session,
    current_user: User,
    effective_store_id: int | None,
    camera_id: int | None,
    shelf_id: int | None,
) -> list[int] | None:
    """None means 'no restriction' (all cameras). Order of precedence: an
    explicit shelf_id or camera_id narrows to one camera; otherwise fall back
    to the resolved store's cameras (or every camera, if no store scope)."""
    if shelf_id is not None:
        shelf = db.get(Shelf, shelf_id)
        if shelf is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")
        if shelf.camera_id is None:
            return []
        resolve_camera_scope(db, current_user, shelf.camera_id)  # 403s if out of a Store Manager's scope
        return [shelf.camera_id]

    if camera_id is not None:
        resolve_camera_scope(db, current_user, camera_id)
        return [camera_id]

    allowed = resolve_camera_scope(db, current_user, None)
    if allowed is not None:
        return allowed  # Store Manager - always scoped to their own store

    if effective_store_id is not None:
        return _camera_ids_for_store(db, effective_store_id)

    return None


@router.get("/dwell", response_model=DwellResponse)
def get_dwell(
    store_id: int | None = Query(default=None),
    zone_id: int | None = Query(default=None),
    camera_id: int | None = Query(default=None),
    shelf_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    camera_ids = _resolve_camera_scope(db, current_user, effective_store_id, camera_id, shelf_id)
    zone_ids = [zone_id] if zone_id is not None else None

    result = run_behavior_analysis(db, camera_ids, zone_ids, date_from, date_to)

    zone_names = {z.id: z.zone_name for z in db.query(Zone).all()}
    shelf_by_camera = {s.camera_id: s.shelf_name for s in db.query(Shelf).filter(Shelf.camera_id.isnot(None)).all()}

    by_zone = [
        DwellBreakdownItem(
            scope_id=zid,
            scope_name=zone_names.get(zid, f"Zone {zid}") if zid is not None else "No Zone",
            total_seconds=s.total_seconds,
            average_seconds=s.average_seconds,
            max_seconds=s.max_seconds,
            min_seconds=s.min_seconds,
            visit_count=s.visit_count,
        )
        for zid, s in result.dwell_by_zone.items()
    ]
    by_shelf = [
        DwellBreakdownItem(
            scope_id=cid,
            scope_name=shelf_by_camera.get(cid, f"Camera {cid}"),
            total_seconds=s.total_seconds,
            average_seconds=s.average_seconds,
            max_seconds=s.max_seconds,
            min_seconds=s.min_seconds,
            visit_count=s.visit_count,
        )
        for cid, s in result.dwell_by_camera.items()
        if cid in shelf_by_camera
    ]

    return DwellResponse(
        store_id=effective_store_id,
        total_seconds=result.dwell_summary.total_seconds,
        average_seconds=result.dwell_summary.average_seconds,
        max_seconds=result.dwell_summary.max_seconds,
        min_seconds=result.dwell_summary.min_seconds,
        visit_count=result.dwell_summary.visit_count,
        by_zone=sorted(by_zone, key=lambda i: i.total_seconds, reverse=True),
        by_shelf=sorted(by_shelf, key=lambda i: i.total_seconds, reverse=True),
    )


@router.get("/engagement", response_model=EngagementResponse)
def get_engagement(
    store_id: int | None = Query(default=None),
    zone_id: int | None = Query(default=None),
    camera_id: int | None = Query(default=None),
    shelf_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    camera_ids = _resolve_camera_scope(db, current_user, effective_store_id, camera_id, shelf_id)
    zone_ids = [zone_id] if zone_id is not None else None

    result = run_behavior_analysis(db, camera_ids, zone_ids, date_from, date_to)
    summary = result.engagement_summary

    return EngagementResponse(
        store_id=effective_store_id,
        average_score=summary.average_score,
        average_standing_seconds=summary.average_standing_seconds,
        average_interaction_seconds=summary.average_interaction_seconds,
        average_viewing_seconds=summary.average_viewing_seconds,
        sample_size=summary.sample_size,
        note=(
            "Standing/interaction/viewing time and the engagement score are derived from "
            "tracked movement speed and dwell duration - there is no gaze or attention sensor "
            "in this system, so this is a real but proxy measure, not literal attention tracking."
        ),
    )


@router.get("/traffic", response_model=TrafficResponse)
def get_traffic(
    store_id: int | None = Query(default=None),
    zone_id: int | None = Query(default=None),
    camera_id: int | None = Query(default=None),
    shelf_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    camera_ids = _resolve_camera_scope(db, current_user, effective_store_id, camera_id, shelf_id)

    repo_zone_ids = [zone_id] if zone_id is not None else _zone_ids_for_store(db, effective_store_id)

    result = run_behavior_analysis(db, camera_ids, None, date_from, date_to)
    flow = build_zone_flow(db, repo_zone_ids, since=date_from)

    return TrafficResponse(
        store_id=effective_store_id,
        average_speed_px_per_sec=result.traffic_summary.average_speed_px_per_sec,
        total_distance_px=result.traffic_summary.total_distance_px,
        sample_size=result.traffic_summary.sample_size,
        zone_flow_nodes=[ZoneFlowNodeSchema(zone_id=n.zone_id, zone_name=n.zone_name) for n in flow.nodes],
        zone_flow_edges=[
            ZoneFlowEdgeSchema(from_zone_id=e.from_zone_id, to_zone_id=e.to_zone_id, count=e.count)
            for e in flow.edges
        ],
        note=(
            "Speed/distance are in pixel-space per second (no per-camera floor-plan calibration "
            "exists yet to convert to real-world units like meters)."
        ),
    )
