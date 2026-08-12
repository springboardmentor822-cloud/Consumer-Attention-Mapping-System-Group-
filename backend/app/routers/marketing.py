from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.marketing_service import (
    get_marketing_overview_data,
    get_campaign_analytics_data,
    get_sales_insights_data,
    get_conversion_analytics_data,
)

router = APIRouter(prefix="/analytics/marketing", tags=["Marketing Manager Analytics"])


@router.get("/overview")
@router.get("/stores/{store_id}/overview")
def get_marketing_overview_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_marketing_overview_data(db, store_id)


@router.get("/campaigns")
@router.get("/stores/{store_id}/campaigns")
def get_campaign_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_campaign_analytics_data(db, store_id)


@router.get("/sales-insights")
@router.get("/stores/{store_id}/sales-insights")
def get_sales_insights_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_sales_insights_data(db, store_id)


@router.get("/conversion")
@router.get("/stores/{store_id}/conversion")
def get_conversion_analytics_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_conversion_analytics_data(db, store_id)
