import datetime
import uuid
import sys
import os

# Set sys.path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import Session
from app.core.db import engine, SessionLocal
from app.core.security import get_password_hash
from app.models.schemas import (
    Role, User, Store, Shelf, Camera, Product, 
    TrackingLog, InteractionLog, Recommendation, Notification, AuditLog
)

def seed_db():
    db = SessionLocal()
    try:
        print("Seeding database...")

        # 1. Seed Roles
        roles_data = [
            {"id": 1, "name": "Store Manager"},
            {"id": 2, "name": "Retail Analyst"},
            {"id": 3, "name": "Marketing Manager"},
            {"id": 4, "name": "Administrator"}
        ]
        for r in roles_data:
            role = db.query(Role).filter_by(id=r["id"]).first()
            if not role:
                role = Role(id=r["id"], name=r["name"])
                db.add(role)
        db.commit()
        print("Roles seeded.")

        # 2. Seed Users
        users_data = [
            {"email": "manager@store.com", "role_id": 1, "password": "password123"},
            {"email": "analyst@store.com", "role_id": 2, "password": "password123"},
            {"email": "marketing@store.com", "role_id": 3, "password": "password123"},
            {"email": "admin@store.com", "role_id": 4, "password": "password123"}
        ]
        for u in users_data:
            user = db.query(User).filter_by(email=u["email"]).first()
            if not user:
                hashed = get_password_hash(u["password"])
                user = User(email=u["email"], role_id=u["role_id"], hashed_password=hashed)
                db.add(user)
        db.commit()
        print("Users seeded.")

        # 3. Seed Store
        store_id = "flagship-store-001"
        store = db.query(Store).filter_by(id=store_id).first()
        if not store:
            store = Store(
                id=store_id,
                name="Metro Plaza Flagship Store",
                code="METRO-001",
                address="742 Evergreen Terrace, Springfield",
                width=100.0,
                height=100.0,
                is_active=True
            )
            db.add(store)
            db.commit()
        print("Store seeded.")

        # 4. Seed Shelves
        shelves_data = [
            {
                "id": "shelf-entrance-001",
                "store_id": store_id,
                "name": "Entrance Promo Display",
                "x": 50.0,
                "y": 50.0,
                "width": 200.0,
                "height": 300.0
            },
            {
                "id": "shelf-aisle3-001",
                "store_id": store_id,
                "name": "Aisle 3 Snack Shelf",
                "x": 100.0,
                "y": 150.0,
                "width": 250.0,
                "height": 300.0
            },
            {
                "id": "shelf-checkout-001",
                "store_id": store_id,
                "name": "Checkout Counter Impulse Rack",
                "x": 400.0,
                "y": 100.0,
                "width": 200.0,
                "height": 300.0
            }
        ]
        for sh in shelves_data:
            shelf = db.query(Shelf).filter_by(id=sh["id"]).first()
            if not shelf:
                shelf = Shelf(
                    id=sh["id"],
                    store_id=sh["store_id"],
                    name=sh["name"],
                    x=sh["x"],
                    y=sh["y"],
                    width=sh["width"],
                    height=sh["height"]
                )
                db.add(shelf)
        db.commit()
        print("Shelves seeded.")

        # 5. Seed Cameras
        cameras_data = [
            {"id": "cam-entrance-001", "store_id": store_id, "name": "Entrance Camera 1", "stream_url": "http://localhost:8000/datasets/videos/store_01/camera_01.mp4", "location_name": "Entrance", "x": 10.0, "y": 10.0, "is_active": True},
            {"id": "cam-aisle-002", "store_id": store_id, "name": "Aisle 3 Left Camera 2", "stream_url": "http://localhost:8000/datasets/videos/store_01/camera_02.mp4", "location_name": "Aisle 3 Left", "x": 20.0, "y": 30.0, "is_active": True},
            {"id": "cam-aisle-003", "store_id": store_id, "name": "Aisle 3 Right Camera 3", "stream_url": "http://localhost:8000/datasets/videos/store_01/camera_03.mp4", "location_name": "Aisle 3 Right", "x": 40.0, "y": 30.0, "is_active": True},
            {"id": "cam-checkout-004", "store_id": store_id, "name": "Checkout Lane Camera 4", "stream_url": "http://localhost:8000/datasets/videos/store_01/camera_04.mp4", "location_name": "Checkout", "x": 80.0, "y": 10.0, "is_active": True}
        ]
        for cam in cameras_data:
            camera = db.query(Camera).filter_by(id=cam["id"]).first()
            if not camera:
                camera = Camera(
                    id=cam["id"],
                    store_id=cam["store_id"],
                    name=cam["name"],
                    stream_url=cam["stream_url"],
                    location_name=cam["location_name"],
                    x=cam["x"],
                    y=cam["y"],
                    rotation_angle=0.0,
                    is_active=cam["is_active"]
                )
                db.add(camera)
            else:
                camera.stream_url = cam["stream_url"]
                camera.name = cam["name"]
        db.commit()
        print("Cameras seeded.")

        # 6. Seed Products
        products_data = [
            {"id": "prod-cola-001", "store_id": store_id, "name": "Classic Cola 500ml", "category": "Beverages", "sku": "BEV-COLA-01", "price": 1.99, "score": 82.5},
            {"id": "prod-chips-002", "store_id": store_id, "name": "Crunchy Potato Chips Lrg", "category": "Snacks", "sku": "SNK-CHIP-02", "price": 3.49, "score": 78.0},
            {"id": "prod-choc-003", "store_id": store_id, "name": "Gourmet Dark Chocolate Bar", "category": "Snacks", "sku": "SNK-CHOC-03", "price": 4.99, "score": 91.2},
            {"id": "prod-shamp-004", "store_id": store_id, "name": "Organic Aloe Vera Shampoo", "category": "Personal Care", "sku": "PC-SHMP-04", "price": 7.99, "score": 45.6},
            {"id": "prod-toothpaste-005", "store_id": store_id, "name": "Mint Fresh Whitening Toothpaste", "category": "Personal Care", "sku": "PC-TTH-05", "price": 2.99, "score": 62.4}
        ]
        for pr in products_data:
            product = db.query(Product).filter_by(id=pr["id"]).first()
            if not product:
                product = Product(
                    id=pr["id"],
                    store_id=pr["store_id"],
                    name=pr["name"],
                    category=pr["category"],
                    sku=pr["sku"],
                    price=pr["price"],
                    attractiveness_score=pr["score"]
                )
                db.add(product)
        db.commit()
        print("Products seeded.")


        # 7. Seed Tracking & Interaction Logs (Historical Simulation)
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        # Seed shopper tracking logs over the last 12 hours
        # Let's generate a list of shoppers and their coordinates
        if db.query(TrackingLog).count() == 0:
            print("Generating simulated historical logs...")
            shoppers = [f"shopper_{i}" for i in range(100, 150)]
            
            # Map tracking points across different zones
            # Zone 1 (Entrance), Zone 2 (Aisle 3 snack shelf), Zone 3 (Checkout)
            for i, shopper in enumerate(shoppers):
                # A shopper enters, stays in entrance for some time, goes to aisle, then goes to checkout
                shopper_entry_time = now - datetime.timedelta(hours=(i % 12), minutes=(i % 60))
                
                # Entrance (Zone 1)
                for step in range(5):
                    log = TrackingLog(
                        id=str(uuid.uuid4()),
                        timestamp=shopper_entry_time + datetime.timedelta(seconds=step*5),
                        shopper_id=shopper,
                        camera_id="cam-entrance-001",
                        zone_id=1,
                        x=100.0 + step * 20.0,
                        y=150.0 + (i % 10) * 10.0,
                        gaze_facing_shelf_id="shelf-entrance-001" if step in [2, 3] else None,
                        dwell_time=step * 5.0
                    )
                    db.add(log)
                
                # Aisle 3 (Zone 2)
                if i % 5 != 0: # 80% go to aisle
                    aisle_time = shopper_entry_time + datetime.timedelta(minutes=3)
                    for step in range(8):
                        log = TrackingLog(
                            id=str(uuid.uuid4()),
                            timestamp=aisle_time + datetime.timedelta(seconds=step*5),
                            shopper_id=shopper,
                            camera_id="cam-aisle-002",
                            zone_id=2,
                            x=150.0 + (i % 5) * 30.0,
                            y=200.0 + step * 15.0,
                            gaze_facing_shelf_id="shelf-aisle3-001" if step in [3, 4, 5] else None,
                            dwell_time=step * 5.0
                        )
                        db.add(log)
                        
                    # Add product interaction (Viewed / Picked Up / Returned)
                    product_id = "prod-chips-002" if i % 2 == 0 else "prod-choc-003"
                    if i % 3 == 0: # Picked up and purchased
                        int_log = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id=product_id,
                            shelf_id="shelf-aisle3-001",
                            interaction_type="pickup",
                            timestamp=aisle_time + datetime.timedelta(seconds=20)
                        )
                        db.add(int_log)
                        int_log_purch = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id=product_id,
                            shelf_id="shelf-aisle3-001",
                            interaction_type="purchased",
                            timestamp=aisle_time + datetime.timedelta(minutes=5)
                        )
                        db.add(int_log_purch)
                    elif i % 3 == 1: # Picked up and returned
                        int_log = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id=product_id,
                            shelf_id="shelf-aisle3-001",
                            interaction_type="pickup",
                            timestamp=aisle_time + datetime.timedelta(seconds=15)
                        )
                        db.add(int_log)
                        int_log_ret = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id=product_id,
                            shelf_id="shelf-aisle3-001",
                            interaction_type="returned",
                            timestamp=aisle_time + datetime.timedelta(seconds=35)
                        )
                        db.add(int_log_ret)
                    else: # Only viewed
                        int_log = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id=product_id,
                            shelf_id="shelf-aisle3-001",
                            interaction_type="viewed",
                            timestamp=aisle_time + datetime.timedelta(seconds=10)
                        )
                        db.add(int_log)

                # Checkout (Zone 3)
                if i % 2 == 0: # 50% checkout
                    checkout_time = shopper_entry_time + datetime.timedelta(minutes=8)
                    for step in range(6):
                        log = TrackingLog(
                            id=str(uuid.uuid4()),
                            timestamp=checkout_time + datetime.timedelta(seconds=step*10),
                            shopper_id=shopper,
                            camera_id="cam-checkout-004",
                            zone_id=3,
                            x=450.0 + (i % 4) * 20.0,
                            y=150.0 + step * 25.0,
                            gaze_facing_shelf_id="shelf-checkout-001" if step in [2, 3] else None,
                            dwell_time=step * 10.0
                        )
                        db.add(log)
                    
                    # Add checkout impulse pick
                    if i % 4 == 0:
                        int_log = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id="prod-cola-001",
                            shelf_id="shelf-checkout-001",
                            interaction_type="pickup",
                            timestamp=checkout_time + datetime.timedelta(seconds=30)
                        )
                        db.add(int_log)
                        int_log_purch = InteractionLog(
                            id=str(uuid.uuid4()),
                            shopper_id=shopper,
                            product_id="prod-cola-001",
                            shelf_id="shelf-checkout-001",
                            interaction_type="purchased",
                            timestamp=checkout_time + datetime.timedelta(seconds=40)
                        )
                        db.add(int_log_purch)
            db.commit()
            print("Simulated tracking and interaction logs generated.")

        # 8. Seed Recommendations
        recs_data = [
            {"store_id": store_id, "product_id": "prod-choc-003", "shelf_id": "shelf-aisle3-001", "text": "Dark chocolate bar has high view time but low shelf visibility. Consider moving it to the checkout impulse rack to double impulse sales."},
            {"store_id": store_id, "product_id": "prod-cola-001", "shelf_id": "shelf-checkout-001", "text": "Cola has high pickup rate at checkout. Restock frequency should be increased during peak traffic hours (5 PM - 7 PM)."},
            {"store_id": store_id, "product_id": "prod-shamp-004", "shelf_id": "shelf-aisle3-001", "text": "Shampoo is getting under 10s of attention. Adjust shelf placement to eye-level to boost brand visibility."}
        ]
        for rec in recs_data:
            existing = db.query(Recommendation).filter_by(recommendation_text=rec["text"]).first()
            if not existing:
                recommendation = Recommendation(
                    id=str(uuid.uuid4()),
                    store_id=rec["store_id"],
                    product_id=rec["product_id"],
                    shelf_id=rec["shelf_id"],
                    recommendation_text=rec["text"]
                )
                db.add(recommendation)
        db.commit()
        print("Recommendations seeded.")

        # 9. Seed Notifications
        notifications_data = [
            {"store_id": store_id, "type": "Camera", "message": "Camera 3 (Aisle 3 Right) connection jitter detected. Frame rate dropped to 2 FPS."},
            {"store_id": store_id, "type": "Traffic", "message": "Zone 3 (Checkout Lanes) is experiencing overcrowding. Average checkout queue delay exceeds 6 minutes."},
            {"store_id": store_id, "type": "Shelf", "message": "Entrance Promo Display attention duration has fallen by 40% compared to last week."}
        ]
        for nt in notifications_data:
            existing = db.query(Notification).filter_by(message=nt["message"]).first()
            if not existing:
                notification = Notification(
                    id=str(uuid.uuid4()),
                    store_id=nt["store_id"],
                    type=nt["type"],
                    message=nt["message"],
                    is_read=False
                )
                db.add(notification)
        db.commit()
        print("Notifications seeded.")

        # 10. Seed Audit Logs
        audit_data = [
            {"action": "ADMIN_LOGIN", "details": "Administrator logged in from system terminal."},
            {"action": "STORE_REGISTER", "details": "Metro Plaza Flagship Store created by administrator."},
            {"action": "CAMERA_ADD", "details": "Entrance Camera 1 added and linked to Zone 1."}
        ]
        for aud in audit_data:
            existing = db.query(AuditLog).filter_by(details=aud["details"]).first()
            if not existing:
                audit = AuditLog(
                    id=str(uuid.uuid4()),
                    action=aud["action"],
                    details=aud["details"]
                )
                db.add(audit)
        db.commit()
        print("Audit logs seeded.")

        print("Database seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
