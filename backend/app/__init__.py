# Every model file gets imported here so that init_db()'s
# SQLModel.metadata.create_all(engine) call in app/core/db.py actually
# creates ALL tables at startup - not just whichever models happen to get
# pulled in as a side effect of which routers main.py imports.
#
# Without this, a model like ShelfCameraView (which no router currently
# imports directly) would silently have no table created, and you'd only
# find out when something tries to query/insert into it and gets a
# "relation does not exist" error at runtime - a much harder bug to
# trace than a missing import here.
#
# noqa: F401 on each line because these imports are for their SIDE EFFECT
# (registering the table with SQLModel.metadata), not because anything in
# this file actually uses the names directly.

from app.models.user import Role, User  # noqa: F401
from app.models.store import Store, Shelf  # noqa: F401
from app.models.zone import Zone  # noqa: F401
from app.models.camera import Camera  # noqa: F401
from app.models.shelf_camera_view import ShelfCameraView  # noqa: F401
from app.models.product_attractiveness_score import ProductAttractivenessScore  # noqa: F401
