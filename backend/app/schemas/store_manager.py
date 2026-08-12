from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class StoreManagerKpis(BaseModel):
    todays_visitors: int
    current_customers: int
    average_dwell_time: float
    products_picked: int
    conversion_rate: float
    active_cameras: int
    average_attention_score: float
    store_occupancy: float
    current_queue_length: int
    products_detected: int

class CameraStatusItem(BaseModel):
    id: int
    name: str
    zone_name: str
    status: str
    people_count: int
    product_count: int
    average_dwell_time: float
    attention_score: float
    fps: float
    last_updated: str
    health: str
    stream_url: str

class StoreManagerDashboardResponse(BaseModel):
    kpis: StoreManagerKpis
    store_info: Dict[str, Any]
    active_alerts_count: int
