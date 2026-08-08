from fastapi import APIRouter, Depends
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/heatmaps", tags=["heatmaps"])

@router.get("/store/{store_id}")
def get_store_heatmap(store_id: int, current_user: User = Depends(get_current_user)):
    return BehaviorService.get_store_heatmap(store_id)

@router.get("/shelf/{shelf_id}")
def get_shelf_heatmap(shelf_id: int, current_user: User = Depends(get_current_user)):
    return {
        "shelf_id": shelf_id,
        "gaze_hotspots": [
            {"product": "Organic Energy Can", "shelf_level": "Eye Level", "gaze_percentage": 42.5},
            {"product": "Cold Brew Mocha", "shelf_level": "Eye Level", "gaze_percentage": 35.0},
            {"product": "Sparkling Water", "shelf_level": "Bottom", "gaze_percentage": 14.2},
            {"product": "Diet Soda", "shelf_level": "Bottom", "gaze_percentage": 8.3}
        ]
    }

@router.get("/traffic/{store_id}")
def get_traffic_heatmaps(store_id: int, current_user: User = Depends(get_current_user)):
    return {
        "store_id": store_id,
        "hourly_foot_traffic": [
            {"hour": "09:00", "footfall": 42},
            {"hour": "11:00", "footfall": 85},
            {"hour": "13:00", "footfall": 120},
            {"hour": "15:00", "footfall": 165},
            {"hour": "17:00", "footfall": 210},
            {"hour": "19:00", "footfall": 140}
        ]
    }
