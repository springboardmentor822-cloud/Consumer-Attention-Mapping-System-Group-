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
from app.models.recommendation import Recommendation  # noqa: F401
from app.models.password_reset import PasswordResetToken  # noqa: F401
from app.models.shopper_segment import ShopperSegment  # noqa: F401
from app.models.event_log import EventCategory, EventLog  # noqa: F401
from app.models.campaign import Campaign, CampaignStatus  # noqa: F401
from app.models.purchase_event import PurchaseEvent  # noqa: F401
from app.models.product_interaction_event import ProductInteractionEvent  # noqa: F401
# PurchaseEvent and ProductInteractionEvent were missing here before - both
# are written to by real code paths (completion_analytics service,
# real_interaction_provider) but had no table because nothing imported them
# before init_db() ran. Same accidental-ordering trap this file already
# warns about for EventLog above.
# EventLog was missing here before - its table only existed because
# app.api.admin_logs happens to import it, and main.py happens to import
# that router before init_db() runs on startup. That's an import-order
# accident, not a guarantee: if admin_logs.py were ever dropped from
# main.py's router list or reordered, EventLog's table would silently
# stop being created and hit the exact "relation does not exist" failure
# this file exists to prevent. Explicit import here removes that
# dependency on accidental ordering.
