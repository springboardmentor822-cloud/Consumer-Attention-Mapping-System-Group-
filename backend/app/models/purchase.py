"""
Purchase transactions.

These come from a point-of-sale/transaction source and are always tied to a
real Customer - never to an anonymous video track. Nothing in the video
pipeline creates, infers, or amends a purchase: CCTV cannot observe a
payment, so any "purchase" derived from it would be fabricated. Revenue and
spend figures therefore stay genuinely empty until real transaction data is
loaded, which is the correct answer rather than a plausible-looking one.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id", ondelete="CASCADE"), index=True, nullable=False)
    # POS receipt/transaction reference - unique so re-importing the same
    # till export can't silently double-count revenue.
    transaction_number: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    purchase_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    # Stored rather than always summed from items so an imported receipt
    # total stays authoritative even if a line item is missing.
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    purchase_id: Mapped[int] = mapped_column(
        ForeignKey("purchases.id", ondelete="CASCADE"), index=True, nullable=False
    )
    product_id: Mapped[int | None] = mapped_column(
        ForeignKey("products.id", ondelete="SET NULL"), index=True, nullable=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    # Captured at sale time: the product's current catalogue price can change
    # later, and a receipt must not retroactively change with it.
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product")
