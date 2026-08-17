"""
Comprehensive Seed Data Script for Consumer Attention Mapping System - MENTOR DEMO.
Seeds a specialized retail store: "CAMS SmartMart — Demo Store"
"""
import sys
from pathlib import Path
import random
import uuid
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete

# Ensure 'backend' package is importable
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from backend.app.core.database import SessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.role import Role
from backend.app.models.user import User
from backend.app.models.store import Store
from backend.app.models.camera import Camera
from backend.app.models.zone import Zone
from backend.app.models.shelf import Shelf
from backend.app.models.product import Product
from backend.app.models.product_score import ProductScore
from backend.app.models.tracking import ShopperSession, AttentionEvent, InteractionEvent, CoordinateLog
from backend.app.models.segmentation import ShopperSegment
from backend.app.models.journey import CustomerJourney
from backend.app.models.heatmap import HeatmapResult
from backend.app.models.recommendation import Recommendation
from backend.app.models.campaign import Campaign, Promotion
from backend.app.models.alert import Alert
from backend.app.models.audit_log import AuditLog
from backend.app.models.report import Report

random.seed(42)
NOW = datetime.now(timezone.utc)

STORE_NAME = "CAMS SmartMart — Demo Store"

def clean_old_demo_data(db):
    """Idempotent cleanup of old demo store"""
    existing_store_id = None
    # Delete ALL existing cameras globally to prevent '7 cameras online' bug
    db.execute(delete(Camera))
    
    store = db.scalar(select(Store).where(Store.store_name == STORE_NAME))
    if store:
        existing_store_id = store.id
        print(f"Cleaning up existing '{STORE_NAME}' to ensure fresh demo data...")
        db.delete(store)  # Cascades if set up, otherwise we might need explicit deletes
        db.commit()
    return existing_store_id

