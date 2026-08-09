from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def record_audit_event(
    db: Session,
    action: str,
    message: str,
    actor: User | None = None,
    resource: str | None = None,
    resource_id: int | None = None,
    severity: str = "info",
) -> None:
    """Writes one audit log row immediately (own commit - independent of
    whatever transaction the caller is in, so a logging failure never
    blocks the actual operation and a rollback elsewhere doesn't erase
    the record of what was attempted)."""
    entry = AuditLog(
        actor_email=actor.email if actor else None,
        actor_role=actor.role if actor else None,
        action=action,
        resource=resource,
        resource_id=resource_id,
        severity=severity,
        message=message,
    )
    db.add(entry)
    db.commit()
