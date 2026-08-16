from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Any

from app.core.database import get_db
from app.core.security import get_current_user, RoleChecker
from app.models.models import Store, Shelf, User, Product, ShelfProduct
from app.schemas.schemas import StoreCreate, StoreResponse, ShelfCreate, ShelfResponse, ProductCreate, ProductResponse

router = APIRouter(prefix="/stores", tags=["stores"])

# Requires Store Manager or Admin to modify stores/shelves
write_access = Depends(RoleChecker(["Store Manager", "Administrator"]))
read_access = Depends(get_current_user)

# --- Store Endpoints ---

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(store_in: StoreCreate, db: Session = Depends(get_db), current_user: User = write_access) -> Any:
    """Create a new retail store. Restricted to Store Managers and Admins."""
    db_store = Store(name=store_in.name, location=store_in.location)
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

@router.get("", response_model=List[StoreResponse])
def get_stores(db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """List all registered stores."""
    return db.query(Store).all()

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: int, db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """Get details of a specific store."""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    return store

# --- Shelf Endpoints ---

@router.post("/{store_id}/shelves", response_model=ShelfResponse, status_code=status.HTTP_201_CREATED)
def create_shelf(store_id: int, shelf_in: ShelfCreate, db: Session = Depends(get_db), current_user: User = write_access) -> Any:
    """Map a shelf inside a specific store. Restricted to Store Managers and Admins."""
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    
    db_shelf = Shelf(
        store_id=store_id,
        name=shelf_in.name,
        zone_name=shelf_in.zone_name,
        width=shelf_in.width,
        height=shelf_in.height,
        coordinates_json=shelf_in.coordinates_json
    )
    db.add(db_shelf)
    db.commit()
    db.refresh(db_shelf)
    return db_shelf

@router.get("/{store_id}/shelves", response_model=List[ShelfResponse])
def get_shelves(store_id: int, db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """List all shelves mapped inside a store."""
    return db.query(Shelf).filter(Shelf.store_id == store_id).all()

# --- Product Endpoints ---

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db), current_user: User = write_access) -> Any:
    """Register a new product in the master product list."""
    existing = db.query(Product).filter(Product.sku == product_in.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Product with this SKU already exists"
        )
    db_product = Product(
        name=product_in.name,
        category=product_in.category,
        sku=product_in.sku,
        price=product_in.price,
        image_url=product_in.image_url
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """List all available products."""
    return db.query(Product).all()

# --- Shelf Product Assignments ---

class AssignProductPayload(BaseModel):
    product_id: int
    position_x: float = 0.0
    position_y: float = 0.0
    min_stock: int = 5
    current_stock: int = 10

@router.post("/shelves/{shelf_id}/products", status_code=status.HTTP_201_CREATED)
def assign_product_to_shelf(
    shelf_id: int, 
    payload: AssignProductPayload, 
    db: Session = Depends(get_db), 
    current_user: User = write_access
) -> Any:
    """Assign a product to a specific coordinate on a shelf."""
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    
    existing = db.query(ShelfProduct).filter(
        ShelfProduct.shelf_id == shelf_id, 
        ShelfProduct.product_id == payload.product_id
    ).first()
    
    if existing:
        existing.position_x = payload.position_x
        existing.position_y = payload.position_y
        existing.min_stock = payload.min_stock
        existing.current_stock = payload.current_stock
        db.commit()
        return {"status": "updated", "shelf_id": shelf_id, "product_id": payload.product_id}
        
    db_sp = ShelfProduct(
        shelf_id=shelf_id,
        product_id=payload.product_id,
        position_x=payload.position_x,
        position_y=payload.position_y,
        min_stock=payload.min_stock,
        current_stock=payload.current_stock
    )
    db.add(db_sp)
    db.commit()
    return {"status": "assigned", "shelf_id": shelf_id, "product_id": payload.product_id}

@router.get("/{store_id}/occupancy")
def get_store_occupancy(store_id: int, db: Session = Depends(get_db), current_user: User = read_access) -> Any:
    """Get real-time live occupancy count of a store from Redis cache."""
    from app.core.redis_client import redis_client
    val = redis_client.get(f"store:{store_id}:occupancy")
    return {"store_id": store_id, "occupancy": int(val) if val else 0}

@router.delete("/shelves/{shelf_id}")
def delete_shelf(shelf_id: int, db: Session = Depends(get_db), current_user: User = write_access) -> Any:
    """Delete a mapped shelf by ID."""
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")
    db.delete(shelf)
    db.commit()
    return {"status": "deleted", "shelf_id": shelf_id}

@router.delete("/{store_id}")
def delete_store(store_id: int, db: Session = Depends(get_db), current_user: User = write_access) -> Any:
    """Delete a retail store location by ID."""
    st = db.query(Store).filter(Store.id == store_id).first()
    if not st:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
    db.delete(st)
    db.commit()
    return {"status": "deleted", "store_id": store_id}

