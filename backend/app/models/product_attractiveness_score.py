"""
ProductAttractivenessScore - one row per (shelf, camera) scoring run.

mock_metrics is a comma-separated list of which of the 5 components were
sourced from MockMetricProvider at compute time (e.g. "interaction,
pickup,purchase,repeat") — kept on the row itself, not just in the API
response, so a raw DB query can still tell real from mock data after the
fact. This is load-bearing for later swapping providers: once a real
provider replaces a mock one, new rows will have a shorter mock_metrics
list, and old rows stay honestly labeled with what they actually were.
"""

import uuid
from datetime import datetime, UTC

from sqlmodel import SQLModel, Field


class ProductAttractivenessScore(SQLModel, table=True):
    __tablename__ = "product_attractiveness_scores"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id")
    shelf_id: uuid.UUID = Field(foreign_key="shelf.id")
    camera_id: uuid.UUID = Field(foreign_key="camera.id")
    computed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    final_score: float
    attention_score: float
    interaction_score: float
    pickup_score: float
    purchase_score: float
    repeat_score: float

    mock_metrics: str  # comma-separated metric names, "" if none were mocked
