from pydantic import BaseModel, Field


class ShelfBase(BaseModel):
    store_id: int
    shelf_name: str = Field(min_length=2, max_length=120)
    zone: str = Field(min_length=1, max_length=80)
    description: str | None = None
    camera_id: int | None = None


class ShelfCreate(ShelfBase):
    pass


class ShelfUpdate(BaseModel):
    store_id: int | None = None
    shelf_name: str | None = None
    zone: str | None = None
    description: str | None = None
    camera_id: int | None = None


class ShelfResponse(ShelfBase):
    id: int

    model_config = {"from_attributes": True}
