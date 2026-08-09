"""
Bridges app/analytics/'s pure computation (behavior_engine.py) with the
database: fetches raw points via TrackingRepository (never duplicating its
queries), runs the analysis, and persists the results into
dwell_metrics/engagement_metrics. Called by the API router in
app/api/routers/analytics_engine.py.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.analytics.behavior_engine import BehaviorAnalysisResult, analyze_behavior
from app.analytics.traffic_flow import ZoneFlowGraph, build_zone_flow_graph
from app.models.dwell_metric import DwellMetric
from app.models.engagement_metric import EngagementMetric
from app.models.zone import Zone
from app.services.tracking_repository import TrackingRepository


def run_behavior_analysis(
    db: Session,
    camera_ids: list[int] | None,
    zone_ids: list[int] | None,
    since: datetime | None,
    until: datetime | None,
) -> BehaviorAnalysisResult:
    """Fetches the scope's raw points and runs the full dwell/engagement/
    traffic-flow analysis, persisting the visit-level results as a side
    effect (see _persist_results). Safe to call repeatedly - persistence is
    idempotent, keyed on (customer_id, camera_id, entry_time)."""
    repo = TrackingRepository(db)
    rows = repo.get_points_in_range(camera_ids=camera_ids, zone_ids=zone_ids, since=since, until=until)
    result = analyze_behavior(rows)
    _persist_results(db, result)
    return result


def _persist_results(db: Session, result: BehaviorAnalysisResult) -> None:
    if not result.visits:
        return

    customer_ids = {v.customer_id for v in result.visits}
    existing_dwell_keys = {
        (row.customer_id, row.camera_id, row.entry_time)
        for row in db.query(DwellMetric.customer_id, DwellMetric.camera_id, DwellMetric.entry_time)
        .filter(DwellMetric.customer_id.in_(customer_ids))
        .all()
    }
    existing_engagement_keys = {
        (row.customer_id, row.camera_id, row.entry_time)
        for row in db.query(
            EngagementMetric.customer_id, EngagementMetric.camera_id, EngagementMetric.entry_time
        )
        .filter(EngagementMetric.customer_id.in_(customer_ids))
        .all()
    }

    new_dwell_rows = [
        DwellMetric(
            customer_id=v.customer_id,
            camera_id=v.camera_id,
            zone_id=v.zone_id,
            entry_time=v.entry_time,
            exit_time=v.exit_time,
            duration_seconds=v.duration_seconds,
        )
        for v in result.visits
        if (v.customer_id, v.camera_id, v.entry_time) not in existing_dwell_keys
    ]

    # engagement_results is built as [compute_engagement_for_visit(v) for v in
    # visits] (see behavior_engine.py) - same order as result.visits, so pairing
    # by position is correct. A dict keyed by (customer_id, camera_id) would be
    # wrong here: the same customer can visit the same camera multiple times in
    # one query window, and that key isn't unique across visits.
    new_engagement_rows = []
    for visit, engagement in zip(result.visits, result.engagement_results):
        key = (visit.customer_id, visit.camera_id, visit.entry_time)
        if key in existing_engagement_keys:
            continue
        new_engagement_rows.append(
            EngagementMetric(
                customer_id=visit.customer_id,
                camera_id=visit.camera_id,
                zone_id=visit.zone_id,
                entry_time=visit.entry_time,
                standing_time_seconds=engagement.standing_time_seconds,
                interaction_time_seconds=engagement.interaction_time_seconds,
                viewing_time_seconds=engagement.viewing_time_seconds,
                engagement_score=engagement.engagement_score,
            )
        )

    if new_dwell_rows:
        db.add_all(new_dwell_rows)
    if new_engagement_rows:
        db.add_all(new_engagement_rows)
    if new_dwell_rows or new_engagement_rows:
        db.commit()


def build_zone_flow(db: Session, zone_ids: list[int], since: datetime | None) -> ZoneFlowGraph:
    """Reuses TrackingRepository.zone_transitions() (already built for the
    existing Customer Journey Flow feature) rather than recomputing
    transitions from scratch."""
    transitions = TrackingRepository(db).zone_transitions(zone_ids, since=since)
    zone_names = {z.id: z.zone_name for z in db.query(Zone).filter(Zone.id.in_(zone_ids)).all()} if zone_ids else {}
    return build_zone_flow_graph(transitions, zone_names)
