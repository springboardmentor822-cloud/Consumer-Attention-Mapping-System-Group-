"""
Customer records, visits, journeys, interactions and purchases.

Access follows the existing rules exactly (app/api/deps.py) - no new auth
behaviour: dashboard_access to read, write_access to create/modify, and
resolve_store_scope to pin a Store Manager to their own store. A Retail
Analyst therefore reads everything here and can write nothing, which is the
read-only analytics access the feature calls for, enforced by the same
dependency every other router already uses.

Identity rule enforced throughout: a name or phone is rendered only from a
real Customer row. Anything derived from video shows its anonymous label
plus "Anonymous Visitor"/"Not Available". Nothing here infers identity.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_store_scope, write_access
from app.db.session import get_db
from app.models.camera import Camera
from app.models.customer import Customer, CustomerInteraction, CustomerVisit
from app.models.product import Product
from app.models.purchase import Purchase, PurchaseItem
from app.models.user import User
from app.models.zone import Zone
from app.schemas.common import Message
from app.schemas.customer import (
    ANONYMOUS_VISITOR_NAME,
    UNKNOWN_CUSTOMER_PHONE,
    CustomerCreate,
    CustomerDetail,
    CustomerListItem,
    CustomerListResponse,
    CustomerProfile,
    CustomerResponse,
    CustomerUpdate,
    InteractionItem,
    PurchaseCreate,
    PurchaseItemResponse,
    PurchaseResponse,
    StoreCustomerSummary,
    TrackingInfo,
    VisitDetail,
    VisitMappingRequest,
    VisitSummary,
    VisitZone,
)
from app.services.crud import CRUDService
from app.services.customer_profile import (
    ProductCatalogue,
    build_interactions,
    build_journey,
    purchased_products_by_customer,
    purchases_for_customer,
    spend_totals,
    visits_for,
)

router = APIRouter(prefix="/customers", tags=["Customer Analytics"])
service = CRUDService[Customer, CustomerCreate, CustomerUpdate](Customer, "Customer")


def _visit_summary(visit: CustomerVisit, interaction_count: int, camera_name: str | None) -> VisitSummary:
    """Resolves display identity for one visit. A mapped visit shows the real
    record's name/phone; an unmapped one shows the explicit placeholders."""
    customer = visit.customer
    return VisitSummary(
        id=visit.id,
        tracking_id=visit.tracking_id,
        customer_id=visit.customer_id,
        customer_name=customer.full_name if customer else ANONYMOUS_VISITOR_NAME,
        phone=(customer.phone or UNKNOWN_CUSTOMER_PHONE) if customer else UNKNOWN_CUSTOMER_PHONE,
        store_id=visit.store_id,
        camera_id=visit.camera_id,
        camera_name=camera_name,
        entry_time=visit.entry_time,
        exit_time=visit.exit_time,
        total_dwell_seconds=round(visit.total_dwell_seconds, 2),
        total_zones_visited=visit.total_zones_visited,
        interaction_count=interaction_count,
    )


def _interaction_counts(db: Session, visit_ids: list[int]) -> dict[int, int]:
    if not visit_ids:
        return {}
    rows = (
        db.query(CustomerInteraction.customer_visit_id, func.count(CustomerInteraction.id))
        .filter(CustomerInteraction.customer_visit_id.in_(visit_ids))
        .group_by(CustomerInteraction.customer_visit_id)
        .all()
    )
    return {vid: count for vid, count in rows}


def _camera_names(db: Session) -> dict[int, str]:
    return {c.id: c.camera_name for c in db.query(Camera.id, Camera.camera_name).all()}


# ---------------------------------------------------------------- customers


@router.get("", response_model=list[CustomerResponse])
def list_customers(
    search: str | None = Query(default=None, description="Match on name, phone, or customer code"),
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(Customer)
    if effective_store_id is not None:
        query = query.filter(Customer.store_id == effective_store_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            Customer.full_name.ilike(pattern)
            | Customer.phone.ilike(pattern)
            | Customer.customer_code.ilike(pattern)
        )
    return query.order_by(Customer.full_name.asc()).all()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)
):
    return service.create(db, payload, actor=current_user)


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_user: User = Depends(write_access),
    db: Session = Depends(get_db),
):
    return service.update(db, customer_id, payload, actor=current_user)


