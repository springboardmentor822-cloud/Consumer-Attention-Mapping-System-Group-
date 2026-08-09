from pydantic import BaseModel


class DwellBreakdownItem(BaseModel):
    scope_id: int | None
    scope_name: str
    total_seconds: float
    average_seconds: float
    max_seconds: float
    min_seconds: float
    visit_count: int


class DwellResponse(BaseModel):
    store_id: int | None
    total_seconds: float
    average_seconds: float
    max_seconds: float
    min_seconds: float
    visit_count: int
    by_zone: list[DwellBreakdownItem]
    by_shelf: list[DwellBreakdownItem]


class EngagementResponse(BaseModel):
    store_id: int | None
    average_score: float
    average_standing_seconds: float
    average_interaction_seconds: float
    average_viewing_seconds: float
    sample_size: int
    note: str


class ZoneFlowNodeSchema(BaseModel):
    zone_id: int
    zone_name: str


class ZoneFlowEdgeSchema(BaseModel):
    from_zone_id: int
    to_zone_id: int
    count: int


class TrafficResponse(BaseModel):
    store_id: int | None
    average_speed_px_per_sec: float
    total_distance_px: float
    sample_size: int
    zone_flow_nodes: list[ZoneFlowNodeSchema]
    zone_flow_edges: list[ZoneFlowEdgeSchema]
    note: str
