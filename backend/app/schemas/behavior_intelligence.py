from pydantic import BaseModel


class SegmentSummaryItem(BaseModel):
    segment: str
    count: int
    # Share of CLASSIFIED visits, so the five real segments sum to 1.0 and
    # "Unclassified" (reported with share 0.0) doesn't dilute them.
    share: float
    average_dwell_seconds: float
    average_zones: float
    examples: list[str]


class SegmentAssignmentItem(BaseModel):
    """One visit's classification, with the measurements behind it so a human
    can check the rule rather than trust an opaque label."""

    tracking_id: str
    segment: str
    reason: str
    distinct_zones: int
    zone_revisits: int
    total_seconds: float
    interaction_count: int
    promo_dwell_share: float
    dominant_zone: str | None


class SegmentationBreakdown(BaseModel):
    store_id: int | None
    # Always "rule_based" - there is no trained model behind this, and no
    # accuracy figure is reported because none has been measured.
    method: str
    total_visits: int
    classified_visits: int
    segments: list[SegmentSummaryItem]
    assignments: list[SegmentAssignmentItem]


class AttractivenessComponentInfo(BaseModel):
    name: str
    weight: float
    # measured | proxy | partial - lets the UI label a proxy honestly instead
    # of presenting it as a direct measurement.
    availability: str


class ProductScoreItem(BaseModel):
    product_id: int
    product_name: str
    category: str
    zone_name: str | None
    score: float  # 0-100
    shelf_visibility_score: float
    product_engagement_score: float
    conversion_potential_score: float
    marketing_effectiveness_score: float
    # False when this product has no transactions at all, so the conversion
    # component carries no real evidence for it.
    data_complete: bool
    components: dict[str, float]


class ProductAttractivenessResponse(BaseModel):
    store_id: int | None
    method: str
    note: str
    components: list[AttractivenessComponentInfo]
    products: list[ProductScoreItem]
