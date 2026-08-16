from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_admin
from app.database import get_db
from app.models.user import User
from app.services.retention_service import purge_expired_tracking_data

router = APIRouter()


@router.get("/policy")
def get_retention_policy(_admin: User = Depends(require_admin)):
    """Admin-only: view the current data retention window."""
    return {
        "tracking_data_retention_days": settings.TRACKING_DATA_RETENTION_DAYS,
        "applies_to": ["tracking_data", "attention_events"],
        "note": (
            "Aggregate records (shopper sessions, product interactions, "
            "computed scores, reports) are not subject to this policy - "
            "only raw positional/gaze data that could reconstruct where "
            "a specific person was and what they looked at."
        ),
    }


@router.post("/purge")
def trigger_retention_purge(
    retention_days: int | None = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """
    Admin-only: manually trigger a retention purge immediately (rather
    than waiting for the daily scheduled run). Pass retention_days to
    override the configured default for this one run.
    """
    days = retention_days if retention_days is not None else settings.TRACKING_DATA_RETENTION_DAYS
    return purge_expired_tracking_data(db, retention_days=days)
