import uuid
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship, Column, JSON


class Store(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str
    location: Optional[str] = None
    store_metadata: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # NEW: which StoreManager owns this store. Nullable, not because an
    # unowned store is a valid steady state, but because this column is
    # being added to a live DB with no migration tool (no Alembic in
    # this project — confirmed) — a NOT NULL column can't be added to a
    # table with existing rows without a default, and a fabricated
    # default owner would be worse than an honest NULL. Backfill Anime
    # World's owner_id manually right after this migration; see the
    # accompanying ALTER TABLE + backfill instructions.
    #
    # Deliberately scoped to StoreManager only — Analyst/SuperAdmin
    # remain unrestricted on list_stores, matching their existing
    # unrestricted access on every other analytics endpoint in this
    # project. A store with no owner_id set will not appear in any
    # StoreManager's list_stores result until backfilled — this is
    # correct behavior (fail closed), not a bug, but it means an
    # unbackfilled store is invisible to its manager. Don't skip the
    # backfill step.
    owner_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")

    shelves: list["Shelf"] = Relationship(back_populates="store")
    zones: list["Zone"] = Relationship(back_populates="store")


class Shelf(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id")
    shelf_name: str

    # NEW: which physical Zone (entrance/aisle/checkout) this shelf sits
    # in. Needed to answer "which camera(s) can see this shelf" - you
    # look up the shelf's zone_id, then find every Camera with that same
    # zone_id. Required (no default): a shelf with no zone doesn't make
    # sense in this schema.
    zone_id: uuid.UUID = Field(foreign_key="zone.id")

    # REMOVED: zone_coordinates used to live here as a single JSON field.
    # It's gone because one shelf can appear at DIFFERENT pixel positions
    # in different cameras' frames (confirmed: Zone 2's two cameras give
    # two different views of the same shelves, not two non-overlapping
    # halves). A single coordinates field on Shelf couldn't represent
    # "this shelf's box in camera 2's frame" AND "this shelf's box in
    # camera 3's frame" at the same time. That per-camera coordinate data
    # is moving to a new join table (ShelfCameraView) - see the next step.

    store: Optional[Store] = Relationship(back_populates="shelves")
    zone: Optional["Zone"] = Relationship()


from app.models.zone import Zone  # noqa: E402
