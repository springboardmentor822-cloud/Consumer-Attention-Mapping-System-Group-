from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.core.security import require_role
from app.models.store import Store, Zone, Shelf, Product, ProductCategory, Camera
from app.models.user import UserRole
from app.core.security import READ_ALL_ROLES, MANAGER_ROLES
from app.schemas.store import (
    StoreCreate, StoreOut,
    ZoneCreate, ZoneOut,
    ShelfCreate, ShelfOut,
    ProductCreate, ProductOut,
    ProductCategoryCreate, ProductCategoryOut,
)

router = APIRouter(tags=["Store & Shelf Management"])

MANAGE_ROLES = MANAGER_ROLES


# ---------- Stores ----------
@router.post("/stores", response_model=StoreOut)
def create_store(payload: StoreCreate, db: Session = Depends(get_db),
                  _=Depends(require_role(*MANAGE_ROLES))):
    store = Store(**payload.dict())
    db.add(store)
    db.commit()
    db.refresh(store)
    return store


@router.get("/stores", response_model=List[StoreOut])
def list_stores(db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    return db.query(Store).all()


@router.get("/stores/{store_id}", response_model=StoreOut)
def get_store(store_id: int, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    store = db.query(Store).get(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@router.put("/stores/{store_id}", response_model=StoreOut)
def update_store(store_id: int, payload: StoreCreate, db: Session = Depends(get_db),
                  _=Depends(require_role(*MANAGE_ROLES))):
    store = db.query(Store).get(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    store.name = payload.name
    store.location = payload.location
    if payload.manager_name: store.manager_name = payload.manager_name
    if payload.contact_number: store.contact_number = payload.contact_number
    if payload.status: store.status = payload.status
    if payload.opening_hours: store.opening_hours = payload.opening_hours
    db.commit()
    db.refresh(store)
    return store


@router.delete("/stores/{store_id}", status_code=204)
def delete_store(store_id: int, db: Session = Depends(get_db),
                  _=Depends(require_role(UserRole.ADMINISTRATOR))):
    store = db.query(Store).get(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    db.delete(store)
    db.commit()


# ---------- Inventory Hierarchy API ----------
@router.get("/stores/{store_id}/inventory")
def get_store_inventory(store_id: int, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    zones = db.query(Zone).filter(Zone.store_id == store_id).all()
    zones_list = []

    for z in zones:
        zone_data: Dict[str, Any] = {"name": z.name}
        shelves = db.query(Shelf).filter(Shelf.zone_id == z.id).all()
        
        if shelves:
            shelves_list = []
            for s in shelves:
                products = db.query(Product).filter(Product.shelf_id == s.id).all()
                products_list = []
                for p in products:
                    products_list.append({
                        "name": p.product_name,
                        "count": p.current_count or p.detected_count or 18
                    })
                shelves_list.append({
                    "name": s.shelf_name or s.label,
                    "occupancy": int(s.occupancy_percentage or 75),
                    "products": products_list
                })
            zone_data["shelves"] = shelves_list
        else:
            zone_data["people"] = 15

        zones_list.append(zone_data)

    return {
        "store": store.name,
        "zones": zones_list
    }


# ---------- Zones ----------
@router.post("/zones", response_model=ZoneOut)
def create_zone(payload: ZoneCreate, db: Session = Depends(get_db),
                 _=Depends(require_role(*MANAGE_ROLES))):
    zone = Zone(**payload.dict())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.get("/zones/{store_id}", response_model=List[ZoneOut])
def list_zones(store_id: int, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    return db.query(Zone).filter(Zone.store_id == store_id).all()


# ---------- Shelves ----------
@router.post("/shelves", response_model=ShelfOut)
def create_shelf(payload: ShelfCreate, db: Session = Depends(get_db),
                  _=Depends(require_role(*MANAGE_ROLES))):
    zone = db.query(Zone).get(payload.zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    shelf = Shelf(
        label=payload.label,
        shelf_name=payload.shelf_name or payload.label,
        zone_id=payload.zone_id,
        store_id=zone.store_id,
        assigned_camera_id=payload.assigned_camera_id
    )
    db.add(shelf)
    db.commit()
    db.refresh(shelf)
    return shelf


@router.get("/shelves/{zone_id}", response_model=List[ShelfOut])
def list_shelves(zone_id: int, db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    return db.query(Shelf).filter(Shelf.zone_id == zone_id).all()


# ---------- Products (Real Inventory Page) ----------
@router.post("/products", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db),
                    _=Depends(require_role(*MANAGE_ROLES))):
    shelf = db.query(Shelf).get(payload.shelf_id)
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    product = Product(
        product_name=payload.product_name,
        shelf_id=payload.shelf_id,
        zone_id=payload.zone_id or shelf.zone_id,
        store_id=payload.store_id or shelf.store_id,
        camera_id=payload.camera_id or shelf.assigned_camera_id,
        current_count=payload.current_count,
        detected_count=payload.detected_count,
        available_count=payload.available_count,
        stock_status=payload.stock_status,
        product_health=payload.product_health
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    return db.query(Product).all()


# ---------- Product Categories ----------
@router.post("/product-categories", response_model=ProductCategoryOut)
def create_category(payload: ProductCategoryCreate, db: Session = Depends(get_db),
                     _=Depends(require_role(*MANAGE_ROLES))):
    category = ProductCategory(**payload.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/product-categories", response_model=List[ProductCategoryOut])
def list_categories(db: Session = Depends(get_db), _=Depends(require_role(*READ_ALL_ROLES))):
    return db.query(ProductCategory).all()
