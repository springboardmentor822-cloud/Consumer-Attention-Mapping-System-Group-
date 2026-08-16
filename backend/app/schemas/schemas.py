from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Store Schemas ---
class StoreBase(BaseModel):
    name: str
    location: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreResponse(StoreBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Shelf Schemas ---
class ShelfBase(BaseModel):
    name: str
    zone_name: str
    width: float = 1.0
    height: float = 2.0
    coordinates_json: Optional[str] = None

class ShelfCreate(ShelfBase):
    pass

class ShelfResponse(ShelfBase):
    id: int
    store_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    sku: str
    price: float = 0.0
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Camera Schemas ---
class CameraBase(BaseModel):
    name: str
    stream_url: Optional[str] = None
    status: str = "active"
    position_x: float = 0.0
    position_y: float = 0.0
    angle: float = 0.0

class CameraCreate(CameraBase):
    pass

class CameraResponse(CameraBase):
    id: int
    store_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- ShopperPosition Schemas ---
class ShopperPositionBase(BaseModel):
    timestamp: datetime.datetime
    camera_id: int
    shopper_id: int
    x: float
    y: float
    dwell_time: int
    gaze_target: Optional[str] = None
    gaze_x: Optional[float] = None
    gaze_y: Optional[float] = None

class ShopperPositionCreate(ShopperPositionBase):
    pass

class ShopperPositionResponse(ShopperPositionBase):
    id: int

    class Config:
        from_attributes = True

# --- ShopperSession Schemas ---
class ShopperSessionResponse(BaseModel):
    id: int
    shopper_id: int
    store_id: int
    entry_time: datetime.datetime
    exit_time: Optional[datetime.datetime] = None
    total_path_distance: float
    avg_velocity: float
    total_dwell_time: int
    zone_dwell_json: Optional[str] = None
    interaction_count: int
    shopper_segment: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- ProductAttractivenessScore Schemas ---
class ProductAttractivenessScoreResponse(BaseModel):
    id: int
    store_id: int
    shelf_id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    shelf_name: Optional[str] = None
    timestamp: datetime.datetime
    passing_traffic: float
    dwell_time: float
    interaction_count: float
    stockout_rate: float
    attention_duration: float
    pickup_rate: float
    conversion_rate: float
    repeat_engagement: float
    attractiveness_score: float
    calculation_window: str

    class Config:
        from_attributes = True

# --- OptimizationRecommendation Schemas ---
class OptimizationRecommendationResponse(BaseModel):
    id: int
    store_id: int
    shelf_id: Optional[int] = None
    product_id: Optional[int] = None
    timestamp: datetime.datetime
    issue_type: str
    priority: str
    title: str
    description: str
    recommended_action: str
    expected_uplift: str
    status: str

    class Config:
        from_attributes = True


