from decimal import Decimal

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    shelf_id: int
    product_name: str = Field(min_length=2, max_length=160)
    sku: str = Field(min_length=2, max_length=80)
    category: str = Field(min_length=2, max_length=120)
    price: Decimal = Field(ge=0)
    stock_quantity: int = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    shelf_id: int | None = None
    product_name: str | None = None
    sku: str | None = None
    category: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None


class ProductResponse(ProductBase):
    id: int

    model_config = {"from_attributes": True}
