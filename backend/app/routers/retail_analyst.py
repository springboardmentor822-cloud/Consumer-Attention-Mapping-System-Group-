from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import UserRole
from app.services.analyst_service import (
    get_analyst_overview_data,
    get_analyst_journey_data,
    get_analyst_segmentation_data,
    get_analyst_heatmap_data,
    get_analyst_product_attractiveness_data,
    get_analyst_ai_insights_data,
)

router = APIRouter(prefix="/analytics/analyst", tags=["Retail Analyst Analytics"])

ANALYST_ROLES = (UserRole.RETAIL_ANALYST, UserRole.ADMINISTRATOR)


@router.get("/overview")
@router.get("/stores/{store_id}/overview")
def get_analyst_overview_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*ANALYST_ROLES))
):
    return get_analyst_overview_data(db, store_id)


@router.get("/journey")
@router.get("/stores/{store_id}/journey")
def get_analyst_journey_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*ANALYST_ROLES))
):
    return get_analyst_journey_data(db, store_id)


@router.get("/segmentation")
@router.get("/stores/{store_id}/segmentation")
def get_analyst_segmentation_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*ANALYST_ROLES))
):
    return get_analyst_segmentation_data(db, store_id)


@router.get("/heatmaps")
@router.get("/stores/{store_id}/heatmaps")
def get_analyst_heatmaps_endpoint(
    store_id: int = 1,
    heatmap_type: str = Query("traffic", description="traffic, shelf, product_attention, or hotspots"),
    db: Session = Depends(get_db),
    _=Depends(require_role(*ANALYST_ROLES))
):
    return get_analyst_heatmap_data(db, store_id, heatmap_type)


@router.get("/product-attractiveness")
@router.get("/stores/{store_id}/product-attractiveness")
def get_analyst_product_attractiveness_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*ANALYST_ROLES))
):
    return get_analyst_product_attractiveness_data(db, store_id)


@router.get("/recommendations")
@router.get("/stores/{store_id}/recommendations")
@router.get("/insights")
@router.get("/stores/{store_id}/insights")
def get_analyst_insights_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*ANALYST_ROLES))
):
    return get_analyst_ai_insights_data(db, store_id)
