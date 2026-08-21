import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.models import Product
from app.schemas.schemas import ProductCreate

router = APIRouter()

@router.post("")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.sku == product.sku).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")
        
    new_product = Product(
        id=f"PROD-{str(uuid.uuid4())[:8].upper()}",
        sku=product.sku,
        name=product.name,
        category=product.category,
        price=product.price,
        shelf_id=product.shelf_id,
        position_on_shelf=product.position_on_shelf
    )
    db.add(new_product)
    db.commit()
    
    return {
        "id": new_product.id,
        "sku": new_product.sku,
        "name": new_product.name,
        "category": new_product.category,
        "price": new_product.price,
        "shelf_id": new_product.shelf_id,
        "position_on_shelf": new_product.position_on_shelf
    }

@router.get("")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [
        {
            "id": p.id,
            "sku": p.sku,
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "shelf_id": p.shelf_id,
            "position_on_shelf": p.position_on_shelf
        }
        for p in products
    ]
