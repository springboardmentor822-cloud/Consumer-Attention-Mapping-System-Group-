import uuid
from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON


class EventCategory(str, Enum):
    security = "security"
    audit = "audit"


class EventLog(SQLModel, table=True):
    __tablename__ = "event_log"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    category: EventCategory = Field(index=True)
    event_type: str = Field(index=True)

    actor_user_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="user.id",
        index=True,
    )

    target_type: Optional[str] = Field(default=None)
    target_id: Optional[uuid.UUID] = Field(default=None, index=True)

    description: str
    event_metadata: Optional[dict] = Field(
        default=None,
        sa_column=Column(JSON),
    )
    ip_address: Optional[str] = Field(default=None)

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        index=True,
    )
