import datetime as dt
from typing import Optional

from pydantic import BaseModel, Field


from app.models.enums import ShelfLevelEnum


class ShelfCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ShelfCategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class ShelfCreate(BaseModel):
    store_id: int
    camera_id: Optional[int] = None
    category_id: Optional[int] = None
    name: str
    aisle: Optional[str] = None
    position_coordinates: Optional[str] = None
    frame_bounding_box: Optional[str] = None
    shelf_width_m: Optional[float] = None
    shelf_height_m: Optional[float] = None
    shelf_level: Optional[ShelfLevelEnum] = None


class ShelfUpdate(BaseModel):
    camera_id: Optional[int] = None
    category_id: Optional[int] = None
    name: Optional[str] = None
    aisle: Optional[str] = None
    position_coordinates: Optional[str] = None
    frame_bounding_box: Optional[str] = None
    shelf_width_m: Optional[float] = None
    shelf_height_m: Optional[float] = None
    shelf_level: Optional[ShelfLevelEnum] = None


class ShelfOut(BaseModel):
    id: int
    store_id: int
    camera_id: Optional[int]
    category_id: Optional[int]
    name: str
    aisle: Optional[str]
    position_coordinates: Optional[str]
    frame_bounding_box: Optional[str]
    shelf_width_m: Optional[float] = None
    shelf_height_m: Optional[float] = None
    shelf_level: ShelfLevelEnum
    created_at: dt.datetime

    class Config:
        from_attributes = True


class ProductCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProductCategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    sku: str = Field(..., max_length=100)
    name: str
    brand: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    shelf_id: Optional[int] = None
    shelf_position: Optional[str] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    shelf_id: Optional[int] = None
    shelf_position: Optional[str] = None
    image_url: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    brand: Optional[str]
    price: Optional[float]
    category_id: Optional[int]
    shelf_id: Optional[int]
    image_url: Optional[str]
    created_at: dt.datetime

    class Config:
        from_attributes = True
