from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ==========================================================
# USER SCHEMAS
# ==========================================================

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: Optional[str] = "Store Manager"


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


# ==========================================================
# JWT TOKEN
# ==========================================================

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    email: EmailStr


# ==========================================================
# STORE SCHEMAS
# ==========================================================

class StoreBase(BaseModel):
    store_name: str
    manager: str
    location: str
    address: str
    phone: str
    status: str = "Active"


class StoreCreate(StoreBase):
    pass


class StoreResponse(StoreBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# SHELF SCHEMAS
# ==========================================================

class ShelfBase(BaseModel):
    shelf_name: str
    zone: str
    capacity: int
    status: str = "Available"
    store_id: int


class ShelfCreate(ShelfBase):
    pass


class ShelfResponse(ShelfBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# PRODUCT SCHEMAS
# ==========================================================

class ProductBase(BaseModel):
    product_name: str
    category: str
    brand: str
    sku: str
    barcode: str
    price: float
    stock: int
    image: str
    attention_score: float = 0
    shelf_id: int


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# CAMERA SCHEMAS
# ==========================================================

class CameraBase(BaseModel):
    camera_name: str
    location: str
    status: str = "Online"
    health: str = "Good"
    ip_address: str
    store_id: int


class CameraCreate(CameraBase):
    pass


class CameraResponse(CameraBase):
    id: int

    class Config:
        from_attributes = True
        
# ==========================================================
# CONSUMER SCHEMAS
# ==========================================================

class ConsumerBase(BaseModel):
    gender: str
    age_group: str
    dwell_time: float
    attention_score: float
    emotion: str
    store_name: str


class ConsumerCreate(ConsumerBase):
    pass


class ConsumerResponse(ConsumerBase):
    id: int
    visit_time: datetime

    class Config:
        from_attributes = True


# ==========================================================
# ANALYTICS SCHEMAS
# ==========================================================

class AnalyticsBase(BaseModel):
    total_visitors: int
    total_sales: float
    average_attention: float
    engagement_score: float
    conversion_rate: float
    heatmap_image: str


class AnalyticsCreate(AnalyticsBase):
    pass


class AnalyticsResponse(AnalyticsBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# DASHBOARD ANALYTICS
# ==========================================================

class DashboardAnalyticsResponse(BaseModel):
    total_stores: int
    total_shelves: int
    total_products: int
    total_cameras: int
    total_users: int
    low_stock_products: int

    class Config:
        from_attributes = True


# ==========================================================
# REPORT SCHEMAS
# ==========================================================

class ReportBase(BaseModel):
    report_name: str
    report_type: str
    generated_by: str
    file_path: str


class ReportCreate(ReportBase):
    pass


class ReportResponse(ReportBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# REPORT DASHBOARD
# ==========================================================

class ReportDashboardResponse(BaseModel):
    total_stores: int
    total_shelves: int
    total_products: int
    total_cameras: int
    total_users: int
    generated_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# NOTIFICATION SCHEMAS
# ==========================================================

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        
# ==========================================================
# AI DASHBOARD RESPONSE
# ==========================================================

class AIDashboardResponse(BaseModel):

    # ======================================================
    # Consumer Statistics
    # ======================================================

    total_visitors: int = 0

    male_visitors: int = 0
    female_visitors: int = 0

    child_visitors: int = 0
    adult_visitors: int = 0
    senior_visitors: int = 0

    # ======================================================
    # AI Analytics
    # ======================================================

    average_attention: float = 0
    average_dwell_time: float = 0

    happy_count: int = 0
    neutral_count: int = 0
    angry_count: int = 0
    surprised_count: int = 0

    # ======================================================
    # Camera Statistics
    # ======================================================

    active_cameras: int = 0
    offline_cameras: int = 0

    # ======================================================
    # Store Statistics
    # ======================================================

    top_store: str = ""
    top_product: str = ""

    # ======================================================
    # Live Customer Analytics
    # ======================================================

    current_persons: int = 0
    total_customers: int = 0
    average_dwell: float = 0

    # ======================================================
    # Shelf Analytics
    # ======================================================

    shelf_a: int = 0
    shelf_b: int = 0
    checkout: int = 0

    shelf_a_percent: float = 0
    shelf_b_percent: float = 0
    checkout_percent: float = 0

    peak_zone: str = "None"
    peak_zone_count: int = 0

    # ======================================================
    # Product Analytics
    # ======================================================

    products_detected: int = 0

    product_interactions: int = 0

    total_products: int = 0

    most_detected_product: str = "None"

    least_detected_product: str = "None"

    occupied_shelves: int = 0

    empty_shelves: int = 0

    average_product_confidence: float = 0

    # ======================================================
    # Attention Analytics
    # ======================================================

    attention_score: float = 0

    engagement_level: str = "Low"

    shopping_behavior: str = "Browsing"

    customer_flow: str = "Normal"

    # ======================================================
    # Store Analytics
    # ======================================================

    store_congestion: str = "Low"

    most_visited_shelf: str = "None"

    hourly_customers: int = 0

    # ======================================================
    # Camera Analytics
    # ======================================================

    camera_status: str = "Online"

    system_status: str = "Healthy"

    # ======================================================
    # Emotion Analytics
    # ======================================================

    happy: int = 0
    neutral: int = 0
    surprised: int = 0
    angry: int = 0

    # ======================================================
    # Heatmap Analytics
    # ======================================================

    heatmap_active: bool = True

    heatmap_points: int = 0

    hotspots: int = 0

    # ======================================================
    # Path Tracking
    # ======================================================

    path_tracking: bool = True

    tracked_paths: int = 0

    # ======================================================
    # Performance
    # ======================================================

    frames_processed: int = 0

    fps: float = 0

    # ======================================================
    # AI Recommendation
    # ======================================================

    ai_recommendation: str = "Monitoring customer behaviour..."

    # ======================================================
    # Dashboard Summary
    # ======================================================

    dashboard_summary: dict = {}

    # ======================================================
    # Last Updated
    # ======================================================

    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True