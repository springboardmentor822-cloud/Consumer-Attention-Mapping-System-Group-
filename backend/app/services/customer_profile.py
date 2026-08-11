"""
Read-side helpers for the Customer Details panels.

Everything here resolves names, products, prices and zones from the real
database rows. Nothing is invented: an unresolvable product renders as
"Product <id>" rather than a made-up name, and a customer with no
transactions yields an empty purchase list rather than a plausible one.
"""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.customer import CustomerInteraction, CustomerVisit
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.zone import Zone
from app.schemas.customer import (
    JourneyZone,
    ProductInteractionDetail,
    PurchasedProduct,
    PurchaseItemResponse,
    PurchaseResponse,
)


class ProductCatalogue:
    """One lookup of products/zones reused across a whole response, instead of
    a query per row."""

    def __init__(self, db: Session) -> None:
        self.products: dict[int, Product] = {p.id: p for p in db.query(Product).all()}
        self.zones: dict[int, str] = {z.id: z.zone_name for z in db.query(Zone.id, Zone.zone_name).all()}

    def name(self, product_id: int | None) -> str:
        """Real catalogue name, or an explicit id fallback when the product row
        no longer exists. Never a guessed or placeholder product name."""
        if product_id is None:
            return "Unknown product"
        product = self.products.get(product_id)
        return product.product_name if product else f"Product {product_id}"

    def category(self, product_id: int | None) -> str | None:
        product = self.products.get(product_id) if product_id is not None else None
        return product.category if product else None

    def zone_name(self, zone_id: int | None) -> str | None:
        if zone_id is None:
            return None
        return self.zones.get(zone_id, f"Zone {zone_id}")


def purchases_for_customer(db: Session, customer_id: int, catalogue: ProductCatalogue) -> list[PurchaseResponse]:
    purchases = (
        db.query(Purchase)
        .filter(Purchase.customer_id == customer_id)
        .order_by(Purchase.purchase_time.desc())
        .all()
    )
    return [
        PurchaseResponse(
            id=p.id,
            transaction_number=p.transaction_number,
            store_id=p.store_id,
            purchase_time=p.purchase_time,
            total_amount=p.total_amount,
            items=[
                PurchaseItemResponse(
                    product_id=i.product_id,
                    product_name=catalogue.name(i.product_id),
                    category=catalogue.category(i.product_id),
                    quantity=i.quantity,
                    unit_price=i.unit_price,
                    total_price=i.total_price,
                )
                for i in p.items
            ],
        )
        for p in purchases
    ]


def purchased_products_by_customer(db: Session, catalogue: ProductCatalogue) -> dict[int, list[PurchasedProduct]]:
    """Per-customer purchased product roll-up, one query for the whole table.

    Quantities are summed across every transaction, so a customer who bought
    the same item twice shows a single line with the combined quantity.
    """
    rows = (
        db.query(Purchase.customer_id, PurchaseItem.product_id, PurchaseItem.quantity)
        .join(PurchaseItem, PurchaseItem.purchase_id == Purchase.id)
        .all()
    )
    totals: dict[int, dict[int | None, int]] = {}
    for customer_id, product_id, quantity in rows:
        totals.setdefault(customer_id, {})
        totals[customer_id][product_id] = totals[customer_id].get(product_id, 0) + int(quantity or 0)

    result: dict[int, list[PurchasedProduct]] = {}
    for customer_id, per_product in totals.items():
        result[customer_id] = sorted(
            (
                PurchasedProduct(product_id=pid, name=catalogue.name(pid), quantity=qty)
                for pid, qty in per_product.items()
            ),
            key=lambda p: p.quantity,
            reverse=True,
        )
    return result


