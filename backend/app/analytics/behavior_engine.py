"""
Orchestrates dwell_time + engagement + traffic_flow into one pass over a set
of already-fetched tracking_data rows. Pure computation, no DB access - see
services.py for the layer that fetches rows (via TrackingRepository) and
persists results (DwellMetric/EngagementMetric).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.dwell_time import (
    DwellSummary,
    Visit,
    group_by_camera,
    group_by_zone,
    segment_all_visits,
    summarize_dwell,
)
from app.analytics.engagement import (
    EngagementResult,
    EngagementSummary,
    compute_engagement_for_visits,
    summarize_engagement,
)
from app.analytics.traffic_flow import TrafficFlowSummary, summarize_traffic_flow
from app.models.tracking_data import TrackingData


@dataclass
class BehaviorAnalysisResult:
    visits: list[Visit]
    dwell_summary: DwellSummary
    dwell_by_zone: dict[int | None, DwellSummary]
    dwell_by_camera: dict[int, DwellSummary]
    engagement_results: list[EngagementResult]
    engagement_summary: EngagementSummary
    traffic_summary: TrafficFlowSummary


def analyze_behavior(rows: list[TrackingData]) -> BehaviorAnalysisResult:
    visits = segment_all_visits(rows)

    dwell_by_zone = {zone_id: summarize_dwell(v) for zone_id, v in group_by_zone(visits).items()}
    dwell_by_camera = {camera_id: summarize_dwell(v) for camera_id, v in group_by_camera(visits).items()}

    engagement_results = compute_engagement_for_visits(visits)

    return BehaviorAnalysisResult(
        visits=visits,
        dwell_summary=summarize_dwell(visits),
        dwell_by_zone=dwell_by_zone,
        dwell_by_camera=dwell_by_camera,
        engagement_results=engagement_results,
        engagement_summary=summarize_engagement(engagement_results),
        traffic_summary=summarize_traffic_flow(rows),
    )
