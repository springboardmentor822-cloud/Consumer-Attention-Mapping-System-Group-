from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.services.analytics import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics & Retail Intelligence"])


@router.get("/{store_id}/kpis")
def get_store_kpis(
    store_id: UUID,
    db: Session = Depends(get_db)
):
    """Get high-level KPIs for the store."""
    service = AnalyticsService(db)
    return service.get_kpis(store_id)


@router.get("/{store_id}/heatmap")
def get_store_heatmap(
    store_id: UUID,
    time_range_hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """Get KDE generated heatmap data."""
    service = AnalyticsService(db)
    return service.generate_heatmap_data(store_id, time_range_hours)


@router.get("/{store_id}/attractiveness")
def get_product_attractiveness(
    store_id: UUID,
    db: Session = Depends(get_db)
):
    """Get product attractiveness scores."""
    service = AnalyticsService(db)
    return service.calculate_product_attractiveness(store_id)


@router.get("/{store_id}/recommendations")
def get_store_recommendations(
    store_id: UUID,
    db: Session = Depends(get_db)
):
    """Get actionable optimization recommendations."""
    service = AnalyticsService(db)
    return service.generate_recommendations(store_id)
