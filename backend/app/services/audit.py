import uuid
from typing import Optional

from sqlmodel import Session

from app.models.event_log import EventCategory, EventLog


def log_event(
    session: Session,
    category: EventCategory,
    event_type: str,
    description: str,
    actor_user_id: Optional[uuid.UUID] = None,
    target_type: Optional[str] = None,
    target_id: Optional[uuid.UUID] = None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
    commit: bool = True,
) -> EventLog:
    entry = EventLog(
        category=category,
        event_type=event_type,
        description=description,
        actor_user_id=actor_user_id,
        target_type=target_type,
        target_id=target_id,
        event_metadata=metadata,
        ip_address=ip_address,
    )

    session.add(entry)

    if commit:
        session.commit()
        session.refresh(entry)

    return entry
