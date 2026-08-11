from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

# Shown wherever a visit has no legitimate mapping to a real customer record,
# which is the normal case: CCTV cannot supply a name or phone, and this
# system never guesses one. See app/models/customer.py.
#
# "Anonymous Visitor" rather than "Unknown Customer": the system isn't failing
# to look something up, it deliberately never collected it. Paired with the
# tracking id in the UI, that reads as a real, describable person the cameras
# saw - not as missing data.
ANONYMOUS_VISITOR_NAME = "Anonymous Visitor"
UNKNOWN_CUSTOMER_PHONE = "Not Available"


class CustomerBase(BaseModel):
    customer_code: str
    full_name: str
    phone: str | None = None
    email: str | None = None
    store_id: int | None = None
    is_active: bool = True


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    customer_code: str | None = None
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    store_id: int | None = None
    is_active: bool | None = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class VisitZone(BaseModel):
    zone_id: int | None
    zone_name: str
    seconds: float


class VisitSummary(BaseModel):
    id: int
    tracking_id: str
    customer_id: int | None
    # Resolved display values: the real record's when a mapping exists,
    # otherwise the explicit unknown placeholders above - never a guess.
    customer_name: str
    phone: str
    store_id: int
    camera_id: int
    camera_name: str | None
    entry_time: datetime
    exit_time: datetime
    total_dwell_seconds: float
    total_zones_visited: int
    interaction_count: int


class VisitDetail(VisitSummary):
    zones: list[VisitZone]
    journey: list[str]


class InteractionItem(BaseModel):
    product_id: int | None
    product_name: str | None
    zone_id: int | None
    zone_name: str | None
    interaction_type: str
    timestamp: datetime
    duration_seconds: float


class PurchaseItemResponse(BaseModel):
    product_id: int | None
    # Resolved from the products table. When a product row has since been
    # deleted the API returns "Product <id>" rather than inventing a name.
    product_name: str | None
    category: str | None
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class PurchasedProduct(BaseModel):
    """Compact per-product roll-up for the customer table, so a row can show
    real product names instead of an opaque count."""

    product_id: int | None
    name: str
    quantity: int


class PurchaseResponse(BaseModel):
    id: int
    transaction_number: str
    store_id: int
    purchase_time: datetime
    total_amount: Decimal
    items: list[PurchaseItemResponse]


class CustomerDetail(BaseModel):
    """Everything the Customer Details panel shows for one real customer.

    Purchase-derived figures are real or absent: with no transaction data
    loaded they are 0/None rather than estimated from footfall, because
    video cannot observe a payment.
    """

    customer: CustomerResponse
    first_visit: datetime | None
    last_visit: datetime | None
    total_visits: int
    average_dwell_seconds: float
    total_spend: Decimal
    average_purchase_value: Decimal | None
    purchase_count: int
    recent_visits: list[VisitSummary]
    purchases: list[PurchaseResponse]


class CustomerListItem(BaseModel):
    """A row in the Store Manager customer table. Represents either a real
    mapped customer or an anonymous visit session, distinguished by
    `is_identified` so the UI never implies an identity it doesn't have."""

    customer_id: int | None
    tracking_id: str | None
    display_name: str
    # Business customer code for a registered customer, else None - the UI
    # shows the tracking id for anonymous rows instead.
    customer_code: str | None
    phone: str
    is_identified: bool
    last_visit: datetime | None
    total_visits: int
    total_dwell_seconds: float
    interaction_count: int
    products_purchased: int
    total_spend: Decimal
    # Real purchased products (name + quantity), empty when this customer has
    # no transactions. The UI renders "No purchase recorded" for an empty list
    # rather than a bare dash.
    products: list[PurchasedProduct]


class CustomerListResponse(BaseModel):
    store_id: int | None
    total: int
    items: list[CustomerListItem]


class PurchaseCreateItem(BaseModel):
    product_id: int | None = None
    quantity: int = 1
    unit_price: Decimal
    total_price: Decimal | None = None


class PurchaseCreate(BaseModel):
    customer_id: int
    store_id: int
    transaction_number: str
    purchase_time: datetime | None = None
    items: list[PurchaseCreateItem] = []


class VisitMappingRequest(BaseModel):
    """Links an anonymous visit session to a real customer record.

    This is the ONLY way identity ever attaches to video-derived data, and it
    is always a deliberate human/CRM action - never inferred.
    """

    customer_id: int | None


class JourneyZone(BaseModel):
    """One zone on the customer's path, with what the video actually recorded
    there. `visits` counts separate visit sessions that touched this zone."""

    zone_id: int | None
    zone_name: str
    seconds: float
    visits: int
    interactions: int


class ProductInteractionDetail(BaseModel):
    """A product this visitor was near, aggregated across their visits.

    Proximity-derived (zone/shelf), not observed handling - this system has
    person detection only, no pick detection.
    """

    product_id: int | None
    product_name: str
    zone_name: str | None
    interaction_count: int
    total_seconds: float


class TrackingInfo(BaseModel):
    """What the video pipeline genuinely recorded for this visitor."""

    tracking_ids: list[str]
    cameras: list[str]
    first_detected: datetime | None
    last_detected: datetime | None
    zones: list[str]
    total_tracking_seconds: float
    visit_count: int


class CustomerProfile(BaseModel):
    """Everything the Customer Details modal needs, for a registered customer
    OR an anonymous tracked visitor, in one request.

    Identity fields are populated only from a real Customer row; an anonymous
    profile carries the placeholders and an empty purchase history, because a
    camera cannot observe a payment.
    """

    is_identified: bool
    display_name: str
    phone: str
    email: str | None
    customer_code: str | None
    customer_id: int | None
    tracking_id: str | None

    total_visits: int
    first_visit: datetime | None
    last_visit: datetime | None
    average_visit_seconds: float
    total_dwell_seconds: float
    total_spend: Decimal
    average_purchase_value: Decimal | None
    purchase_count: int

    journey: list[JourneyZone]
    purchases: list[PurchaseResponse]
    interactions: list[ProductInteractionDetail]
    tracking: TrackingInfo
    recent_visits: list[VisitSummary]


class StoreCustomerSummary(BaseModel):
    """KPI row on the Store Manager customer page."""

    store_id: int | None
    todays_customers: int
    returning_customers: int
    average_dwell_seconds: float
    total_purchases: int
    total_revenue: Decimal
    average_purchase_value: Decimal | None


class CustomerAnalyticsSummary(BaseModel):
    store_id: int | None
    total_visits: int
    identified_visits: int
    anonymous_visits: int
    registered_customers: int
    returning_customers: int
    average_visit_seconds: float
    total_revenue: Decimal
    average_purchase_value: Decimal | None
    purchase_count: int
    most_visited_zone: str | None
    most_interacted_product: str | None


class ZoneVisitStat(BaseModel):
    zone_id: int | None
    zone_name: str
    visits: int
    average_dwell_seconds: float


class VisitsOverTimePoint(BaseModel):
    date: str
    visits: int


class ProductInteractionStat(BaseModel):
    product_id: int | None
    product_name: str
    interactions: int
    total_seconds: float


class PurchaseStat(BaseModel):
    product_id: int | None
    product_name: str
    quantity: int
    revenue: Decimal
