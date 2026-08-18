import uuid
from datetime import datetime, UTC

from sqlmodel import SQLModel, Field


class ProductInteractionEvent(SQLModel, table=True):
    """Persisted person-product contact event derived from tracked boxes.

    This is not a hand/keypoint model.  The event is explicitly marked with
    confidence and method so downstream dashboards cannot mistake a spatial
    contact heuristic for a trained pickup detector.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id", index=True)
    camera_id: uuid.UUID = Field(foreign_key="camera.id", index=True)
    person_track_id: int = Field(index=True)
    product_track_id: str = Field(index=True)
    product_name: str = Field(index=True)
    event_type: str = Field(index=True)  # contact / pickup_candidate / return_candidate / comparison
    event_time: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)
    confidence: float = Field(default=0.0)
    method: str = Field(default="bbox_proximity")