@router.delete("/{customer_id}", response_model=Message)
def delete_customer(
    customer_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)
):
    return service.delete(db, customer_id, actor=current_user)


# ------------------------------------------------- combined customer listing


@router.get("/overview", response_model=CustomerListResponse)
def customer_overview(
    store_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    zone_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """The Store Manager customer table.

    Rows are grouped by real customer where a mapping exists, and otherwise
    by anonymous tracking label. An anonymous row's "total visits" counts
    sessions carrying that same label - which, because ByteTrack ids restart
    every run, is NOT a count of one person's visits. `is_identified: false`
    marks exactly those rows so the UI can present them honestly.
    """
    effective_store_id = resolve_store_scope(current_user, store_id)

    visits_q = db.query(CustomerVisit)
    if effective_store_id is not None:
        visits_q = visits_q.filter(CustomerVisit.store_id == effective_store_id)
    if date_from is not None:
        visits_q = visits_q.filter(CustomerVisit.entry_time >= date_from)
    if date_to is not None:
        visits_q = visits_q.filter(CustomerVisit.entry_time <= date_to)
    if zone_id is not None:
        visit_ids_in_zone = db.query(CustomerInteraction.customer_visit_id).filter(
            CustomerInteraction.zone_id == zone_id
        )
        visits_q = visits_q.filter(CustomerVisit.id.in_(visit_ids_in_zone))

    visits = visits_q.all()
    counts = _interaction_counts(db, [v.id for v in visits])

    # Spend per real customer, from real transactions only.
    spend_by_customer: dict[int, tuple[Decimal, int]] = {}
    purchase_rows = (
        db.query(
            Purchase.customer_id,
            func.coalesce(func.sum(Purchase.total_amount), 0),
            func.count(Purchase.id),
        )
        .group_by(Purchase.customer_id)
        .all()
    )
    for cust_id, total, count in purchase_rows:
        spend_by_customer[cust_id] = (Decimal(total), int(count))

    items_by_customer: dict[int, int] = {}
    item_rows = (
        db.query(Purchase.customer_id, func.coalesce(func.sum(PurchaseItem.quantity), 0))
        .join(PurchaseItem, PurchaseItem.purchase_id == Purchase.id)
        .group_by(Purchase.customer_id)
        .all()
    )
    for cust_id, qty in item_rows:
        items_by_customer[cust_id] = int(qty)

    grouped: dict[tuple[str, str], dict] = {}
    for visit in visits:
        if visit.customer_id is not None:
            key = ("customer", str(visit.customer_id))
        else:
            key = ("anon", visit.tracking_id)
        bucket = grouped.setdefault(
            key,
            {
                "customer_id": visit.customer_id,
                "tracking_id": None if visit.customer_id else visit.tracking_id,
                "visits": 0,
                "dwell": 0.0,
                "interactions": 0,
                "last_visit": None,
            },
        )
        bucket["visits"] += 1
        bucket["dwell"] += visit.total_dwell_seconds
        bucket["interactions"] += counts.get(visit.id, 0)
        if bucket["last_visit"] is None or visit.exit_time > bucket["last_visit"]:
            bucket["last_visit"] = visit.exit_time

    customers_by_id = {c.id: c for c in db.query(Customer).all()}
    catalogue = ProductCatalogue(db)
    # Real purchased product names per customer, resolved through
    # purchase_items -> products. Never hardcoded, and absent (empty list)
    # rather than invented when a customer has no transactions.
    products_by_customer = purchased_products_by_customer(db, catalogue)

    # Registered customers who have no tracked visit yet still belong in the
    # list - they exist in the CRM whether or not a camera has ever seen them,
    # and omitting them would make the customer list silently disagree with
    # the customer record count. They appear with zero visits/dwell, which is
    # the truthful reading, and are skipped entirely when the caller filtered
    # by zone or date (those filters are about visits, so a customer with no
    # visits genuinely doesn't match).
    if zone_id is None and date_from is None and date_to is None:
        already_listed = {b["customer_id"] for b in grouped.values() if b["customer_id"] is not None}
        for customer in customers_by_id.values():
            if customer.id in already_listed:
                continue
            if effective_store_id is not None and customer.store_id not in (None, effective_store_id):
                continue
            grouped[("customer", str(customer.id))] = {
                "customer_id": customer.id,
                "tracking_id": None,
                "visits": 0,
                "dwell": 0.0,
                "interactions": 0,
                "last_visit": None,
            }

    items: list[CustomerListItem] = []
    for (kind, _), bucket in grouped.items():
        customer = customers_by_id.get(bucket["customer_id"]) if bucket["customer_id"] else None
        display_name = customer.full_name if customer else ANONYMOUS_VISITOR_NAME
        phone = (customer.phone or UNKNOWN_CUSTOMER_PHONE) if customer else UNKNOWN_CUSTOMER_PHONE
        spend, _pcount = spend_by_customer.get(bucket["customer_id"], (Decimal(0), 0)) if customer else (Decimal(0), 0)
        purchased = products_by_customer.get(bucket["customer_id"], []) if customer else []

        if search:
            # Product names are searchable too, so "search by product" finds
            # every customer who actually bought it.
            needle = search.strip().lower()
            product_text = " ".join(p.name for p in purchased)
            haystack = (
                f"{display_name} {phone} {bucket['tracking_id'] or ''} "
                f"{customer.customer_code if customer else ''} {product_text}"
            ).lower()
            if needle not in haystack:
                continue

        items.append(
            CustomerListItem(
                customer_id=bucket["customer_id"],
                tracking_id=bucket["tracking_id"],
                display_name=display_name,
                customer_code=customer.customer_code if customer else None,
                phone=phone,
                is_identified=kind == "customer",
                last_visit=bucket["last_visit"],
                total_visits=bucket["visits"],
                total_dwell_seconds=round(bucket["dwell"], 2),
                interaction_count=bucket["interactions"],
                products=purchased,
                products_purchased=items_by_customer.get(bucket["customer_id"], 0) if customer else 0,
                total_spend=spend,
            )
        )

    items.sort(key=lambda i: (i.last_visit is None, i.last_visit), reverse=True)
    return CustomerListResponse(store_id=effective_store_id, total=len(items), items=items[:limit])


@router.get("/summary", response_model=StoreCustomerSummary)
def store_customer_summary(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """KPI row for the Store Manager customer page. Purchase figures are real
    or zero - never estimated from footfall."""
    effective_store_id = resolve_store_scope(current_user, store_id)

    visits_q = db.query(CustomerVisit)
    if effective_store_id is not None:
        visits_q = visits_q.filter(CustomerVisit.store_id == effective_store_id)
    visits = visits_q.all()

    today = datetime.now(timezone.utc).date()
    todays = {
        (v.customer_id, v.tracking_id) for v in visits if v.entry_time.astimezone(timezone.utc).date() == today
    }

    # Returning is only answerable for mapped customers - an anonymous
    # ByteTrack label cannot prove two sessions were the same person.
    per_customer: dict[int, int] = {}
    for visit in visits:
        if visit.customer_id is not None:
            per_customer[visit.customer_id] = per_customer.get(visit.customer_id, 0) + 1
    returning = sum(1 for c in per_customer.values() if c > 1)

    purchase_q = db.query(Purchase)
    if effective_store_id is not None:
        purchase_q = purchase_q.filter(Purchase.store_id == effective_store_id)
    purchases = purchase_q.all()
    revenue = sum((p.total_amount for p in purchases), Decimal(0))
    total_dwell = sum(v.total_dwell_seconds for v in visits)

    return StoreCustomerSummary(
        store_id=effective_store_id,
        todays_customers=len(todays),
        returning_customers=returning,
        average_dwell_seconds=round(total_dwell / len(visits), 2) if visits else 0.0,
        total_purchases=len(purchases),
        total_revenue=revenue,
        average_purchase_value=(revenue / len(purchases)) if purchases else None,
    )


@router.get("/profile", response_model=CustomerProfile)
def customer_profile(
    customer_id: int | None = Query(default=None),
    tracking_id: str | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Everything the Customer Details modal needs, in one request.

    Serves both a registered customer (`customer_id`) and an anonymous tracked
    visitor (`tracking_id`). Identity fields come only from a real Customer
    row; an anonymous profile carries placeholders and an empty purchase
    history, since a camera cannot observe a payment.
    """
    if customer_id is None and tracking_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Provide either customer_id or tracking_id"
        )

    effective_store_id = resolve_store_scope(current_user, None)
    customer = db.get(Customer, customer_id) if customer_id is not None else None
    if customer_id is not None and customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    if customer and effective_store_id is not None and customer.store_id not in (None, effective_store_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer belongs to another store")

    visits = visits_for(db, customer_id, tracking_id, effective_store_id)
    visit_ids = [v.id for v in visits]
    catalogue = ProductCatalogue(db)
    counts = _interaction_counts(db, visit_ids)
    cameras = _camera_names(db)

    total_dwell = sum(v.total_dwell_seconds for v in visits)
    spend, purchase_count = spend_totals(db, customer_id)
    journey = build_journey(db, visit_ids, catalogue)

    zone_names: list[str] = []
    for zone in journey:
        if zone.zone_name not in zone_names:
            zone_names.append(zone.zone_name)

    tracking = TrackingInfo(
        tracking_ids=sorted({v.tracking_id for v in visits}),
        cameras=sorted({cameras.get(v.camera_id, f"Camera {v.camera_id}") for v in visits}),
        first_detected=min((v.entry_time for v in visits), default=None),
        last_detected=max((v.exit_time for v in visits), default=None),
        zones=zone_names,
        total_tracking_seconds=round(total_dwell, 2),
        visit_count=len(visits),
    )

    return CustomerProfile(
        is_identified=customer is not None,
        display_name=customer.full_name if customer else ANONYMOUS_VISITOR_NAME,
        phone=(customer.phone or UNKNOWN_CUSTOMER_PHONE) if customer else UNKNOWN_CUSTOMER_PHONE,
        email=customer.email if customer else None,
        customer_code=customer.customer_code if customer else None,
        customer_id=customer_id,
        tracking_id=tracking_id,
        total_visits=len(visits),
        first_visit=min((v.entry_time for v in visits), default=None),
        last_visit=max((v.exit_time for v in visits), default=None),
        average_visit_seconds=round(total_dwell / len(visits), 2) if visits else 0.0,
        total_dwell_seconds=round(total_dwell, 2),
        total_spend=spend,
        average_purchase_value=(spend / purchase_count) if purchase_count else None,
        purchase_count=purchase_count,
        journey=journey,
        purchases=purchases_for_customer(db, customer_id, catalogue) if customer_id is not None else [],
        interactions=build_interactions(db, visit_ids, catalogue),
        tracking=tracking,
        recent_visits=[_visit_summary(v, counts.get(v.id, 0), cameras.get(v.camera_id)) for v in visits[:20]],
    )


# ------------------------------------------------------------------- visits


@router.get("/visits", response_model=list[VisitSummary])
def list_visits(
    store_id: int | None = Query(default=None),
    tracking_id: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(CustomerVisit)
    if effective_store_id is not None:
        query = query.filter(CustomerVisit.store_id == effective_store_id)
    if tracking_id:
        query = query.filter(CustomerVisit.tracking_id == tracking_id)
    visits = query.order_by(CustomerVisit.entry_time.desc()).limit(limit).all()

    counts = _interaction_counts(db, [v.id for v in visits])
    cameras = _camera_names(db)
    return [_visit_summary(v, counts.get(v.id, 0), cameras.get(v.camera_id)) for v in visits]


@router.get("/visits/{visit_id}", response_model=VisitDetail)
def visit_detail(
    visit_id: int, current_user: User = Depends(dashboard_access), db: Session = Depends(get_db)
):
    visit = db.get(CustomerVisit, visit_id)
    if visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    effective_store_id = resolve_store_scope(current_user, None)
    if effective_store_id is not None and visit.store_id != effective_store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Visit belongs to another store")

    interactions = (
        db.query(CustomerInteraction).filter(CustomerInteraction.customer_visit_id == visit.id).all()
    )
    zone_names = {z.id: z.zone_name for z in db.query(Zone.id, Zone.zone_name).all()}

    seconds_by_zone: dict[int | None, float] = {}
    first_seen: dict[int | None, datetime] = {}
    for interaction in interactions:
        if interaction.zone_id is None:
            continue
        # Every product in a zone carries that zone's dwell, so take the max
        # rather than summing - otherwise a zone with 5 products would report
        # 5x the real time spent there.
        seconds_by_zone[interaction.zone_id] = max(
            seconds_by_zone.get(interaction.zone_id, 0.0), interaction.duration_seconds
        )
        if interaction.zone_id not in first_seen or interaction.timestamp < first_seen[interaction.zone_id]:
            first_seen[interaction.zone_id] = interaction.timestamp

    zones = [
        VisitZone(zone_id=zid, zone_name=zone_names.get(zid, f"Zone {zid}"), seconds=round(secs, 2))
        for zid, secs in sorted(seconds_by_zone.items(), key=lambda kv: first_seen.get(kv[0], visit.entry_time))
    ]
    journey = [z.zone_name for z in zones]

    cameras = _camera_names(db)
    base = _visit_summary(visit, len(interactions), cameras.get(visit.camera_id))
    return VisitDetail(**base.model_dump(), zones=zones, journey=journey)


@router.patch("/visits/{visit_id}/mapping", response_model=Message)
def map_visit_to_customer(
    visit_id: int,
    payload: VisitMappingRequest,
    current_user: User = Depends(write_access),
    db: Session = Depends(get_db),
):
    """Attach (or clear) a real customer on an anonymous visit.

    The only path by which identity ever reaches video-derived data, and it
    is always an explicit human/CRM decision - never inferred from imagery.
    """
    visit = db.get(CustomerVisit, visit_id)
    if visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    if payload.customer_id is not None and db.get(Customer, payload.customer_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    visit.customer_id = payload.customer_id
    db.commit()
    return {"message": "Visit mapping updated"}


# --------------------------------------------------- one customer's details


@router.get("/{customer_id}", response_model=CustomerDetail)
def customer_detail(
    customer_id: int, current_user: User = Depends(dashboard_access), db: Session = Depends(get_db)
):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    effective_store_id = resolve_store_scope(current_user, None)
    if effective_store_id is not None and customer.store_id not in (None, effective_store_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer belongs to another store")

    visits = (
        db.query(CustomerVisit)
        .filter(CustomerVisit.customer_id == customer_id)
        .order_by(CustomerVisit.entry_time.desc())
        .all()
    )
    counts = _interaction_counts(db, [v.id for v in visits])
    cameras = _camera_names(db)

    total_dwell = sum(v.total_dwell_seconds for v in visits)
    purchases = (
        db.query(Purchase)
        .filter(Purchase.customer_id == customer_id)
        .order_by(Purchase.purchase_time.desc())
        .all()
    )
    total_spend = sum((p.total_amount for p in purchases), Decimal(0))
    product_names = {p.id: p.product_name for p in db.query(Product.id, Product.product_name).all()}
    product_categories = {p.id: p.category for p in db.query(Product.id, Product.category).all()}

    purchase_payload = [
        PurchaseResponse(
            id=p.id,
            transaction_number=p.transaction_number,
            store_id=p.store_id,
            purchase_time=p.purchase_time,
            total_amount=p.total_amount,
            items=[
                PurchaseItemResponse(
                    product_id=i.product_id,
                    product_name=product_names.get(i.product_id) or f"Product {i.product_id}",
                    category=product_categories.get(i.product_id),
                    quantity=i.quantity,
                    unit_price=i.unit_price,
                    total_price=i.total_price,
                )
                for i in p.items
            ],
        )
        for p in purchases
    ]

    return CustomerDetail(
        customer=CustomerResponse.model_validate(customer),
        first_visit=visits[-1].entry_time if visits else None,
        last_visit=visits[0].exit_time if visits else None,
        total_visits=len(visits),
        average_dwell_seconds=round(total_dwell / len(visits), 2) if visits else 0.0,
        total_spend=total_spend,
        average_purchase_value=(total_spend / len(purchases)) if purchases else None,
        purchase_count=len(purchases),
        recent_visits=[_visit_summary(v, counts.get(v.id, 0), cameras.get(v.camera_id)) for v in visits[:20]],
        purchases=purchase_payload,
    )


@router.get("/{customer_id}/visits", response_model=list[VisitSummary])
def customer_visits(
    customer_id: int, current_user: User = Depends(dashboard_access), db: Session = Depends(get_db)
):
    visits = (
        db.query(CustomerVisit)
        .filter(CustomerVisit.customer_id == customer_id)
        .order_by(CustomerVisit.entry_time.desc())
        .all()
    )
    counts = _interaction_counts(db, [v.id for v in visits])
    cameras = _camera_names(db)
    return [_visit_summary(v, counts.get(v.id, 0), cameras.get(v.camera_id)) for v in visits]


@router.get("/{customer_id}/purchases", response_model=list[PurchaseResponse])
def customer_purchases(
    customer_id: int, current_user: User = Depends(dashboard_access), db: Session = Depends(get_db)
):
    purchases = (
        db.query(Purchase)
        .filter(Purchase.customer_id == customer_id)
        .order_by(Purchase.purchase_time.desc())
        .all()
    )
    product_names = {p.id: p.product_name for p in db.query(Product.id, Product.product_name).all()}
    product_categories = {p.id: p.category for p in db.query(Product.id, Product.category).all()}
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
                    product_name=product_names.get(i.product_id) or f"Product {i.product_id}",
                    category=product_categories.get(i.product_id),
                    quantity=i.quantity,
                    unit_price=i.unit_price,
                    total_price=i.total_price,
                )
                for i in p.items
            ],
        )
        for p in purchases
    ]


@router.get("/visits/{visit_id}/interactions", response_model=list[InteractionItem])
def visit_interactions(
    visit_id: int, current_user: User = Depends(dashboard_access), db: Session = Depends(get_db)
):
    interactions = (
        db.query(CustomerInteraction)
        .filter(CustomerInteraction.customer_visit_id == visit_id)
        .order_by(CustomerInteraction.timestamp.asc())
        .all()
    )
    product_names = {p.id: p.product_name for p in db.query(Product.id, Product.product_name).all()}
    product_categories = {p.id: p.category for p in db.query(Product.id, Product.category).all()}
    zone_names = {z.id: z.zone_name for z in db.query(Zone.id, Zone.zone_name).all()}
    return [
        InteractionItem(
            product_id=i.product_id,
            product_name=product_names.get(i.product_id),
            zone_id=i.zone_id,
            zone_name=zone_names.get(i.zone_id),
            interaction_type=i.interaction_type,
            timestamp=i.timestamp,
            duration_seconds=round(i.duration_seconds, 2),
        )
        for i in interactions
    ]


# ---------------------------------------------------------------- purchases


@router.post("/purchases", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    payload: PurchaseCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)
):
    """Record a real transaction (POS/CRM import).

    Deliberately a write endpoint rather than anything the video pipeline can
    call: a purchase must come from a payment system, never from footage.
    """
    if db.get(Customer, payload.customer_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    if db.query(Purchase).filter(Purchase.transaction_number == payload.transaction_number).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transaction {payload.transaction_number} already recorded",
        )

    total = Decimal(0)
    purchase = Purchase(
        customer_id=payload.customer_id,
        store_id=payload.store_id,
        transaction_number=payload.transaction_number,
        purchase_time=payload.purchase_time or datetime.now(timezone.utc),
        total_amount=Decimal(0),
    )
    db.add(purchase)
    db.flush()

    for item in payload.items:
        line_total = item.total_price if item.total_price is not None else item.unit_price * item.quantity
        total += line_total
        db.add(
            PurchaseItem(
                purchase_id=purchase.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total_price=line_total,
            )
        )

    purchase.total_amount = total
    db.commit()
    db.refresh(purchase)

    product_names = {p.id: p.product_name for p in db.query(Product.id, Product.product_name).all()}
    product_categories = {p.id: p.category for p in db.query(Product.id, Product.category).all()}
    return PurchaseResponse(
        id=purchase.id,
        transaction_number=purchase.transaction_number,
        store_id=purchase.store_id,
        purchase_time=purchase.purchase_time,
        total_amount=purchase.total_amount,
        items=[
            PurchaseItemResponse(
                product_id=i.product_id,
                product_name=product_names.get(i.product_id) or f"Product {i.product_id}",
                category=product_categories.get(i.product_id),
                quantity=i.quantity,
                unit_price=i.unit_price,
                total_price=i.total_price,
            )
            for i in purchase.items
        ],
    )
