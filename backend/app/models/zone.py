"""
Zone model.

What this represents: a physical area of a store that one or more cameras
monitor - Entrance/Exit Foyer, Main Product Aisle, Checkout Lanes (per the
Milestone 2 kickoff doc's 3-zone layout).

This is a DIFFERENT concept from Shelf.zone_coordinates in store.py.
    - Shelf.zone_coordinates = a pixel/polygon boundary of ONE shelf
      within a camera frame (spatial, per-image).
    - Zone (this file)        = a named physical section of the store
      (entrance / aisle / checkout), the thing a Camera is assigned to.
Do not confuse the two when wiring up Camera later - Camera.zone_id points
here, not at a shelf's coordinates.

Multi-tenant note: every row carries store_id, per the Milestone 2 doc's
explicit instruction ("must be multi-tenant... do not hardcode a single
store"). Even though we're only populating ONE store's worth of data right
now (per your mentor's direction), the schema itself stays store_id-scoped
so nothing needs to be rebuilt later if a second store is ever added.
"""

import enum
import uuid
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    # avoids a circular import at runtime; only needed for type hints
    from app.models.store import Store


class ZoneType(str, enum.Enum):
    """
    Fixed set of zone types, matching the 3 zones in the Milestone 2 spec.

    Why an enum instead of a plain string field:
    A plain `zone_type: str` would let anyone insert "Entrance", "entrance ",
    "ENTRANCE", or a typo like "entrence" - all different strings to the
    database, even though they mean the same thing. That breaks any code
    that later filters/groups by zone_type (e.g. "get all checkout zones").
    An enum makes the three valid values the ONLY values SQLModel/Pydantic
    will accept - invalid input is rejected at the API boundary instead of
    silently corrupting your data. Since the spec defines exactly 3 zones
    and that's unlikely to change mid-project, the enum's rigidity is a
    feature here, not a limitation.
    """
    ENTRANCE = "entrance"
    AISLE = "aisle"
    CHECKOUT = "checkout"


class Zone(SQLModel, table=True):
    # Primary key. uuid4 (random) rather than an auto-incrementing int -
    # matches the pattern already used by Store and Shelf in store.py,
    # so stay consistent with that rather than introducing a second
    # ID style in the same codebase.
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Foreign key into Store. This is the multi-tenant hook: every Zone
    # belongs to exactly one Store. Required (no default), because a
    # Zone with no store would be meaningless.
    store_id: uuid.UUID = Field(foreign_key="store.id")

    # Human-readable label, e.g. "Entrance/Exit Foyer", "Main Product Aisle",
    # "Checkout Lanes" - what you'd show in a dashboard or admin UI.
    # Kept separate from zone_type: name is display text you might edit
    # freely (rename "Checkout Lanes" to "Checkout Area" without touching
    # any logic); zone_type is the fixed category your CODE branches on.
    name: str

    # The fixed category (see ZoneType above). This is what detection/
    # tracking/analytics logic should check against - e.g.
    # `if zone.zone_type == ZoneType.CHECKOUT: run_bottleneck_analysis()`.
    zone_type: ZoneType

    # Back-reference to the parent Store. Optional[...] because SQLModel
    # can't populate this until the row is actually loaded with a join -
    # it's None on a freshly-constructed-but-unsaved object.
    store: Optional["Store"] = Relationship(back_populates="zones")
