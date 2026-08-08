from fastapi import APIRouter, Depends
from ...services.behavior_service import BehaviorService
from ..deps import get_current_user
from ...schemas.user import User

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("")
def get_alerts(current_user: User = Depends(get_current_user)):
    return BehaviorService.get_active_alerts()

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, current_user: User = Depends(get_current_user)):
    return {"alert_id": alert_id, "status": "acknowledged"}
