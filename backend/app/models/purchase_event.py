import uuid
from datetime import datetime, UTC
from typing import Optional

from sqlmodel import SQLModel, Field


class PurchaseEvent(SQLModel, table=True):
    """POS/transaction-side purchase fact.

    Purchases are deliberately sourced from a transaction system rather than
    guessed from camera disappearance.  This table is the local adapter for
    that source; a POS/ERP connector can populate it later without changing
    the analytics API.
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id", index=True)
    sku: str = Field(index=True)
    # FIXED (real gap, found during a security/integration audit):
    # transaction_id was indexed but not UNIQUE. Real POS/payment
    # webhooks retry on timeout as a matter of course (Stripe, Square,
    # and most payment processors all do this deliberately, since a
    # dropped response doesn't mean the request wasn't received) - an
    # honest POS integration has to expect the same transaction_id to
    # arrive more than once and must not double-count it. Without this,
    # a single retried webhook call would have silently inflated
    # purchase counts and revenue figures.
    transaction_id: str = Field(index=True, unique=True)
    quantity: int = Field(default=1)
    amount: float = Field(default=0.0)
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)
    shopper_track_id: Optional[int] = Field(default=None, index=True)
    camera_id: Optional[uuid.UUID] = Field(default=None, index=True)
