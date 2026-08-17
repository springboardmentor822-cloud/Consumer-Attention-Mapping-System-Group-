from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user, require_roles
from backend.app.models.user import User
from backend.app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])


@router.get("")
def list_alerts(
    store_id: Optional[UUID] = None,
    alert_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Store Manager")),
):
    """List alerts, optionally filtered by store and status."""
    service = AlertService(db)
    return {
        "alerts": service.get_alerts(store_id=store_id, status=alert_status),
        "stats": service.get_alert_stats(store_id=store_id),
    }


@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Administrator", "Store Manager")),
):
    """Acknowledge/resolve an alert."""
    service = AlertService(db)
    result = service.acknowledge_alert(alert_id, current_user.id)
    if "error" in result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result["error"])
    return result
