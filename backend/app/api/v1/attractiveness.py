from fastapi import APIRouter, Depends
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/attractiveness", tags=["attractiveness"])

@router.get("/scores")
def get_product_attractiveness_scores(current_user: User = Depends(get_current_user)):
    return BehaviorService.get_product_attractiveness_scores()

@router.get("/visibility")
def get_shelf_visibility(current_user: User = Depends(get_current_user)):
    return {
        "eye_level_visibility_avg": "88.4%",
        "top_shelf_visibility_avg": "64.2%",
        "bottom_shelf_visibility_avg": "32.1%",
        "recommendation": "Elevate bottom shelf items with high repeat demand to mid-tier."
    }

@router.get("/conversion")
def get_conversion_analytics(current_user: User = Depends(get_current_user)):
    return {
        "overall_pickup_to_buy_ratio": "74.5%",
        "abandoned_pickups_count": 86,
        "most_converted_sku": "SKU-1002 (Cold Brew Mocha)",
        "most_returned_sku": "SKU-1007 (Zero-Sugar Diet Soda)"
    }
