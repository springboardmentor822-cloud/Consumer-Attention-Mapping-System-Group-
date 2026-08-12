import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine, SessionLocal
from app.routers import auth, store as store_router, camera, analytics
from datetime import datetime, timedelta

# Create tables
Base.metadata.create_all(bind=engine)

# Seed default data on startup
from app.models.store import Store, Zone, Shelf, Product, Camera, AttentionLog
from app.models.user import User, UserRole
from app.core.security import hash_password

db = SessionLocal()

try:
    # 0. Seed Users
    if db.query(User).count() == 0:
        default_users = [
            User(full_name="Admin User", email="admin@cams.com", hashed_password=hash_password("admin123"), role=UserRole.ADMINISTRATOR),
            User(full_name="Store Manager", email="manager@cams.com", hashed_password=hash_password("manager123"), role=UserRole.STORE_MANAGER),
            User(full_name="Retail Analyst", email="analyst@cams.com", hashed_password=hash_password("analyst123"), role=UserRole.RETAIL_ANALYST),
            User(full_name="Marketing Manager", email="market@cams.com", hashed_password=hash_password("market123"), role=UserRole.MARKETING_MANAGER),
        ]
        db.add_all(default_users)
        db.commit()
        print("Default users successfully seeded!")

    # 1. Seed Store
    default_store = db.query(Store).first()

    if not default_store:
        default_store = Store(
            name="Demo Store",
            location="Main Headquarters",
            manager_name="Alex Johnson",
            contact_number="+1 (555) 234-5678",
            status="Active",
            opening_hours="08:00 AM - 10:00 PM"
        )
        db.add(default_store)
        db.commit()
        db.refresh(default_store)
        print("Default store successfully seeded!")

    # 2. Seed Zones (1st: Entrance, 2nd: Bakery, 3rd: Beverages, 4th: Cooking Products)
    if db.query(Zone).filter(Zone.store_id == default_store.id).count() == 0:

        entrance_zone = Zone(name="Entrance", store_id=default_store.id, status="Optimal")
        bakery_zone = Zone(name="Bakery", store_id=default_store.id, status="Optimal")
        beverages_zone = Zone(name="Beverages", store_id=default_store.id, status="Busy")
        cooking_zone = Zone(name="Cooking Products", store_id=default_store.id, status="Optimal")
        billing_zone = Zone(name="Billing Counter", store_id=default_store.id, status="Busy")
        parking_zone = Zone(name="Parking", store_id=default_store.id, status="Optimal")

        db.add_all([entrance_zone, bakery_zone, beverages_zone, cooking_zone, billing_zone, parking_zone])
        db.commit()

        for z in [entrance_zone, bakery_zone, beverages_zone, cooking_zone, billing_zone, parking_zone]:
            db.refresh(z)

        print("Default zones successfully seeded!")

        # Shelves
        s1 = Shelf(
            label="Bakery Shelf B1",
            shelf_name="Bakery Shelf B1",
            store_id=default_store.id,
            zone_id=bakery_zone.id,
            occupancy_percentage=82.0,
            visitors_count=120,
            average_dwell_time=14.5,
            attention_score=85.0,
            shelf_status="Healthy"
        )

        s2 = Shelf(
            label="Beverage Shelf A1",
            shelf_name="Beverage Shelf A1",
            store_id=default_store.id,
            zone_id=beverages_zone.id,
            occupancy_percentage=78.0,
            visitors_count=142,
            average_dwell_time=18.5,
            attention_score=91.0,
            shelf_status="Healthy"
        )

        s3 = Shelf(
            label="Cooking Shelf C1",
            shelf_name="Cooking Shelf C1",
            store_id=default_store.id,
            zone_id=cooking_zone.id,
            occupancy_percentage=88.0,
            visitors_count=198,
            average_dwell_time=22.0,
            attention_score=94.0,
            shelf_status="Healthy"
        )

        db.add_all([s1, s2, s3])
        db.commit()
        db.refresh(s1)
        db.refresh(s2)
        db.refresh(s3)

        # Products
        p1 = Product(
            product_name="Bakery Product",
            shelf_id=s1.id,
            zone_id=bakery_zone.id,
            store_id=default_store.id,
            current_count=32,
            detected_count=32,
            available_count=50,
            stock_status="Healthy",
            product_health="Optimal"
        )
        p2 = Product(
            product_name="Beverage Product",
            shelf_id=s2.id,
            zone_id=beverages_zone.id,
            store_id=default_store.id,
            current_count=48,
            detected_count=48,
            available_count=60,
            stock_status="Healthy",
            product_health="Optimal"
        )
        p3 = Product(
            product_name="Cooking Product",
            shelf_id=s3.id,
            zone_id=cooking_zone.id,
            store_id=default_store.id,
            current_count=86,
            detected_count=86,
            available_count=100,
            stock_status="Healthy",
            product_health="Optimal"
        )
        db.add_all([p1, p2, p3])
        db.commit()

except Exception as e:
    print(f"Error seeding database: {e}")

finally:
    db.close()


from app.routers import auth, store as store_router, camera, analytics, marketing, retail_analyst, store_manager

app = FastAPI(
    title="Consumer Attention Mapping System API",
    description="Enterprise Retail Analytics Platform — Entrance, Bakery, Beverages, Cooking Products, Billing Counter & Parking",
    version="1.0.0",
)

os.makedirs("processed", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

app.mount("/processed", StaticFiles(directory="processed"), name="processed")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(store_router.router)
app.include_router(camera.router)
app.include_router(analytics.router)
app.include_router(marketing.router)
app.include_router(retail_analyst.router)
app.include_router(store_manager.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
