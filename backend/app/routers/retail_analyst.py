from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analyst_service import (
    get_analyst_overview_data,
    get_analyst_journey_data,
    get_analyst_segmentation_data,
    get_analyst_ai_insights_data,
)

router = APIRouter(prefix="/analytics/analyst", tags=["Retail Analyst Analytics"])


@router.get("/overview")
@router.get("/stores/{store_id}/overview")
def get_analyst_overview_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_analyst_overview_data(db, store_id)


@router.get("/journey")
@router.get("/stores/{store_id}/journey")
def get_analyst_journey_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_analyst_journey_data(db, store_id)


@router.get("/segmentation")
@router.get("/stores/{store_id}/segmentation")
def get_analyst_segmentation_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_analyst_segmentation_data(db, store_id)


@router.get("/insights")
@router.get("/stores/{store_id}/insights")
def get_analyst_insights_endpoint(store_id: int = 1, db: Session = Depends(get_db)):
    return get_analyst_ai_insights_data(db, store_id)
