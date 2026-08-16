from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin_or_manager
from app.database import get_db
from app.models.product import Product, ProductCategory
from app.models.user import User
from app.schemas.catalog import (
    ProductCategoryCreate,
    ProductCategoryOut,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)

router = APIRouter()


@router.post("/categories", response_model=ProductCategoryOut, status_code=201)
def create_product_category(
    payload: ProductCategoryCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    existing = db.query(ProductCategory).filter(ProductCategory.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A product category with this name already exists")
    category = ProductCategory(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/categories", response_model=list[ProductCategoryOut])
def list_product_categories(db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    return db.query(ProductCategory).all()


@router.post("", response_model=ProductOut, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    existing = db.query(Product).filter(Product.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductOut])
def list_products(
    shelf_id: int | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Product)
    if shelf_id:
        query = query.filter(Product.shelf_id == shelf_id)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    return query.all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    _user: User = Depends(require_admin_or_manager),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int, db: Session = Depends(get_db), _user: User = Depends(require_admin_or_manager)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None
