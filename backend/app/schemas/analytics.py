from pydantic import BaseModel
from typing import List

class HeatmapPoint(BaseModel):
    zone_id: str
    x: float
    y: float
    attention_count: int
    average_attention_score: float
    intensity: float

class HeatmapResponse(BaseModel):
    store_id: str
    points: List[HeatmapPoint]

class DwellMetricsResponse(BaseModel):
    total_sessions: int
    average_duration_seconds: float
    longest_session: float
    shortest_session: float

class ProductMetricItem(BaseModel):
    product_id: str
    product_name: str
    views: int
    pickups: int
    compares: int
    returns: int
    purchases: int
    conversion_rate: float

class ZoneMetricItem(BaseModel):
    zone_id: str
    zone_name: str
    zone_visits: int
    unique_sessions: int
    average_attention_score: float
    normalized_traffic: float
    zone_attractiveness_score: float

class ConversionMetricItem(BaseModel):
    product_id: str
    product_name: str
    views: int
    purchases: int
    conversion_rate: float

class JourneyItem(BaseModel):
    source_zone: str
    target_zone: str
    transition_count: int
