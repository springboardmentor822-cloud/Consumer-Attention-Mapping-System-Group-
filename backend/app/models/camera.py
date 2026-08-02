"""
Camera model.

What this represents: one physical/simulated camera feed, assigned to a
Zone within a Store. This is the DB-level "camera integration" piece that
Milestone 1's evaluation criteria lists ("Camera integration operational")
but that nothing in the existing codebase implements - there's no camera.py,
no camera router, nothing (confirmed by grepping the repo earlier in this
conversation).

Per the Milestone 2 kickoff doc's example layout:
    Camera 1 -> Zone 1 (Entrance/Exit Foyer)
    Camera 2 -> Zone 2 (Main Product Aisle)
    Camera 3 -> Zone 2 (Main Product Aisle)   <- two cameras, one zone
    Camera 4 -> Zone 3 (Checkout Lanes)

Note that Zone 2 has TWO cameras. That's why Camera has its own zone_id
foreign key (many Cameras -> one Zone), rather than putting camera info
directly on Zone (which would only allow one camera per zone).

This model does NOT contain video-reading logic. It's just the registry:
"this camera_id, in this zone, in this store, reads from this file/path".
The actual frame-reading still happens in frame_pipeline.py / video_stream.py
- this table is what tells that code WHICH source to open for a given
camera, and lets your API answer "what cameras exist / which zone are they
in" without touching OpenCV at all.
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.store import Store
    from app.models.zone import Zone


class Camera(SQLModel, table=True):
    # Same uuid4 primary-key pattern as Store, Shelf, and Zone - stay
    # consistent with the rest of the codebase rather than introducing
    # a different ID scheme just for this table.
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Multi-tenant FK, same reasoning as Zone.store_id: required, no
    # default, because a Camera with no store is meaningless. Kept even
    # though only one store's data is populated right now, per the
    # Milestone 2 doc's explicit multi-tenant requirement.
    store_id: uuid.UUID = Field(foreign_key="store.id")

    # Which Zone this camera monitors. This is the FK that answers
    # "camera integration" from Milestone 1's criteria - it's what lets
    # you query "give me every camera watching the Checkout zone" instead
    # of that mapping living only in someone's head or in a doc.
    zone_id: uuid.UUID = Field(foreign_key="zone.id")

    # Human-readable label for dashboards/admin UI, e.g. "Camera 1",
    # "Entrance Cam", whatever's meaningful when someone's looking at a
    # list of cameras and needs to tell them apart.
    name: str

    # Where frame_pipeline.py / video_stream.py should actually read from.
    # For your current setup this will be a literal file path, e.g.
    # "data/Zone_1.mp4" - matching get_zone_source()'s ZONE_VIDEOS dict
    # in frame_pipeline.py. Later, if this becomes a real/RTSP camera
    # instead of a simulated video file, this same field holds that URL
    # instead - VideoStream.__init__ already accepts "a file path, RTSP
    # URL, or webcam index" per its own docstring, so no schema change
    # needed when that day comes.
    source_path: str

    # Whether this camera is currently active / should be polled.
    # Useful later for the "Camera health alerts" feature listed in the
    # project spec's Notification & Alert System section, and for
    # letting an admin disable a camera without deleting its row
    # (and losing its history/foreign-key references).
    is_active: bool = True

    store: Optional["Store"] = Relationship()
    zone: Optional["Zone"] = Relationship()
