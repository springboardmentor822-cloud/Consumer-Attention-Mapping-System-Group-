"""Audit Service — logs user actions for the admin audit trail."""
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.models.audit_log import AuditLog


class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log_action(self, user_id: Optional[UUID], action: str, resource: str,
                   resource_id: Optional[str] = None, details: Optional[dict] = None,
                   ip_address: Optional[str] = None):
        """Log an audit event."""
        entry = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
        )
        self.db.add(entry)
        self.db.commit()

    def get_logs(self, limit: int = 100, action: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch audit logs."""
        q = self.db.query(AuditLog)
        if action:
            q = q.filter(AuditLog.action == action)
        logs = q.order_by(AuditLog.created_at.desc()).limit(limit).all()

        return [
            {
                "id": str(log.id),
                "user_id": str(log.user_id) if log.user_id else None,
                "action": log.action,
                "resource": log.resource,
                "resource_id": log.resource_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
