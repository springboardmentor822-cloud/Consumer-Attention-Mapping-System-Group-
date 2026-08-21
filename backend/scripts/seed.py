import os
import sys
import datetime
import random

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db import Base, engine, SessionLocal
from app.models.models import (
    Organization, Store, User, Camera, Zone, Shelf, Product,
    ShopperSession, TrajectoryPoint, ZoneVisit, ProductInteraction, Purchase,
    Campaign, Recommendation, AuditLog, SystemMetric
)

def seed_database():
    print("Creating Database Tables & Initializing Schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Seeding Organization & Store Boundary...")
        org = Organization(id="ORG-001", name="Parvath Global Retail Enterprises")
        db.add(org)

        store = Store(
            id="STORE-812",
            org_id="ORG-001",
            name="Metro Flagship Superstore #812",
            location="Downtown Tech Corridor",
            map_width=1000.0,
            map_height=800.0
        )
        db.add(store)
        db.commit()

        print("Seeding Platform Users across 4 Roles...")
        users = [
            User(id="USR-001", email="manager@retail.com", hashed_password="password123", full_name="Lathashree", role="STORE_MANAGER", store_id="STORE-812"),
            User(id="USR-002", email="analyst@retail.com", hashed_password="password123", full_name="Vivek Prasad", role="RETAIL_ANALYST", store_id="STORE-812"),
            User(id="USR-003", email="marketing@retail.com", hashed_password="password123", full_name="Monika", role="MARKETING_MANAGER", store_id="STORE-812"),
            User(id="USR-004", email="admin@retail.com", hashed_password="password123", full_name="Parvathraj", role="ADMINISTRATOR", store_id="STORE-812")
        ]
        db.add_all(users)

        print("Seeding Camera Feeds & Homography Setup...")
        cameras = [
            Camera(id="CAM-01", store_id="STORE-812", name="Entrance Main Overview", status="ONLINE", ip_address="192.168.1.101", resolution="1920x1080"),
            Camera(id="CAM-02", store_id="STORE-812", name="AI Employee Productivity Tracker", status="ONLINE", ip_address="192.168.1.102", resolution="1920x1080"),
            Camera(id="CAM-03", store_id="STORE-812", name="Deep Learning Theft & Shoplifting Detector", status="ONLINE", ip_address="192.168.1.103", resolution="1920x1080"),
            Camera(id="CAM-04", store_id="STORE-812", name="AI Video Analytics Shoplifting Prevention", status="ONLINE", ip_address="192.168.1.104", resolution="1920x1080"),
            Camera(id="CAM-05", store_id="STORE-812", name="AI Shoplifter Prevention Camera", status="ONLINE", ip_address="192.168.1.105", resolution="1920x1080"),
            Camera(id="CAM-06", store_id="STORE-812", name="Store Exit Gate Area Security", status="ONLINE", ip_address="192.168.1.106", resolution="1920x1080")
        ]
        db.add_all(cameras)

        print("Seeding Store Zones...")
        zones_data = [
            {"id": "ZONE-BEVERAGES", "name": "Beverages & Hydration", "category": "Beverages", "poly": [[100, 100], [450, 100], [450, 350], [100, 350]]},
            {"id": "ZONE-SNACKS", "name": "Artisanal Snacks & Chips", "category": "Snacks", "poly": [[500, 100], [900, 100], [900, 350], [500, 350]]},
            {"id": "ZONE-PRODUCE", "name": "Fresh Organic Produce", "category": "Produce", "poly": [[100, 400], [450, 400], [450, 700], [100, 700]]},
            {"id": "ZONE-DAIRY", "name": "Dairy & Cold Drinks", "category": "Dairy", "poly": [[500, 400], [900, 400], [900, 700], [500, 700]]}
        ]
        for zd in zones_data:
            db.add(Zone(id=zd["id"], store_id="STORE-812", name=zd["name"], category=zd["category"], polygon_coords=zd["poly"]))

        print("Seeding Shelves & Planogram Regions...")
        shelves_data = [
            {"id": "SHELF-01", "name": "Shelf A1 (Energy Drinks)", "zone_id": "ZONE-BEVERAGES", "coords": {"x": 120, "y": 120, "width": 280, "height": 80}, "level": "EYE_LEVEL"},
            {"id": "SHELF-02", "name": "Shelf A2 (Sparkling Water)", "zone_id": "ZONE-BEVERAGES", "coords": {"x": 120, "y": 220, "width": 280, "height": 80}, "level": "MIDDLE"},
            {"id": "SHELF-03", "name": "Shelf B1 (Artisanal Chips)", "zone_id": "ZONE-SNACKS", "coords": {"x": 520, "y": 120, "width": 320, "height": 80}, "level": "BOTTOM"},
            {"id": "SHELF-04", "name": "Shelf B2 (Organic Nuts)", "zone_id": "ZONE-SNACKS", "coords": {"x": 520, "y": 220, "width": 320, "height": 80}, "level": "EYE_LEVEL"},
            {"id": "SHELF-05", "name": "Shelf C1 (Organic Milk)", "zone_id": "ZONE-DAIRY", "coords": {"x": 520, "y": 420, "width": 320, "height": 80}, "level": "EYE_LEVEL"}
        ]
        for sd in shelves_data:
            db.add(Shelf(id=sd["id"], store_id="STORE-812", zone_id=sd["zone_id"], name=sd["name"], planogram_coords=sd["coords"], level=sd["level"]))

        print("Seeding Product SKU Catalog...")
        products_data = [
            {"id": "PROD-101", "sku": "SKU-101", "name": "HydroSpark Citrus Energy 500ml", "category": "Beverages", "price": 3.99, "shelf_id": "SHELF-01", "pos": "EYE_LEVEL"},
            {"id": "PROD-102", "sku": "SKU-102", "name": "Volt Zero Sugar Lime", "category": "Beverages", "price": 3.49, "shelf_id": "SHELF-01", "pos": "MIDDLE"},
            {"id": "PROD-103", "sku": "SKU-103", "name": "Artisanal Sea Salt Kettle Chips", "category": "Snacks", "price": 4.29, "shelf_id": "SHELF-03", "pos": "BOTTOM"},
            {"id": "PROD-104", "sku": "SKU-104", "name": "Keto Crunch Roasted Almonds", "category": "Snacks", "price": 6.99, "shelf_id": "SHELF-04", "pos": "EYE_LEVEL"},
            {"id": "PROD-105", "sku": "SKU-105", "name": "Pure Valley Organic Whole Milk", "category": "Dairy", "price": 5.49, "shelf_id": "SHELF-05", "pos": "EYE_LEVEL"}
        ]
        for pd in products_data:
            db.add(Product(id=pd["id"], sku=pd["sku"], name=pd["name"], category=pd["category"], price=pd["price"], shelf_id=pd["shelf_id"], position_on_shelf=pd["pos"]))

        db.commit()

        print("Seeding Shopper Sessions with Trajectories & Interactions...")
        segments = ["Explorers", "Quick Buyers", "Comparison Shoppers", "Impulse Buyers", "Brand Loyal Customers"]
        
        for i in range(1, 25):
            sess_id = f"SES-{1000 + i}"
            shopper_id = f"SHOP-{800 + i}"
            segment = random.choice(segments)
            dwell = random.randint(120, 600)
            distance = round(random.uniform(40.0, 180.0), 2)

            start_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=random.randint(1, 12), minutes=random.randint(0, 59))
            end_time = start_time + datetime.timedelta(seconds=dwell)

            sess = ShopperSession(
                id=sess_id,
                store_id="STORE-812",
                shopper_id=shopper_id,
                start_time=start_time,
                end_time=end_time,
                total_dwell=float(dwell),
                path_distance=distance,
                segment=segment
            )
            db.add(sess)

            # Generate smooth trajectory points
            start_x, start_y = 150.0 + random.randint(0, 100), 50.0
            cur_x, cur_y = start_x, start_y

            for t in range(0, min(dwell, 40), 2):
                cur_x += random.uniform(-15.0, 20.0)
                cur_y += random.uniform(10.0, 25.0)
                
                pt = TrajectoryPoint(
                    session_id=sess_id,
                    timestamp=start_time + datetime.timedelta(seconds=t),
                    camera_id="CAM-01",
                    x=round(cur_x + random.uniform(-2, 2), 2),
                    y=round(cur_y + random.uniform(-2, 2), 2),
                    smoothed_x=round(cur_x, 2),
                    smoothed_y=round(cur_y, 2),
                    velocity=round(random.uniform(0.5, 1.8), 2),
                    zone_id="ZONE-BEVERAGES" if cur_y < 350 else "ZONE-PRODUCE"
                )
                db.add(pt)

            # Generate product interaction
            prod = random.choice(products_data)
            interaction = ProductInteraction(
                session_id=sess_id,
                product_id=prod["id"],
                shelf_id=prod["shelf_id"],
                interaction_type=random.choice(["VIEW", "PICKUP", "RETURN", "COMPARE"]),
                duration=round(random.uniform(3.0, 25.0), 1),
                timestamp=start_time + datetime.timedelta(seconds=30)
            )
            db.add(interaction)

            # Generate checkout purchase for conversion
            if random.random() > 0.4:
                purchase = Purchase(
                    session_id=sess_id,
                    product_id=prod["id"],
                    quantity=random.randint(1, 3),
                    amount=prod["price"],
                    timestamp=start_time + datetime.timedelta(seconds=dwell - 10)
                )
                db.add(purchase)

        print("Seeding Campaigns & Merchandising Recommendations...")
        campaigns = [
            Campaign(id="CAMP-01", store_id="STORE-812", name="Summer Refresh Hydration Promo", target_category="Beverages", start_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7), end_date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=14), status="ACTIVE", lift_percentage=52.4),
            Campaign(id="CAMP-02", store_id="STORE-812", name="Artisanal Snack Launch Campaign", target_category="Snacks", start_date=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3), end_date=datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=10), status="ACTIVE", lift_percentage=39.0)
        ]
        db.add_all(campaigns)

        recs = [
            Recommendation(id="REC-01", priority="HIGH", store_id="STORE-812", sku="SKU-103", shelf_id="SHELF-03", action="Move product toward eye-level", reason="High product attractiveness (Score: 78.4) restricted by bottom-shelf placement", expected_conversion_uplift=22.4),
            Recommendation(id="REC-02", priority="HIGH", store_id="STORE-812", sku="SKU-102", shelf_id="SHELF-01", action="Packaging / pricing check", reason="High shopper attention duration (score: 82.0) but low pickup conversion (score: 34.2)", expected_conversion_uplift=14.5),
            Recommendation(id="REC-03", priority="MEDIUM", store_id="STORE-812", sku="SKU-04", shelf_id="SHELF-04", action="Quality / pricing inspection", reason="High shelf pickup rate (score: 74.5) but low checkout conversion (score: 31.0)", expected_conversion_uplift=18.2)
        ]
        db.add_all(recs)

        print("Seeding Audit Logs & System Metrics...")
        logs = [
            AuditLog(user_id="admin@retail.com", action="SYSTEM_INIT", endpoint="/api/v1/system/status", details="Initial database creation & schema setup"),
            AuditLog(user_id="manager@retail.com", action="LOGIN_SUCCESS", endpoint="/api/v1/auth/login", details="Store Manager authenticated with email/password")
        ]
        db.add_all(logs)

        db.commit()
        print("Database Created & Seeded Successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
