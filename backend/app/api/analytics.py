from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Any
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
