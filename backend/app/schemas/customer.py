from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

# Shown wherever a visit has no legitimate mapping to a real customer record,
# which is the normal case: CCTV cannot supply a name or phone, and this
# system never guesses one. See app/models/customer.py.
UNKNOWN_CUSTOMER_NAME = "Unknown Customer"
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
    product_name: str | None
    quantity: int
    unit_price: Decimal
    total_price: Decimal


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
    phone: str
    is_identified: bool
    last_visit: datetime | None
    total_visits: int
    total_dwell_seconds: float
    interaction_count: int
    products_purchased: int
    total_spend: Decimal


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
