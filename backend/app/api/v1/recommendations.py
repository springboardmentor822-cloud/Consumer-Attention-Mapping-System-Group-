from fastapi import APIRouter, Depends
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/shelf-optimization")
def get_shelf_optimization_recommendations(current_user: User = Depends(get_current_user)):
    return BehaviorService.get_recommendations()

@router.get("/promotions")
def get_promotional_recommendations(current_user: User = Depends(get_current_user)):
    return [r for r in BehaviorService.get_recommendations() if r["type"] == "Promotional Placement"]
