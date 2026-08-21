import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    store_id: Optional[str] = None

# Trajectory & Session Ingestion Schemas
class TrajectoryPointIngest(BaseModel):
    session_id: Optional[str] = None
    shopper_id: Optional[str] = None
    timestamp: Optional[str] = None
    camera_id: Optional[str] = None
    x: float
    y: float
    zone_id: Optional[str] = None
    event_type: Optional[str] = "TRACK"


class SessionIngestPayload(BaseModel):
    session_id: str
    shopper_id: str
    store_id: str
    points: List[TrajectoryPointIngest]

# Analytics & Segmentation Schemas
class SegmentResponse(BaseModel):
    session_id: str
    segment_name: str
    confidence: float
    feature_snapshot: Dict[str, Any]

class AttractivenessResponse(BaseModel):
    product_id: str
    sku: str
    name: str
    category: str
    raw_metrics: Dict[str, float]
    normalized_metrics: Dict[str, float]
    final_score: float

class RecommendationResponse(BaseModel):
    id: str
    priority: str
    store_id: str
    sku: str
    shelf_id: str
    action: str
    reason: str
    expected_conversion_uplift: float

class ProductCreate(BaseModel):
    sku: str
    name: str
    category: str
    price: float
    shelf_id: str
    position_on_shelf: str

# Heatmap Schemas
class HeatmapMatrixResponse(BaseModel):
    store_id: str
    shelf_id: Optional[str] = None
    layer_type: str
    width: int
    height: int
    matrix: List[List[float]]
    legend_min: float
    legend_max: float

class HomographyCalibrationPayload(BaseModel):
    camera_id: str
    source_points: List[List[float]] # [[xc, yc], ...]
    destination_points: List[List[float]] # [[xp, yp], ...]

# Dashboard Payloads
class StoreManagerDashboardResponse(BaseModel):
    kpis: Dict[str, Any]
    hourly_traffic: List[Dict[str, Any]]
    zone_occupancy: List[Dict[str, Any]]
    shelf_performance: List[Dict[str, Any]]
    product_interactions: List[Dict[str, Any]]
    conversion_funnel: List[Dict[str, Any]]
    cameras: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]

class AnalystDashboardResponse(BaseModel):
    attention_metrics: Dict[str, Any]
    journey_sankey: Dict[str, Any]
    segment_distribution: List[Dict[str, Any]]
    shopping_behavior: List[Dict[str, Any]]
    heatmaps: Dict[str, Any]
    dwell_analysis: Dict[str, Any]
    behavior_scatter: List[Dict[str, Any]]
    attractiveness_rankings: List[Dict[str, Any]]

class MarketingDashboardResponse(BaseModel):
    campaigns: List[Dict[str, Any]]
    promotion_lift: Dict[str, Any]
    visibility_radar: List[Dict[str, Any]]
    attractiveness_scores: List[Dict[str, Any]]
    engagement_breakdown: List[Dict[str, Any]]
    conversion_scatter: List[Dict[str, Any]]
    recommendation_matrix: List[Dict[str, Any]]

class AdminDashboardResponse(BaseModel):
    system_status: Dict[str, Any]
    users_by_role: List[Dict[str, Any]]
    camera_status: Dict[str, Any]
    infrastructure: Dict[str, Any]
    api_performance: Dict[str, Any]
    security_metrics: Dict[str, Any]
    audit_logs: List[Dict[str, Any]]
