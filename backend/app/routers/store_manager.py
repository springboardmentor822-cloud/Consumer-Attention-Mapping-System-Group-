from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.store_manager_service import (
    get_store_manager_dashboard_data,
    get_store_manager_cameras_data,
    get_store_manager_visitors_data,
    get_store_manager_traffic_data,
    get_store_manager_shelf_data,
    get_store_manager_product_data,
    get_store_manager_heatmaps_data,
    get_store_manager_alerts_data,
    get_store_manager_reports_data,
    get_store_manager_activities_data,
    get_store_manager_settings_data,
)

router = APIRouter(prefix="/store-manager", tags=["Store Manager Module"])


@router.get("/dashboard")
@router.get("/stores/{store_id}/dashboard")
def get_sm_dashboard(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_dashboard_data(db, store_id)


@router.get("/live-cameras")
@router.get("/stores/{store_id}/live-cameras")
def get_sm_live_cameras(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_cameras_data(db, store_id)


@router.get("/visitors")
@router.get("/stores/{store_id}/visitors")
def get_sm_visitors(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_visitors_data(db, store_id)


@router.get("/store-traffic")
@router.get("/stores/{store_id}/store-traffic")
def get_sm_traffic(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_traffic_data(db, store_id)


@router.get("/shelf-performance")
@router.get("/stores/{store_id}/shelf-performance")
def get_sm_shelf(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_shelf_data(db, store_id)


@router.get("/product-interaction")
@router.get("/stores/{store_id}/product-interaction")
def get_sm_product(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_product_data(db, store_id)


@router.get("/heatmaps")
@router.get("/stores/{store_id}/heatmaps")
def get_sm_heatmaps(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_heatmaps_data(db, store_id)


@router.get("/alerts")
@router.get("/stores/{store_id}/alerts")
def get_sm_alerts(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_alerts_data(db, store_id)


@router.get("/reports")
@router.get("/stores/{store_id}/reports")
def get_sm_reports(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_reports_data(db, store_id)


@router.get("/activities")
@router.get("/stores/{store_id}/activities")
def get_sm_activities(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_activities_data(db, store_id)


@router.get("/settings")
@router.get("/stores/{store_id}/settings")
def get_sm_settings(store_id: int = 1, db: Session = Depends(get_db)):
    return get_store_manager_settings_data(db, store_id)
