import uuid
from datetime import date, datetime, UTC
from enum import Enum

from sqlmodel import Field, SQLModel


class CampaignStatus(str, Enum):
    upcoming = "upcoming"
    active = "active"
    completed = "completed"


class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id")
    shelf_id: uuid.UUID = Field(foreign_key="shelf.id")

    name: str
    start_date: date
    end_date: date

    status: CampaignStatus = Field(default=CampaignStatus.upcoming)

    created_by: uuid.UUID | None = Field(
        default=None,
        foreign_key="user.id",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )