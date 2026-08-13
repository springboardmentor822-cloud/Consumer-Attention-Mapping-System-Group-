from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.core.database import get_db
from app.api.auth import get_current_user
from app.schemas.analytics import (
    HeatmapResponse,
    DwellMetricsResponse,
    ProductMetricItem,
    ZoneMetricItem,
    ConversionMetricItem,
    JourneyItem
)
from app.services.analytics_service import AnalyticsService
from app.repositories.analytics_repository import AnalyticsRepository
from app.utils.logging import get_structured_logger

logger = get_structured_logger("analytics_api")
router = APIRouter()

@router.get(
    "/heatmap/{store_id}",
    response_model=HeatmapResponse,
    summary="Get store heatmap data",
    description="Retrieve localized coordinates and traffic density weights for the store floor heatmap."
)
def get_heatmap(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    logger.info(f"User {current_user.email} requested heatmap for store {store_id}")
    return AnalyticsService.get_heatmap_metrics(db, store_id)


@router.get(
    "/dwell/{store_id}",
    response_model=DwellMetricsResponse,
    summary="Get dwell metrics",
    description="Retrieve average dwell durations and counts for tracking attention engagement."
)
def get_dwell(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    logger.info(f"User {current_user.email} requested dwell metrics for store {store_id}")
    return AnalyticsService.get_dwell_metrics(db, store_id)


@router.get(
    "/products/{store_id}",
    response_model=List[ProductMetricItem],
    summary="Get product metrics",
    description="Retrieve exposure, interaction, and purchase metrics for products in a specific store."
)
def get_products(
    store_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    logger.info(f"User {current_user.email} requested product metrics for store {store_id}")
    results = AnalyticsService.get_product_metrics(db, store_id)
    return results[skip : skip + limit]


@router.get(
    "/zones/{store_id}",
    response_model=List[ZoneMetricItem],
    summary="Get zone metrics",
    description="Retrieve traffic, visits, and duration metrics categorized by store zone."
)
def get_zones(
    store_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    logger.info(f"User {current_user.email} requested zone metrics for store {store_id}")
    results = AnalyticsService.get_zone_metrics(db, store_id)
    return results[skip : skip + limit]


@router.get(
    "/conversion/{store_id}",
    response_model=List[ConversionMetricItem],
    summary="Get conversion metrics",
    description="Retrieve conversion rates calculated from zone transitions to product pickups."
)
def get_conversion(
    store_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    logger.info(f"User {current_user.email} requested conversion metrics for store {store_id}")
    results = AnalyticsRepository.get_conversion_metrics(db, store_id)
    return results[skip : skip + limit]


@router.get(
    "/journey/{store_id}",
    response_model=List[JourneyItem],
    summary="Get journey metrics",
    description="Retrieve mapped customer paths and session flow charts."
)
def get_journey(
    store_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    logger.info(f"User {current_user.email} requested journey metrics for store {store_id}")
    return AnalyticsService.get_journey_metrics(db, store_id)


@router.get(
    "/segments",
    summary="Get shopper segments distribution",
    description="Retrieve shopper segmentation percentages based on trajectory analysis."
)
def get_segments(
    store_id: str = "store-1",
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    from sqlalchemy import func
    from app.models.session import Session as ShopperSession
    sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).all()
    segment_counts = {
        "Explorer": 0,
        "Quick Buyer": 0,
        "Comparison Shopper": 0,
        "Impulse Buyer": 0,
        "Brand Loyal": 0
    }
    for sess in sessions:
        seg = sess.segment or "Explorer"
        if seg in segment_counts:
            segment_counts[seg] += 1
            
    total = sum(segment_counts.values()) or 1
    return [
        {"segment": k, "percentage": round((v / total * 100), 1), "count": v}
        for k, v in segment_counts.items()
    ]


@router.get(
    "/segment-summary",
    summary="Get shopper segment telemetry summary"
)
def get_segment_summary(
    store_id: str = "store-1",
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    import datetime
    return {
        "store_id": store_id,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "summary": "Shopper behaviors compiled successfully."
    }


@router.get(
    "/heatmaps/store",
    summary="Get planogram homography traffic heatmap"
)
def get_store_heatmap(
    store_id: str = "store-1",
    camera_id: Optional[str] = None,
    zone_id: Optional[int] = None,
    shopper_segment: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    bandwidth: Optional[float] = 10.0,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return AnalyticsService.generate_advanced_heatmap(
        db, store_id, "store",
        camera_id=camera_id,
        zone_id=zone_id,
        shopper_segment=shopper_segment,
        start_time=start_time,
        end_time=end_time,
        bandwidth=bandwidth
    )


@router.get(
    "/heatmaps/shelf",
    summary="Get planogram homography shelf heatmap"
)
def get_shelf_heatmap(
    store_id: str = "store-1",
    camera_id: Optional[str] = None,
    zone_id: Optional[int] = None,
    shopper_segment: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    bandwidth: Optional[float] = 10.0,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return AnalyticsService.generate_advanced_heatmap(
        db, store_id, "shelf",
        camera_id=camera_id,
        zone_id=zone_id,
        shopper_segment=shopper_segment,
        start_time=start_time,
        end_time=end_time,
        bandwidth=bandwidth
    )


@router.get(
    "/heatmaps/zones",
    summary="Get planogram homography zones heatmap"
)
def get_zones_heatmap(
    store_id: str = "store-1",
    camera_id: Optional[str] = None,
    zone_id: Optional[int] = None,
    shopper_segment: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    bandwidth: Optional[float] = 10.0,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return AnalyticsService.generate_advanced_heatmap(
        db, store_id, "zones",
        camera_id=camera_id,
        zone_id=zone_id,
        shopper_segment=shopper_segment,
        start_time=start_time,
        end_time=end_time,
        bandwidth=bandwidth
    )


@router.get(
    "/attractiveness",
    summary="Get Min-Max normalized product attractiveness scores"
)
def get_product_attractiveness_scores(
    store_id: str = "store-1",
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return AnalyticsService.get_product_attractiveness(db, store_id)


@router.get(
    "/recommendations",
    summary="Get rule recommendation notifications"
)
def get_rule_recommendations(
    store_id: str = "store-1",
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    return AnalyticsService.get_recommendations(db, store_id)
