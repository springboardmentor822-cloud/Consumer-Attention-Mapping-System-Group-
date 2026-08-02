"""
ShelfCameraView - join table between Shelf and Camera.

Why this exists: confirmed earlier that Zone 2's two cameras (2 & 3) give
two DIFFERENT views of the SAME shelves, not two cameras each covering a
separate half of the aisle. That means "where is this shelf, in pixels"
is not a single fact about a shelf - it's a different fact PER CAMERA that
sees it. A shelf near the edge of camera 2's frame might be dead-center in
camera 3's frame, at completely different pixel coordinates.

This table holds exactly that: one row per (shelf, camera) pair, with the
pixel/polygon coordinates of THAT shelf as seen by THAT camera.

    Shelf 1 seen by Camera 2 -> one row, one set of coordinates
    Shelf 1 seen by Camera 3 -> a DIFFERENT row, different coordinates
    Shelf 2 seen by Camera 2 -> another row
    Shelf 2 seen by Camera 3 -> another row

If a shelf is only ever seen by one camera (e.g. a shelf in a zone with
just one camera), it simply has one row here instead of two - the table
doesn't force multiple rows, it just allows as many as there are cameras
actually seeing that shelf.

This replaces Shelf.zone_coordinates, which was removed from store.py
in the previous step because it could only hold one set of coordinates
per shelf, not one per camera.
"""

import uuid
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship, Column, JSON

if TYPE_CHECKING:
    from app.models.store import Shelf
    from app.models.camera import Camera


class ShelfCameraView(SQLModel, table=True):
    # Same uuid4 primary-key pattern as every other table in this schema.
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    # Which shelf this row describes.
    shelf_id: uuid.UUID = Field(foreign_key="shelf.id")

    # Which camera's view this row describes. Together, shelf_id +
    # camera_id identify one specific "this shelf, as seen by this
    # camera" fact - that pair is conceptually what should be unique
    # (a shelf shouldn't have two different coordinate sets for the
    # exact same camera). SQLModel doesn't enforce composite-unique
    # constraints directly in the Field() call, so if you want the DB
    # to reject accidental duplicates, that needs a
    # UniqueConstraint("shelf_id", "camera_id") added via
    # __table_args__ - flagging this rather than silently adding it,
    # since it changes how insert errors behave and you may want to
    # decide that deliberately rather than have it just appear.
    camera_id: uuid.UUID = Field(foreign_key="camera.id")

    # The actual pixel/polygon boundary of this shelf, AS SEEN BY this
    # specific camera. Same JSON shape as the old Shelf.zone_coordinates
    # field: e.g. [[x1,y1],[x2,y2]] or a fuller polygon if you need more
    # than a rectangle.
    zone_coordinates: Optional[list] = Field(default=None, sa_column=Column(JSON))

    shelf: Optional["Shelf"] = Relationship()
    camera: Optional["Camera"] = Relationship()
