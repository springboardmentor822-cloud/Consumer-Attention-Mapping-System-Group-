from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/behavior", tags=["behavior"])

@router.get("/segmentation")
def get_consumer_segmentation(current_user: User = Depends(get_current_user)):
    return BehaviorService.get_consumer_segments()

@router.get("/patterns")
def get_shopping_patterns(current_user: User = Depends(get_current_user)):
    return {
        "peak_attention_hours": "14:00 - 18:00",
        "avg_dwell_per_zone": {"Entrance": "25s", "Beverage Aisle": "110s", "Snacks": "75s", "Checkout": "85s"},
        "path_flow": [
            {"from": "Entrance Turnstile", "to": "Promotional Bay", "percentage": 65},
            {"from": "Promotional Bay", "to": "Beverage Aisle", "percentage": 48},
            {"from": "Beverage Aisle", "to": "Checkout Lanes", "percentage": 82}
        ]
    }

@router.get("/journey")
def get_journey_analytics(current_user: User = Depends(get_current_user)):
    return {
        "total_sessions": 505,
        "completion_rate": "84.2%",
        "abandonment_rate": "15.8%",
        "step_dropoffs": [
            {"step": "Entry & Scan", "visitors": 505, "dropoff": 0},
            {"step": "Shelf Engagement", "visitors": 460, "dropoff": 45},
            {"step": "Product Pickup", "visitors": 340, "dropoff": 120},
            {"step": "Checkout Payment", "visitors": 300, "dropoff": 40}
        ]
    }
