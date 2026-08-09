from pydantic import BaseModel

from app.schemas.auth import UserResponse
from app.schemas.camera import CameraResponse
from app.schemas.store import StoreResponse


class DashboardStats(BaseModel):
    total_users: int
    total_stores: int
    total_shelves: int
    total_products: int
    total_cameras: int
    recent_activities: list[str]
    latest_registered_users: list[UserResponse]
    latest_stores: list[StoreResponse]
    latest_cameras: list[CameraResponse]
