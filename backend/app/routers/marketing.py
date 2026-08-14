from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import UserRole
from app.services.marketing_service import (
    get_marketing_overview_data,
    get_campaign_analytics_data,
    get_marketing_visibility_data,
    get_marketing_recommendations_data,
    get_sales_insights_data,
    get_conversion_analytics_data,
)

router = APIRouter(prefix="/analytics/marketing", tags=["Marketing Manager Analytics"])

MARKETING_ROLES = (UserRole.MARKETING_MANAGER, UserRole.ADMINISTRATOR)


@router.get("/overview")
@router.get("/stores/{store_id}/overview")
def get_marketing_overview_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MARKETING_ROLES))
):
    return get_marketing_overview_data(db, store_id)


@router.get("/campaigns")
@router.get("/stores/{store_id}/campaigns")
def get_campaign_analytics_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MARKETING_ROLES))
):
    return get_campaign_analytics_data(db, store_id)


@router.get("/visibility")
@router.get("/stores/{store_id}/visibility")
def get_marketing_visibility_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MARKETING_ROLES))
):
    return get_marketing_visibility_data(db, store_id)


@router.get("/recommendations")
@router.get("/stores/{store_id}/recommendations")
def get_marketing_recommendations_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MARKETING_ROLES))
):
    return get_marketing_recommendations_data(db, store_id)


@router.get("/sales-insights")
@router.get("/stores/{store_id}/sales-insights")
def get_sales_insights_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MARKETING_ROLES))
):
    return get_sales_insights_data(db, store_id)


@router.get("/conversion")
@router.get("/stores/{store_id}/conversion")
def get_conversion_analytics_endpoint(
    store_id: int = 1,
    db: Session = Depends(get_db),
    _=Depends(require_role(*MARKETING_ROLES))
):
    return get_conversion_analytics_data(db, store_id)