def build_journey(db: Session, visit_ids: list[int], catalogue: ProductCatalogue) -> list[JourneyZone]:
    """Zones this visitor passed through, ordered by when they first appeared.

    Per-zone seconds use MAX within a visit before summing across visits:
    every product in a zone carries that zone's dwell, so a plain SUM would
    multiply the real time by the number of products stocked there.
    """
    if not visit_ids:
        return []

    interactions = (
        db.query(CustomerInteraction)
        .filter(CustomerInteraction.customer_visit_id.in_(visit_ids), CustomerInteraction.zone_id.isnot(None))
        .all()
    )
    if not interactions:
        return []

    per_visit_zone: dict[tuple[int, int], float] = {}
    counts: dict[int, int] = {}
    visits_per_zone: dict[int, set[int]] = {}
    first_seen: dict[int, object] = {}

    for row in interactions:
        key = (row.customer_visit_id, row.zone_id)
        per_visit_zone[key] = max(per_visit_zone.get(key, 0.0), row.duration_seconds)
        counts[row.zone_id] = counts.get(row.zone_id, 0) + 1
        visits_per_zone.setdefault(row.zone_id, set()).add(row.customer_visit_id)
        if row.zone_id not in first_seen or row.timestamp < first_seen[row.zone_id]:
            first_seen[row.zone_id] = row.timestamp

    seconds_per_zone: dict[int, float] = {}
    for (_visit_id, zone_id), seconds in per_visit_zone.items():
        seconds_per_zone[zone_id] = seconds_per_zone.get(zone_id, 0.0) + seconds

    ordered_zone_ids = sorted(seconds_per_zone, key=lambda zid: first_seen.get(zid))
    return [
        JourneyZone(
            zone_id=zid,
            zone_name=catalogue.zone_name(zid) or f"Zone {zid}",
            seconds=round(seconds_per_zone[zid], 2),
            visits=len(visits_per_zone.get(zid, set())),
            interactions=counts.get(zid, 0),
        )
        for zid in ordered_zone_ids
    ]


def build_interactions(
    db: Session, visit_ids: list[int], catalogue: ProductCatalogue
) -> list[ProductInteractionDetail]:
    """Products this visitor was near, aggregated across their visits."""
    if not visit_ids:
        return []

    rows = (
        db.query(CustomerInteraction)
        .filter(CustomerInteraction.customer_visit_id.in_(visit_ids), CustomerInteraction.product_id.isnot(None))
        .all()
    )
    agg: dict[tuple[int, int | None], dict] = {}
    for row in rows:
        key = (row.product_id, row.zone_id)
        bucket = agg.setdefault(key, {"count": 0, "seconds": 0.0})
        bucket["count"] += 1
        bucket["seconds"] += row.duration_seconds

    details = [
        ProductInteractionDetail(
            product_id=pid,
            product_name=catalogue.name(pid),
            zone_name=catalogue.zone_name(zid),
            interaction_count=bucket["count"],
            total_seconds=round(bucket["seconds"], 2),
        )
        for (pid, zid), bucket in agg.items()
    ]
    return sorted(details, key=lambda d: d.total_seconds, reverse=True)


def visits_for(db: Session, customer_id: int | None, tracking_id: str | None, store_id: int | None):
    """A visitor's visit sessions, by real customer mapping or anonymous label."""
    query = db.query(CustomerVisit)
    if customer_id is not None:
        query = query.filter(CustomerVisit.customer_id == customer_id)
    elif tracking_id is not None:
        # Anonymous: group by the label. This is per-run, so these sessions are
        # not provably the same person - the API flags is_identified=false and
        # the UI says so.
        query = query.filter(CustomerVisit.tracking_id == tracking_id, CustomerVisit.customer_id.is_(None))
    if store_id is not None:
        query = query.filter(CustomerVisit.store_id == store_id)
    return query.order_by(CustomerVisit.entry_time.desc()).all()


def spend_totals(db: Session, customer_id: int | None) -> tuple[Decimal, int]:
    if customer_id is None:
        return Decimal(0), 0
    purchases = db.query(Purchase).filter(Purchase.customer_id == customer_id).all()
    return sum((p.total_amount for p in purchases), Decimal(0)), len(purchases)
