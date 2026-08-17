"""Alert Service — manages shelf, product, traffic, and camera alerts."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.alert import Alert


class AlertService:
    def __init__(self, db: Session):
        self.db = db

    def get_alerts(self, store_id: Optional[UUID] = None, status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch alerts, optionally filtered by store and status."""
        q = self.db.query(Alert)
        if store_id:
            q = q.filter(Alert.store_id == store_id)
        if status:
            q = q.filter(Alert.status == status)
        alerts = q.order_by(Alert.created_at.desc()).limit(limit).all()

        return [self._serialize(a) for a in alerts]

    def get_alert_stats(self, store_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Alert count by severity and status."""
        q = self.db.query(Alert)
        if store_id:
            q = q.filter(Alert.store_id == store_id)

        total = q.count()
        open_count = q.filter(Alert.status == "open").count()
        critical = q.filter(Alert.severity == "critical", Alert.status == "open").count()
        warning = q.filter(Alert.severity == "warning", Alert.status == "open").count()

        return {
            "total": total,
            "open": open_count,
            "critical": critical,
            "warning": warning,
            "resolved": total - open_count,
        }

    def acknowledge_alert(self, alert_id: UUID, user_id: UUID) -> Dict[str, Any]:
        """Mark an alert as acknowledged/resolved."""
        alert = self.db.get(Alert, alert_id)
        if not alert:
            return {"error": "Alert not found"}

        alert.status = "resolved"
        alert.acknowledged_by = user_id
        alert.resolved_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(alert)
        return self._serialize(alert)

    def _serialize(self, a: Alert) -> Dict[str, Any]:
        return {
            "id": str(a.id),
            "store_id": str(a.store_id),
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "acknowledged_by": str(a.acknowledged_by) if a.acknowledged_by else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
