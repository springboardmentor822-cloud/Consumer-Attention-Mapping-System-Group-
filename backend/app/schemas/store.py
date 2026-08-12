from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ProductCreate(BaseModel):
    product_name: str = "Product"
    shelf_id: int
    zone_id: Optional[int] = None
    store_id: int = 1
    camera_id: Optional[int] = None
    current_count: int = 0
    detected_count: int = 0
    available_count: int = 50
    stock_status: str = "Healthy"
    product_health: str = "Optimal"


class ProductOut(BaseModel):
    id: int
    product_name: str
    shelf_id: int
    zone_id: Optional[int] = None
    store_id: int
    camera_id: Optional[int] = None
    current_count: int
    detected_count: int
    available_count: int
    detection_time: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    stock_status: str
    product_health: str

    class Config:
        from_attributes = True


class ShelfCreate(BaseModel):
    label: str
    shelf_name: Optional[str] = None
    zone_id: int
    assigned_camera_id: Optional[int] = None


class ShelfOut(BaseModel):
    id: int
    label: str
    shelf_name: Optional[str] = None
    store_id: int
    zone_id: int
    assigned_camera_id: Optional[int] = None
    occupancy_percentage: float = 75.0
    visitors_count: int = 0
    average_dwell_time: float = 0.0
    attention_score: float = 0.0
    shelf_status: str = "Healthy"
    products: List[ProductOut] = []

    class Config:
        from_attributes = True


class StoreCreate(BaseModel):
    name: str
    location: str
    manager_name: Optional[str] = "Store Manager"
    contact_number: Optional[str] = "+1 (555) 019-2834"
    status: Optional[str] = "Active"
    opening_hours: Optional[str] = "08:00 AM - 10:00 PM"


class StoreUpdate(BaseModel):
    name: str
    location: str
    manager_name: Optional[str] = None
    contact_number: Optional[str] = None
    status: Optional[str] = None
    opening_hours: Optional[str] = None


class StoreOut(BaseModel):
    id: int
    name: str
    location: str
    manager_name: Optional[str] = "Store Manager"
    contact_number: Optional[str] = "+1 (555) 019-2834"
    status: Optional[str] = "Active"
    opening_hours: Optional[str] = "08:00 AM - 10:00 PM"
    shelves: List[ShelfOut] = []

    class Config:
        from_attributes = True


class ZoneCreate(BaseModel):
    name: str
    store_id: int
    assigned_camera_id: Optional[int] = None
    status: Optional[str] = "Optimal"


class ZoneOut(BaseModel):
    id: int
    name: str
    store_id: int
    assigned_camera_id: Optional[int] = None
    status: str = "Optimal"

    class Config:
        from_attributes = True


class ProductCategoryCreate(BaseModel):
    name: str


class ProductCategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class CameraCreate(BaseModel):
    label: str
    location: str
    stream_url: str
    store_id: int


class CameraOut(CameraCreate):
    id: int
    status: str

    class Config:
        from_attributes = True
