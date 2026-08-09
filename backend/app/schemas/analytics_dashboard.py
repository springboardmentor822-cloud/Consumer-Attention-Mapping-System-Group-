from pydantic import BaseModel


class ZoneTransition(BaseModel):
    from_zone_id: int
    from_zone_name: str
    to_zone_id: int
    to_zone_name: str
    count: int


class JourneyFlowResponse(BaseModel):
    store_id: int | None
    transitions: list[ZoneTransition]


class SegmentItem(BaseModel):
    segment: str
    count: int
    avg_dwell_seconds: float


class SegmentationResponse(BaseModel):
    store_id: int | None
    total_customers: int
    segments: list[SegmentItem]
    multi_zone_visitor_pct: float


class StoreComparisonItem(BaseModel):
    store_id: int
    store_name: str
    visitors: int
    avg_dwell_seconds: float
    peak_hour: int | None


class StoreComparisonResponse(BaseModel):
    stores: list[StoreComparisonItem]


class InsightItem(BaseModel):
    severity: str
    message: str


class InsightsResponse(BaseModel):
    store_id: int | None
    insights: list[InsightItem]


class ProductVisibilityItem(BaseModel):
    shelf_id: int
    shelf_name: str
    store_name: str
    zone: str
    visibility_score: int


class ProductVisibilityResponse(BaseModel):
    shelves: list[ProductVisibilityItem]


class FunnelStage(BaseModel):
    stage: str
    count: int


class ConversionFunnelResponse(BaseModel):
    store_id: int | None
    stages: list[FunnelStage]
    conversion_rate: float | None


class CategorySummaryItem(BaseModel):
    category: str
    product_count: int
    total_stock: int
    avg_price: float
    inventory_value: float


class InventorySummaryResponse(BaseModel):
    store_id: int | None
    total_products: int
    total_inventory_items: int
    inventory_value: float
    low_stock_products: int
    categories: list[CategorySummaryItem]


class ProductStockItem(BaseModel):
    product_id: int
    product_name: str
    sku: str
    category: str
    stock_quantity: int
    price: float
    shelf_name: str


class ProductAnalysisResponse(BaseModel):
    store_id: int | None
    highest_stock: list[ProductStockItem]
    lowest_stock: list[ProductStockItem]
    to_restock: list[ProductStockItem]
    categories: list[CategorySummaryItem]


class ShelfAnalysisItem(BaseModel):
    shelf_id: int
    shelf_name: str
    store_name: str
    zone: str
    product_count: int
    visit_count: int
    status: str
    # Live re-detection on the shelf camera's latest processed snapshot,
    # cross-checked against product_count (the DB's expected stock record
    # count). None if this camera has never been processed - nothing to
    # cross-check against yet, not "detected zero".
    detected_product_count: int | None = None
    restocking_needed: bool = False


class ShelfAnalysisResponse(BaseModel):
    store_id: int | None
    shelves: list[ShelfAnalysisItem]
    most_visited: ShelfAnalysisItem | None
    least_visited: ShelfAnalysisItem | None
    empty_count: int
    full_count: int


class AttractivenessItem(BaseModel):
    shelf_id: int
    shelf_name: str
    store_name: str
    zone: str
    score: float
    traffic_score: float
    dwell_score: float
    interaction_score: float
    stockout_penalty: float
    rank: int
    has_behavior_data: bool


class AttractivenessResponse(BaseModel):
    store_id: int | None
    shelves: list[AttractivenessItem]


class RecommendationItem(BaseModel):
    severity: str
    shelf_id: int
    shelf_name: str
    zone: str
    issue: str
    action: str


class RecommendationsResponse(BaseModel):
    store_id: int | None
    recommendations: list[RecommendationItem]
    # Shelves that actually had tracking data to rank against - lets the
    # frontend show an honest "not enough data yet" state instead of an
    # empty list that looks like "everything's fine".
    shelves_considered: int
