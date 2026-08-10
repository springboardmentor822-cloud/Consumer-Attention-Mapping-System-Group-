"""
Customer identity, visits, and product interactions.

The single most important thing about this module is the boundary between
ANONYMOUS VIDEO DATA and REAL CUSTOMER IDENTITY:

  * Video/YOLO/ByteTrack produces an anonymous tracking id only. It carries
    no name, no phone, no identity of any kind, and nothing in this codebase
    ever attempts to derive one from an image.
  * Customer (name/phone/email) rows come exclusively from a legitimate
    source a human entered - CRM, POS, loyalty signup. Never from video.
  * The two are joined only through CustomerVisit.customer_id, which is
    NULL unless somebody supplied a real, deliberate mapping.

A second, subtler point drives the schema. tracking_data.customer_id is a
ByteTrack tracker id that restarts at 1 on every processing run - verified
against this database, where track id 1 appears across 8 different days and
9 different cameras, and ids only ever span 1..38. It identifies a track
within one run, NOT a person across runs. So an anonymous track can only
ever become a *visit session*, scoped to one camera and one contiguous time
window; it can never itself be a customer. Anything that would require
recognising the same shopper on two different days (returning-customer
counts, lifetime visit totals) is therefore only computable for visits that
carry a real mapped customer_id.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Customer(Base):
    """A real, known customer. Populated from CRM/POS/loyalty registration -
    never inferred from video. No biometric or image-derived field exists
    here by design."""

    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Human-facing business identifier (loyalty number, POS customer code).
    customer_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Which store registered them. Lets a Store Manager be scoped to their
    # own store's customers by the same rule every other resource uses.
    store_id: Mapped[int | None] = mapped_column(ForeignKey("stores.id", ondelete="SET NULL"), index=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    visits = relationship("CustomerVisit", back_populates="customer")
    purchases = relationship("Purchase", back_populates="customer")


class CustomerVisit(Base):
    """One anonymous visit session, derived from real tracking data.

    Grain: (camera_id, tracking_id, entry_time) - the same natural key
    DwellMetric already uses, so the two line up without a second
    segmentation scheme. `tracking_id` is the display label ("customer_001")
    for the anonymous track; it is NOT unique across runs and must never be
    treated as an identity.

    customer_id is NULL for the overwhelming majority of visits and that is
    the correct, expected state: it is only set when a legitimate mapping to
    a real customer record exists. A NULL here renders as "Unknown Customer /
    Not Available", never as a guessed identity.
    """

    __tablename__ = "customer_visits"
    __table_args__ = (
        UniqueConstraint("camera_id", "tracking_id", "entry_time", name="uq_customer_visit_session"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # The anonymous label shown in the UI, e.g. "customer_001".
    tracking_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    # The raw ByteTrack integer this visit was built from, kept so a visit can
    # be traced back to its tracking_data/dwell_metrics rows.
    track_number: Mapped[int] = mapped_column(Integer, nullable=False)
    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"), index=True, nullable=True
    )
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    camera_id: Mapped[int] = mapped_column(ForeignKey("cameras.id", ondelete="CASCADE"), index=True, nullable=False)
    entry_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    exit_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_dwell_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_zones_visited: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="visits")
    camera = relationship("Camera")
    interactions = relationship("CustomerInteraction", back_populates="visit", cascade="all, delete-orphan")


class CustomerInteraction(Base):
    """A product a visitor was near, with how long they lingered there.

    This is a PROXIMITY PROXY, not observed handling of a product. This
    system has person detection and positional tracking only - there is no
    pick/touch detection model and no shelf weight sensor, so the honest
    meaning of a row here is "this visit dwelled in the zone whose shelves
    stock this product, for this long". interaction_type records exactly
    which derivation produced it so the API can label it truthfully rather
    than implying the shopper picked the item up.
    """

    __tablename__ = "customer_interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_visit_id: Mapped[int] = mapped_column(
        ForeignKey("customer_visits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), index=True, nullable=True
    )
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), index=True, nullable=True)
    # "zone_proximity" is currently the only real derivation available.
    interaction_type: Mapped[str] = mapped_column(String(32), default="zone_proximity", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    visit = relationship("CustomerVisit", back_populates="interactions")
    product = relationship("Product")
    zone = relationship("Zone")
