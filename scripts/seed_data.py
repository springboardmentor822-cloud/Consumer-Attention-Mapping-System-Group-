"""
Seeds the database with a working demo dataset:
  - 1 administrator user (admin@example.com / Admin123!)
  - 1 store with 3 zones (with real floor-plan coordinates) and 4 cameras
  - 1 shelf with 3 products
  - 5 synthetic shopper sessions with tracking points, attention events,
    and product interactions, so the scoring/heatmap/report endpoints
    have real data to compute over immediately after setup.

Run with:  python scripts/seed_data.py
(from the backend/ directory, with DATABASE_URL configured / containers up)
"""
import datetime as dt
import random
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.security import hash_password  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models.attention import AttentionEvent  # noqa: E402
from app.models.enums import (  # noqa: E402
    InteractionTypeEnum,
    RoleEnum,
)
from app.models.interaction import ProductInteraction  # noqa: E402
from app.models.product import Product, ProductCategory  # noqa: E402
from app.models.session import ShopperSession  # noqa: E402
from app.models.shelf import Shelf, ShelfCategory  # noqa: E402
from app.models.store import Store  # noqa: E402
from app.models.tracking import TrackingData  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.tracking_simulator import ensure_zones_and_cameras  # noqa: E402

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            full_name="Demo Administrator",
            email="admin@example.com",
            hashed_password=hash_password("Admin123!"),
            role=RoleEnum.ADMINISTRATOR,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created admin user: admin@example.com / Admin123!")

    store = db.query(Store).filter(Store.name == "Downtown Flagship Store").first()
    if not store:
        store = Store(
            name="Downtown Flagship Store",
            city="Metropolis",
            country="USA",
            floor_width_m=40.0,
            floor_height_m=25.0,
            manager_id=admin.id,
        )
        db.add(store)
        db.commit()
        db.refresh(store)
        print(f"Created store: {store.name} (id={store.id})")

    # Same 3-zone / 4-camera setup the live-tracking simulator and the
    # real detection pipeline use, complete with real polygon coordinates
    # for each zone - so the store-layout heatmap view has something
    # meaningful to render immediately, and every part of the app agrees
    # on this store's zones/cameras instead of seed data inventing its own.
    zones, cameras = ensure_zones_and_cameras(db, store.id)
    zone_entrance = zones[0]
    camera = cameras[0]

    shelf_category = db.query(ShelfCategory).filter(ShelfCategory.name == "Beverages").first()
    if not shelf_category:
        shelf_category = ShelfCategory(name="Beverages")
        db.add(shelf_category)
        db.commit()
        db.refresh(shelf_category)

    shelf = db.query(Shelf).filter(Shelf.store_id == store.id).first()
    if not shelf:
        shelf = Shelf(
            store_id=store.id,
            camera_id=camera.id,
            category_id=shelf_category.id,
            name="Shelf A1",
            aisle="1",
            shelf_width_m=2.5,
            shelf_height_m=1.8,
        )
        db.add(shelf)
        db.commit()
        db.refresh(shelf)
        print(f"Created shelf: {shelf.name} (id={shelf.id})")

    product_category = db.query(ProductCategory).filter(ProductCategory.name == "Soft Drinks").first()
    if not product_category:
        product_category = ProductCategory(name="Soft Drinks")
        db.add(product_category)
        db.commit()
        db.refresh(product_category)

    product_defs = [
        ("SKU-1001", "Cola Classic 500ml", "BrandX", 1.99),
        ("SKU-1002", "Orange Soda 500ml", "BrandX", 1.89),
        ("SKU-1003", "Sparkling Water 500ml", "BrandY", 1.49),
    ]
    products = []
    for sku, name, brand, price in product_defs:
        product = db.query(Product).filter(Product.sku == sku).first()
        if not product:
            product = Product(
                sku=sku,
                name=name,
                brand=brand,
                price=price,
                category_id=product_category.id,
                shelf_id=shelf.id,
            )
            db.add(product)
            db.commit()
            db.refresh(product)
        products.append(product)
    print(f"Ensured {len(products)} demo products exist.")

    # --- Synthetic behavior data (sessions, tracking, attention, interactions) ---
    existing_sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store.id).count()
    if existing_sessions == 0:
        now = dt.datetime.utcnow()
        for i in range(5):
            entry_time = now - dt.timedelta(hours=random.randint(1, 48))
            duration = random.randint(120, 900)
            session = ShopperSession(
                store_id=store.id,
                shopper_uid=str(uuid.uuid4()),
                entry_time=entry_time,
                exit_time=entry_time + dt.timedelta(seconds=duration),
                total_duration_seconds=duration,
                entry_zone_id=zone_entrance.id,
                zones_visited_count=random.randint(1, 4),
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            # a handful of tracking points across the floor plan
            for t in range(10):
                db.add(
                    TrackingData(
                        session_id=session.id,
                        camera_id=camera.id,
                        timestamp=entry_time + dt.timedelta(seconds=t * 20),
                        bbox_x=random.uniform(0, 1900),
                        bbox_y=random.uniform(0, 1000),
                        bbox_w=80,
                        bbox_h=180,
                        detection_confidence=round(random.uniform(0.7, 0.98), 2),
                        floor_x=random.uniform(0, store.floor_width_m),
                        floor_y=random.uniform(0, store.floor_height_m),
                        track_id=i + 1,
                    )
                )

            # attention + interaction events on random products
            for product in random.sample(products, k=random.randint(1, len(products))):
                attn_duration = round(random.uniform(2, 25), 2)
                attn_start = entry_time + dt.timedelta(seconds=random.randint(0, duration))
                event = AttentionEvent(
                    session_id=session.id,
                    shelf_id=shelf.id,
                    product_id=product.id,
                    camera_id=camera.id,
                    start_time=attn_start,
                    end_time=attn_start + dt.timedelta(seconds=attn_duration),
                    duration_seconds=attn_duration,
                    head_pose_yaw=round(random.uniform(-15, 15), 2),
                    head_pose_pitch=round(random.uniform(-10, 10), 2),
                )
                db.add(event)

                if random.random() > 0.4:
                    db.add(
                        ProductInteraction(
                            session_id=session.id,
                            product_id=product.id,
                            interaction_type=InteractionTypeEnum.PICKED_UP,
                            timestamp=attn_start + dt.timedelta(seconds=attn_duration + 1),
                        )
                    )
                    if random.random() > 0.5:
                        db.add(
                            ProductInteraction(
                                session_id=session.id,
                                product_id=product.id,
                                interaction_type=InteractionTypeEnum.PURCHASED,
                                timestamp=attn_start + dt.timedelta(seconds=attn_duration + 30),
                            )
                        )
            db.commit()
        print("Seeded 5 synthetic shopper sessions with tracking/attention/interaction data.")
    else:
        print("Shopper sessions already exist - skipping synthetic behavior seeding.")

    print("\nSeed complete. Log in with: admin@example.com / Admin123!")
    print(f"Store ID: {store.id} | Camera ID: {camera.id} | Shelf ID: {shelf.id}")
    print(f"Product IDs: {[p.id for p in products]}")

finally:
    db.close()
