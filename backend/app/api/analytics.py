from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.services.analytics import AnalyticsService
from backend.app.services.segmentation_service import SegmentationService
from backend.app.services.journey_service import JourneyService

router = APIRouter(prefix="/analytics", tags=["Analytics & Retail Intelligence"])


@router.get("/{store_id}/kpis")
def get_store_kpis(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get high-level KPIs for the store."""
    service = AnalyticsService(db)
    return service.get_kpis(store_id)


@router.get("/{store_id}/heatmap")
def get_store_heatmap(
    store_id: UUID,
    time_range_hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get KDE generated heatmap data."""
    service = AnalyticsService(db)
    return service.generate_heatmap_data(store_id, time_range_hours)


@router.get("/{store_id}/attractiveness")
def get_product_attractiveness(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get product attractiveness scores."""
    service = AnalyticsService(db)
    return service.calculate_product_attractiveness(store_id)


@router.get("/{store_id}/recommendations")
def get_store_recommendations(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get actionable optimization recommendations."""
    service = AnalyticsService(db)
    return service.generate_recommendations(store_id)


@router.get("/{store_id}/segments")
def get_segments(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Retail Analyst", "Marketing Manager", "Administrator")),
):
    """Get shopper segmentation data."""
    service = SegmentationService(db)
    return {
        "segments": service.get_segments_for_store(store_id),
        "distribution": service.get_segment_distribution(store_id),
    }


@router.get("/{store_id}/journeys")
def get_journeys(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Retail Analyst", "Marketing Manager", "Administrator")),
):
    """Get customer journey data."""
    service = JourneyService(db)
    return {
        "journeys": service.get_journeys_for_store(store_id, limit=50),
        "summary": service.get_journey_summary(store_id),
        "transitions": service.get_zone_transitions(store_id),
    }


@router.get("/{store_id}/dwell-time")
def get_dwell_time(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dwell time analytics."""
    service = AnalyticsService(db)
    return service.get_dwell_time_analytics(store_id)


@router.get("/{store_id}/traffic-flow")
def get_traffic_flow(
    store_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get traffic flow data (hourly and daily)."""
    service = AnalyticsService(db)
    return service.get_traffic_flow(store_id)