def run_seed():
    db = SessionLocal()
    try:
        print(f"Starting comprehensive demo data seed for {STORE_NAME}...")
        existing_store_id = clean_old_demo_data(db)

        # ── 1. Roles ──
        roles = {}
        for role_name in ["Administrator", "Store Manager", "Retail Analyst", "Marketing Manager"]:
            role = db.scalar(select(Role).where(Role.role_name == role_name))
            if role:
                roles[role_name] = role
        if len(roles) < 4:
            print("ERROR: Missing roles. Run migrations first.")
            return

        # ── 2. Users ──
        test_users = {
            "admin@consumerattention.com": ("Admin@123", "Administrator"),
            "manager@consumerattention.com": ("Manager@123", "Store Manager"),
            "analyst@consumerattention.com": ("Analyst@123", "Retail Analyst"),
            "marketing@consumerattention.com": ("Marketing@123", "Marketing Manager"),
        }
        user_objs = {}
        for email, (password, role_name) in test_users.items():
            existing = db.scalar(select(User).where(User.email == email))
            if existing:
                user_objs[role_name] = existing
                continue
            user = User(email=email, hashed_password=get_password_hash(password), role_id=roles[role_name].id, is_active=True)
            db.add(user)
            user_objs[role_name] = user
        db.commit()

        # ── 3. Store ──
        store = Store(store_name=STORE_NAME, location="Virtual Demo Environment")
        if existing_store_id:
            store.id = existing_store_id
        db.add(store)
        db.commit()

        # Assign store to ALL existing Manager, Analyst, and Marketing users (Global Backfill)
        target_role_names = ["Store Manager", "Retail Analyst", "Marketing Manager"]
        target_role_ids = [roles[r].id for r in target_role_names if r in roles]
        all_target_users = db.query(User).filter(User.role_id.in_(target_role_ids)).all()
        for u in all_target_users:
            u.store_id = store.id
        db.commit()
        print(f"Created Store: {STORE_NAME}")

        # ── 4. Cameras ──
        cam = Camera(store_id=store.id, camera_name="CAM-01 — Live Webcam", camera_source="0", status="active")
        db.add(cam)
        db.commit()
        print("Seeded 1 camera (Live Webcam)")

        # ── 5. Zones ──
        # Webcam-friendly zones: 3 vertical sections that map to left/center/right of webcam frame.
        # These also serve as conceptual store zones for the demo.
        zone_data = [
            {"name": "Left Section — Entrance",    "coords": {"x_min": 0,  "y_min": 0, "x_max": 33,  "y_max": 100}},
            {"name": "Center Section — Aisles",     "coords": {"x_min": 33, "y_min": 0, "x_max": 66,  "y_max": 100}},
            {"name": "Right Section — Checkout",    "coords": {"x_min": 66, "y_min": 0, "x_max": 100, "y_max": 100}},
        ]
        zones = {}
        for zd in zone_data:
            z = Zone(store_id=store.id, zone_name=zd["name"], coordinates=zd["coords"])
            db.add(z)
            zones[zd["name"]] = z
        db.commit()
        print(f"Seeded {len(zones)} zones (webcam-friendly layout)")

        # ── 6. Shelves & Products ──
        products_setup = {
            "Fresh Produce Display": {"prods": [("Organic Apples", 4.99), ("Bananas", 1.29), ("Avocados", 3.99)], "coords": {"x_min": 5, "y_min": 10, "x_max": 25, "y_max": 40}},
            "Promotion Endcap": {"prods": [("Energy Drink Multipack", 8.99), ("Assorted Chocolates", 5.99)], "coords": {"x_min": 5, "y_min": 50, "x_max": 25, "y_max": 80}},
            "Dry Grocery Shelf": {"prods": [("Pasta", 2.99), ("Rice", 5.49), ("Flour", 3.29)], "coords": {"x_min": 40, "y_min": 10, "x_max": 55, "y_max": 30}},
            "Canned Foods Shelf": {"prods": [("Baked Beans", 1.99), ("Canned Tomatoes", 1.49), ("Soup", 2.49)], "coords": {"x_min": 40, "y_min": 40, "x_max": 55, "y_max": 60}},
            "Snacks Shelf": {"prods": [("Potato Chips", 3.99), ("Tortilla Chips", 3.49), ("Pretzels", 2.99)], "coords": {"x_min": 40, "y_min": 70, "x_max": 55, "y_max": 90}},
            "Dairy Refrigerator": {"prods": [("Whole Milk", 3.49), ("Cheddar Cheese", 4.99), ("Yogurt", 1.19)], "coords": {"x_min": 65, "y_min": 10, "x_max": 80, "y_max": 40}},
            "Checkout Display": {"prods": [("Gum", 1.49), ("Mints", 1.99)], "coords": {"x_min": 75, "y_min": 60, "x_max": 95, "y_max": 80}}
        }
        shelves = []
        products = []
        for shelf_name, data in products_setup.items():
            prods = data["prods"]
            coords = data["coords"]
            s = Shelf(store_id=store.id, shelf_name=shelf_name, zone_coordinates=coords)
            db.add(s)
            db.flush()
            shelves.append(s)
            for pn, price in prods:
                p = Product(product_name=pn, shelf_id=s.id, sku=f"SKU-{uuid.uuid4().hex[:6].upper()}", category="Groceries", price=price)
                db.add(p)
                db.flush()
                ps = ProductScore(
                    product_id=p.id, 
                    store_id=store.id, 
                    attractiveness_score=random.uniform(50, 95),
                    shelf_visibility_score=random.uniform(60, 100),
                    engagement_score=random.uniform(40, 90),
                    conversion_potential_score=random.uniform(30, 85),
                    metrics={"views": random.randint(50, 200)}
                )
                db.add(ps)
                products.append(p)
        db.commit()
        print(f"Seeded {len(shelves)} shelves and {len(products)} products")

        # ── 7. Shopper Personas & Journeys ──
        personas = [
            {"seg": "Explorer", "path": ["Store Entrance", "Produce / Fresh", "Dairy & Deli", "Aisle 3 — Snacks", "Promotion Endcap", "Checkout Lanes", "Exit"]},
            {"seg": "Quick Buyer", "path": ["Store Entrance", "Aisle 1 — Dry Grocery", "Aisle 3 — Snacks", "Checkout Lanes", "Exit"]},
            {"seg": "Comparison Shopper", "path": ["Store Entrance", "Aisle 3 — Snacks", "Promotion Endcap", "Aisle 3 — Snacks", "Checkout Lanes", "Exit"]},
            {"seg": "Impulse Buyer", "path": ["Store Entrance", "Promotion Endcap", "Checkout Lanes", "Exit"]},
            {"seg": "Brand Loyal Customer", "path": ["Store Entrance", "Dairy & Deli", "Checkout Lanes", "Exit"]},
        ]
        
        sessions = []
        for i in range(150): # 150 historical sessions
            persona = random.choice(personas)
            start_time = NOW - timedelta(days=random.uniform(0, 14), hours=random.uniform(0, 12))
            
            # Generate realistic dwell times
            zone_dwells = {}
            for z in persona["path"]:
                if "Entrance" in z or "Exit" in z: zone_dwells[z] = random.uniform(2, 10)
                elif "Checkout" in z: zone_dwells[z] = random.uniform(15, 60)
                elif "Comparison" in persona["seg"] and "Snacks" in z: zone_dwells[z] = random.uniform(30, 90)
                else: zone_dwells[z] = random.uniform(10, 45)
            
            total_dwell = sum(zone_dwells.values())
            end_time = start_time + timedelta(seconds=total_dwell)
            
            session = ShopperSession(id=uuid.uuid4(), store_id=store.id, start_time=start_time, end_time=end_time)
            db.add(session)
            sessions.append((session, persona, zone_dwells))
        db.commit()

        # Build segments and journeys
        for session, persona, zone_dwells in sessions:
            seg = ShopperSegment(
                session_id=session.id, store_id=store.id, segment=persona["seg"], confidence=round(random.uniform(0.7, 0.99), 2),
                metrics={"dwell_time": sum(zone_dwells.values()), "zones_visited": len(persona["path"])},
                reason="Auto-classified by behavioral analysis engine."
            )
            db.add(seg)
            
            journey = CustomerJourney(
                session_id=session.id, store_id=store.id, entry_point=persona["path"][0], exit_point=persona["path"][-1],
                zones_visited=list(set(persona["path"])), zone_transition_sequence=persona["path"],
                total_dwell_time_seconds=sum(zone_dwells.values()), zone_dwell_times=zone_dwells,
                path_length=len(persona["path"]) * 12.5, visit_frequency=random.randint(1, 4),
                product_interaction_count=random.randint(0, 5), pickup_count=random.randint(0, 3), return_count=random.randint(0, 1),
                conversion_status=random.random() > 0.3
            )
            db.add(journey)
            
            # Seed Interactions and Attention
            for _ in range(random.randint(0, 4)):
                prod = random.choice(products)
                ie = InteractionEvent(session_id=session.id, product_id=prod.id, interaction_type=random.choice(["VIEWED", "PICKED_UP", "PURCHASED"]), timestamp=session.start_time + timedelta(seconds=random.randint(10, 30)))
                db.add(ie)
                
            for _ in range(random.randint(0, 3)):
                prod = random.choice(products)
                ae = AttentionEvent(session_id=session.id, target_type="PRODUCT", target_id=prod.id, gaze_duration_seconds=round(random.uniform(1.0, 15.0), 2), timestamp=session.start_time + timedelta(seconds=random.randint(5, 40)))
                db.add(ae)

        db.commit()
        print(f"Seeded {len(sessions)} Shopper Sessions with Segments, Journeys, Interactions, and Attention")

        # ── 8. Product Scores (Attractiveness Calculation) ──
        # Formula: 0.35*Attention + 0.25*Interaction + 0.20*Pickup + 0.15*Purchase + 0.05*Repeat
        for prod in products:
            att = random.uniform(40, 95)
            score = ProductScore(
                product_id=prod.id, store_id=store.id,
                attractiveness_score=round(att, 1),
                shelf_visibility_score=round(random.uniform(50, 90), 1),
                engagement_score=round(att * 0.9, 1),
                conversion_potential_score=round(att * 0.8, 1),
                marketing_effectiveness_score=round(random.uniform(30, 85), 1),
                metrics={"attention_duration": 100, "interaction_frequency": 50, "pickup_count": 20, "purchase_count": 10, "repeat_views": 5}
            )
            db.add(score)
        db.commit()

        # ── 9. Coordinate Logs (for Heatmap) ──
        # Let's generate a dense cluster around specific zones for a realistic heatmap
        print("Generating Heatmap coordinates...")
        available_zones = list(zones.values())
        coord_logs = []
        for i in range(2500):
            # 60% chance to be in a hot zone, 40% random
            if random.random() < 0.6 and available_zones:
                weights = [1] * len(available_zones)
                if len(available_zones) == 3:
                    weights = [1, 2, 1.5] # Give Center and Right slightly more density
                hz = random.choices(available_zones, weights=weights, k=1)[0].coordinates
                x = random.uniform(float(hz.get("x_min",0)), float(hz.get("x_max",100)))
                y = random.uniform(float(hz.get("y_min",0)), float(hz.get("y_max",100)))
            else:
                x = random.uniform(5, 95)
                y = random.uniform(5, 95)
            
            log = CoordinateLog(
                store_id=store.id,
                camera_id=cam.id,
                shopper_id=f"Simulated-{i}",
                x=round(x, 2),
                y=round(y, 2),
                timestamp=NOW - timedelta(minutes=random.randint(1, 1440))
            )
            coord_logs.append(log)
        db.bulk_save_objects(coord_logs)
        db.commit()
        print(f"Seeded 2500 CoordinateLogs for authentic spatial heatmap generation")

        # ── 10. Campaigns & Promotions ──
        camp = Campaign(
            store_id=store.id, name="Weekend Snack Promotion", description="Promote family-sized snack packages.",
            campaign_type="conversion", status="active", start_date=NOW-timedelta(days=2), end_date=NOW+timedelta(days=5),
            budget=1500.0, impressions=4500, clicks=1200, conversions=450, revenue=5400.0,
            metrics={"ctr": 26.6, "conversion_rate": 37.5, "roas": 3.6}
        )
        db.add(camp)
        db.flush()
        promo = Promotion(store_id=store.id, campaign_id=camp.id, product_id=products[4].id, name="Buy 2 Get 1 Free Chips", promotion_type="bogo", is_active=True, views=2800, interactions=650, conversions=180, start_date=NOW-timedelta(days=2), end_date=NOW+timedelta(days=5))
        db.add(promo)
        db.commit()

        # ── 11. Recommendations & Alerts ──
        rec1 = Recommendation(store_id=store.id, recommendation_type="shelf_placement", title="Snacks Shelf receives high attention but below-average conversion", description="Review pricing or product arrangement.", reason="High traffic, low pickup.", supporting_metric="Conversion Rate: 12%", expected_impact="+15% Conversion", priority="high")
        rec2 = Recommendation(store_id=store.id, recommendation_type="layout", title="Checkout Lane Bottleneck", description="Checkout Lane experiences high traffic concentration.", reason="Traffic anomaly.", supporting_metric="Queue Time: >5m", expected_impact="Reduced wait times", priority="critical")
        db.add_all([rec1, rec2])
        
        alert1 = Alert(store_id=store.id, alert_type="traffic_anomaly", severity="warning", message="Unusual crowd concentration detected near Checkout.", status="open")
        alert2 = Alert(store_id=store.id, alert_type="product_visibility", severity="info", message="Snacks Shelf visibility below store average.", status="open")
        db.add_all([alert1, alert2])
        
        # ── 12. Security Audit Logs ──
        logs = [
            AuditLog(user_id=user_objs["Administrator"].id, action="login", resource="auth", details={"ip": "192.168.1.1"}, ip_address="192.168.1.1", created_at=NOW - timedelta(hours=5)),
            AuditLog(user_id=user_objs["Administrator"].id, action="update", resource="store", details={"store": STORE_NAME}, ip_address="192.168.1.1", created_at=NOW - timedelta(hours=4)),
            AuditLog(user_id=user_objs["Store Manager"].id, action="login", resource="auth", details={"ip": "10.0.0.5"}, ip_address="10.0.0.5", created_at=NOW - timedelta(hours=3)),
            AuditLog(user_id=user_objs["Retail Analyst"].id, action="generate_report", resource="reports", details={"type": "weekly_performance"}, ip_address="10.0.0.12", created_at=NOW - timedelta(hours=2)),
            AuditLog(user_id=user_objs["Marketing Manager"].id, action="create_campaign", resource="campaigns", details={"name": "Weekend Snack Promotion"}, ip_address="10.0.0.8", created_at=NOW - timedelta(hours=1))
        ]
        db.add_all(logs)
        db.commit()

        print("\nDEMO SEEDING COMPLETE! The 'CAMS SmartMart' environment is ready for the mentor demo.")
        print("  Admin:     admin@consumerattention.com / Admin@123")
        print("  Manager:   manager@consumerattention.com / Manager@123")
        
        # Export environment variables for the batch script
        with open(".demo_env.bat", "w") as f:
            f.write(f'set "CAMS_STORE_ID={store.id}"\n')
            f.write(f'set "CAMS_CAMERA_ID={cam.id}"\n')

    except Exception as e:
        db.rollback()
        print(f"\nDemo Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
