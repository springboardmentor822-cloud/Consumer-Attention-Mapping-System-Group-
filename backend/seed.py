import os
import csv
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.models.models import User, Store, Shelf, Product, ShelfProduct, Camera
from app.core.security import get_password_hash

def seed_data(db: Session):
    """Populate default users, single store, shelves, products, and 8 cameras into database."""
    print("Seeding database with single store retail data...")

    # 1. Seed Users (with diverse roles for testing access control)
    users = [
        User(
            email="admin@attention.com", 
            hashed_password=get_password_hash("password123"), 
            full_name="Super Admin", 
            role="Administrator"
        ),
        User(
            email="manager@attention.com", 
            hashed_password=get_password_hash("password123"), 
            full_name="Store Manager Dave", 
            role="Store Manager"
        ),
        User(
            email="analyst@attention.com", 
            hashed_password=get_password_hash("password123"), 
            full_name="Analyst Sarah", 
            role="Retail Analyst"
        ),
        User(
            email="marketing@attention.com", 
            hashed_password=get_password_hash("password123"), 
            full_name="Marketer Alice", 
            role="Marketing Manager"
        ),
    ]
    db.add_all(users)
    db.commit()

    # 2. Seed Single Flagship Store
    store = Store(
        name="Walmart Flagship Superstore #1", 
        location="123 Main St, New York"
    )
    db.add(store)
    db.commit()

    # 3. Seed Shelves Mapped to Store Zones
    shelves = [
        Shelf(store_id=store.id, name="Shelf 1: Entrance Foyer Display", zone_name="Entrance", width=4.0, height=3.0, coordinates_json=json.dumps({"x": 10, "y": 10, "w": 80, "h": 12})),
        Shelf(store_id=store.id, name="Shelf 2: Aisle A (Beverages & Snacks)", zone_name="Aisle A", width=2.4, height=1.8, coordinates_json=json.dumps({"x": 10, "y": 30, "w": 38, "h": 15})),
        Shelf(store_id=store.id, name="Shelf 3: Aisle B (Groceries & Bakery)", zone_name="Aisle B", width=3.0, height=2.0, coordinates_json=json.dumps({"x": 52, "y": 30, "w": 38, "h": 15})),
        Shelf(store_id=store.id, name="Shelf 4: Aisle C (Personal Care)", zone_name="Aisle C", width=2.5, height=1.8, coordinates_json=json.dumps({"x": 10, "y": 55, "w": 38, "h": 15})),
        Shelf(store_id=store.id, name="Shelf 5: Aisle D (Household & Cleaning)", zone_name="Aisle D", width=2.8, height=1.8, coordinates_json=json.dumps({"x": 52, "y": 55, "w": 38, "h": 15})),
        Shelf(store_id=store.id, name="Shelf 6: Promotion Area (Featured SKUs)", zone_name="Promotion Area", width=3.5, height=2.2, coordinates_json=json.dumps({"x": 30, "y": 75, "w": 40, "h": 15})),
        Shelf(store_id=store.id, name="Shelf 7: Checkout Counter Registers", zone_name="Checkout", width=5.0, height=2.0, coordinates_json=json.dumps({"x": 10, "y": 90, "w": 80, "h": 10})),
        Shelf(store_id=store.id, name="Shelf 8: Exit Bay Corridor", zone_name="Exit", width=4.0, height=2.0, coordinates_json=json.dumps({"x": 10, "y": 105, "w": 80, "h": 10})),
    ]
    db.add_all(shelves)
    db.commit()

    # 4. Seed Product Catalog
    products = [
        Product(name="Coca-Cola 500ml", category="Beverages", sku="BEV-COKE-500", price=1.99, image_url="/images/coke.png"),
        Product(name="Lays Classic Chips 52g", category="Snacks", sku="SNK-LAYS-CLS", price=3.49, image_url="/images/lays.png"),
        Product(name="Oreo Cookies 120g", category="Snacks", sku="SNK-OREO-120", price=2.99, image_url="/images/oreo.png"),
        Product(name="Parle-G Biscuits 120g", category="Biscuits", sku="SNK-PARLE-120", price=1.49, image_url="/images/parle.png"),
        Product(name="Amazon Water 1L", category="Beverages", sku="BEV-AMZ-1000", price=0.99, image_url="/images/water.png"),
        Product(name="Maggi 2-Minute Noodles", category="Groceries", sku="GRC-MAGGI-2M", price=2.49, image_url="/images/maggi.png"),
        Product(name="Face Moisturizer 100ml", category="Personal Care", sku="PC-FACE-100", price=12.99, image_url="/images/moisturizer.png"),
        Product(name="Wireless Headphones", category="Electronics", sku="ELC-WIR-HEAD", price=49.99, image_url="/images/headphones.png"),
        Product(name="Aroma Diffuser", category="Home & Living", sku="HML-AROMA-DIF", price=24.99, image_url="/images/diffuser.png"),
    ]
    db.add_all(products)
    db.commit()

    # 5. Seed ShelfProducts (Assigning products directly onto specific store shelves)
    shelf_products = [
        # Aisle A (Beverages & Snacks)
        ShelfProduct(shelf_id=shelves[1].id, product_id=products[0].id, position_x=0.5, position_y=0.2, min_stock=10, current_stock=48), # Coca-Cola
        ShelfProduct(shelf_id=shelves[1].id, product_id=products[1].id, position_x=1.2, position_y=0.5, min_stock=8, current_stock=43),  # Lays
        ShelfProduct(shelf_id=shelves[1].id, product_id=products[2].id, position_x=1.8, position_y=0.5, min_stock=6, current_stock=35),  # Oreo
        ShelfProduct(shelf_id=shelves[1].id, product_id=products[4].id, position_x=2.2, position_y=0.8, min_stock=12, current_stock=32), # Amazon Water
        
        # Aisle B (Groceries & Bakery)
        ShelfProduct(shelf_id=shelves[2].id, product_id=products[3].id, position_x=0.5, position_y=0.3, min_stock=10, current_stock=37), # Parle-G
        ShelfProduct(shelf_id=shelves[2].id, product_id=products[5].id, position_x=1.5, position_y=0.6, min_stock=15, current_stock=28), # Maggi

        # Aisle C (Personal Care)
        ShelfProduct(shelf_id=shelves[3].id, product_id=products[6].id, position_x=0.8, position_y=0.4, min_stock=5, current_stock=19),  # Face Moisturizer

        # Promotion Area (Featured Items)
        ShelfProduct(shelf_id=shelves[5].id, product_id=products[7].id, position_x=1.0, position_y=0.5, min_stock=4, current_stock=24),  # Headphones

        # Aisle D (Home & Living)
        ShelfProduct(shelf_id=shelves[4].id, product_id=products[8].id, position_x=1.0, position_y=0.5, min_stock=5, current_stock=21),  # Aroma Diffuser
    ]
    db.add_all(shelf_products)

    # 6. Seed 8 CCTV Cameras Mapped to Store Zones
    cameras = [
        Camera(store_id=store.id, name="Camera 1: Entrance Foyer", stream_url="/videos/cctv_1.mp4", status="active", position_x=10.0, position_y=10.0, angle=90.0),
        Camera(store_id=store.id, name="Camera 2: Aisle A (Snacks & Drinks)", stream_url="/videos/cctv_2.mp4", status="active", position_x=10.0, position_y=30.0, angle=45.0),
        Camera(store_id=store.id, name="Camera 3: Aisle B (Groceries)", stream_url="/videos/cctv_3.mp4", status="active", position_x=52.0, position_y=30.0, angle=135.0),
        Camera(store_id=store.id, name="Camera 4: Aisle C (Personal Care)", stream_url="/videos/cctv_4.mp4", status="active", position_x=10.0, position_y=55.0, angle=45.0),
        Camera(store_id=store.id, name="Camera 5: Aisle D (Household)", stream_url="/videos/cctv_5.mp4", status="active", position_x=52.0, position_y=55.0, angle=135.0),
        Camera(store_id=store.id, name="Camera 6: Promotion Area", stream_url="/videos/cctv_6.mp4", status="active", position_x=30.0, position_y=75.0, angle=90.0),
        Camera(store_id=store.id, name="Camera 7: Checkout Counter", stream_url="/videos/cctv_7.mp4", status="active", position_x=10.0, position_y=90.0, angle=180.0),
        Camera(store_id=store.id, name="Camera 8: Main Exit", stream_url="/videos/cctv_8.mp4", status="active", position_x=10.0, position_y=105.0, angle=180.0),
    ]
    db.add_all(cameras)
    db.commit()

    print("Single Store #1 database seeding completed successfully.")

def seed():
    print("Seeding/updating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Delete existing data safely without exclusive table locks
        for model in [ShelfProduct, Camera, Shelf, Product, Store, User]:
            try:
                db.query(model).delete()
                db.commit()
            except Exception:
                db.rollback()
        seed_data(db)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
