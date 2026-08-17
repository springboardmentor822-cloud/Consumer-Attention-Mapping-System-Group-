"""
Comprehensive Seed Data Script for Consumer Attention Mapping System.
Seeds stores, zones, shelves, products, users (4 roles), shopper sessions,
coordinate logs, attention events, interaction events, segments, journeys,
product scores, heatmap results, recommendations, campaigns, promotions, alerts, and audit logs.
"""
import sys
from pathlib import Path

# Ensure 'backend' package is importable regardless of working directory
_project_root = Path(__file__).resolve().parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from backend.app.core.database import SessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.role import Role
from backend.app.models.user import User
from backend.app.models.store import Store
from backend.app.models.camera import Camera
from backend.app.models.zone import Zone
from backend.app.models.shelf import Shelf
from backend.app.models.product import Product
from backend.app.models.tracking import ShopperSession, AttentionEvent, InteractionEvent, CoordinateLog
from backend.app.models.segmentation import ShopperSegment
from backend.app.models.journey import CustomerJourney
from backend.app.models.heatmap import HeatmapResult
from backend.app.models.product_score import ProductScore
from backend.app.models.recommendation import Recommendation
from backend.app.models.campaign import Campaign, Promotion
from backend.app.models.alert import Alert
from backend.app.models.audit_log import AuditLog
from backend.app.models.report import Report


random.seed(42)
NOW = datetime.now(timezone.utc)


def run_seed():
    db = SessionLocal()
    try:
        print("🚀 Starting comprehensive data seed...")

        # ── 1. Roles (should already exist) ──
        roles = {}
        for role_name in ["Administrator", "Store Manager", "Retail Analyst", "Marketing Manager"]:
            role = db.scalar(select(Role).where(Role.role_name == role_name))
            if role:
                roles[role_name] = role
        print(f"  ✅ Found {len(roles)} roles")

        if len(roles) < 4:
            print("  ❌ Missing roles. Ensure migrations are run first.")
            return

        # ── 2. Users (one per role) ──
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
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                role_id=roles[role_name].id,
                is_active=True,
            )
            db.add(user)
            user_objs[role_name] = user
        db.commit()
        print(f"  ✅ Seeded {len(test_users)} users")

        # ── 3. Stores ──
        store_data = [
            {"name": "Downtown Hypermarket", "location": "123 Main Street, Downtown"},
            {"name": "Uptown Mall Outlet", "location": "456 Mall Road, Uptown"},
            {"name": "Suburban Megastore", "location": "789 Green Ave, Suburbs"},
        ]
        stores = []
        for sd in store_data:
            existing = db.scalar(select(Store).where(Store.store_name == sd["name"]))
            if existing:
                stores.append(existing)
                continue
            store = Store(store_name=sd["name"], location=sd["location"])
            db.add(store)
            stores.append(store)
        db.commit()

        # Assign store to Store Manager
        mgr = user_objs.get("Store Manager")
        if mgr and stores:
            mgr.store_id = stores[0].id
            db.commit()
        print(f"  ✅ Seeded {len(stores)} stores")

        primary_store = stores[0]

        # ── 4. Cameras ──
        camera_names = ["Entrance Camera", "Aisle 1 Camera", "Produce Section Camera", "Checkout Camera", "Bakery Camera"]
        cameras = []
        for cn in camera_names:
            existing = db.scalar(select(Camera).where(Camera.camera_name == cn, Camera.store_id == primary_store.id))
            if existing:
                cameras.append(existing)
                continue
            cam = Camera(store_id=primary_store.id, camera_name=cn, camera_source="rtsp://simulated", status="active")
            db.add(cam)
            cameras.append(cam)
        db.commit()
        print(f"  ✅ Seeded {len(cameras)} cameras")

        # ── 5. Zones ──
        zone_data = [
            {"name": "Entrance", "coords": {"x_min": 0, "y_min": 0, "x_max": 20, "y_max": 100}},
            {"name": "Beverages Aisle", "coords": {"x_min": 20, "y_min": 0, "x_max": 40, "y_max": 50}},
            {"name": "Snacks Aisle", "coords": {"x_min": 20, "y_min": 50, "x_max": 40, "y_max": 100}},
            {"name": "Produce Section", "coords": {"x_min": 40, "y_min": 0, "x_max": 70, "y_max": 100}},
            {"name": "Checkout", "coords": {"x_min": 70, "y_min": 0, "x_max": 90, "y_max": 100}},
            {"name": "Exit", "coords": {"x_min": 90, "y_min": 0, "x_max": 100, "y_max": 100}},
        ]
        zones = []
        for zd in zone_data:
            existing = db.scalar(select(Zone).where(Zone.zone_name == zd["name"], Zone.store_id == primary_store.id))
            if existing:
                zones.append(existing)
                continue
            zone = Zone(store_id=primary_store.id, zone_name=zd["name"], coordinates=zd["coords"])
            db.add(zone)
            zones.append(zone)
        db.commit()
        print(f"  ✅ Seeded {len(zones)} zones")

        # ── 6. Shelves ──
        shelf_data = [
            "Premium Beverage Shelf", "Economy Beverage Shelf",
            "Chips & Crackers Shelf", "Candy & Chocolate Shelf",
            "Fresh Produce Display", "Organic Produce Display",
            "Bakery Showcase",
        ]
        shelves = []
        for sn in shelf_data:
            existing = db.scalar(select(Shelf).where(Shelf.shelf_name == sn, Shelf.store_id == primary_store.id))
            if existing:
                shelves.append(existing)
                continue
            shelf = Shelf(
                store_id=primary_store.id,
                shelf_name=sn,
                zone_coordinates={"x_min": random.randint(10, 80), "y_min": random.randint(10, 80), "x_max": random.randint(50, 95), "y_max": random.randint(50, 95)}
            )
            db.add(shelf)
            shelves.append(shelf)
        db.commit()
        print(f"  ✅ Seeded {len(shelves)} shelves")

        # ── 7. Products ──
        product_data = [
            ("Premium Coffee Blend", shelves[0] if len(shelves) > 0 else None),
            ("Sparkling Water 500ml", shelves[0] if len(shelves) > 0 else None),
            ("Fresh Orange Juice 1L", shelves[1] if len(shelves) > 1 else None),
            ("Energy Drink Can", shelves[1] if len(shelves) > 1 else None),
            ("Artisan Potato Chips", shelves[2] if len(shelves) > 2 else None),
            ("Whole Grain Crackers", shelves[2] if len(shelves) > 2 else None),
            ("Dark Chocolate Bar", shelves[3] if len(shelves) > 3 else None),
            ("Gummy Bears Pack", shelves[3] if len(shelves) > 3 else None),
            ("Organic Avocados", shelves[4] if len(shelves) > 4 else None),
            ("Fresh Strawberries", shelves[4] if len(shelves) > 4 else None),
            ("Organic Kale Bundle", shelves[5] if len(shelves) > 5 else None),
            ("Sourdough Bread Loaf", shelves[6] if len(shelves) > 6 else None),
        ]
        products = []
        for pn, shelf in product_data:
            if not shelf:
                continue
            existing = db.scalar(select(Product).where(Product.product_name == pn, Product.shelf_id == shelf.id))
            if existing:
                products.append(existing)
                continue
            prod = Product(
                product_name=pn, 
                shelf_id=shelf.id,
                sku=f"SKU-{uuid.uuid4().hex[:8].upper()}",
                category="Groceries",
                price=round(random.uniform(2.99, 29.99), 2)
            )
            db.add(prod)
            products.append(prod)
        db.commit()
        print(f"  ✅ Seeded {len(products)} products")

        # ── 8. Shopper Sessions (50 sessions over last 7 days) ──
        sessions = []
        for i in range(50):
            start = NOW - timedelta(days=random.uniform(0, 7), hours=random.uniform(0, 12))
            duration = random.randint(60, 600)
            end = start + timedelta(seconds=duration)
            sess_id = uuid.uuid4()
            session = ShopperSession(
                id=sess_id,
                store_id=primary_store.id,
                start_time=start,
                end_time=end,
            )
            db.add(session)
            sessions.append(session)
        db.commit()
        print(f"  ✅ Seeded {len(sessions)} shopper sessions")

        # ── 9. Coordinate Logs (10 per session = 500 total) ──
        coord_logs = []
        for sess in sessions:
            duration = (sess.end_time - sess.start_time).total_seconds()
            for j in range(10):
                t = sess.start_time + timedelta(seconds=duration * (j / 10))
                log = CoordinateLog(
                    store_id=primary_store.id,
                    camera_id=random.choice(cameras).camera_name,
                    shopper_id=str(sess.id),
                    x=round(random.uniform(5, 95), 2),
                    y=round(random.uniform(5, 95), 2),
                    timestamp=t,
                )
                db.add(log)
                coord_logs.append(log)
        db.commit()
        print(f"  ✅ Seeded {len(coord_logs)} coordinate logs")

        # ── 10. Attention Events (3-5 per session) ──
        attention_events = []
        for sess in sessions:
            for _ in range(random.randint(3, 5)):
                target_product = random.choice(products) if products else None
                ae = AttentionEvent(
                    session_id=sess.id,
                    target_type="PRODUCT",
                    target_id=target_product.id if target_product else None,
                    gaze_duration_seconds=round(random.uniform(2.0, 30.0), 2),
                    timestamp=sess.start_time + timedelta(seconds=random.randint(10, 300)),
                )
                db.add(ae)
                attention_events.append(ae)
        db.commit()
        print(f"  ✅ Seeded {len(attention_events)} attention events")

        # ── 11. Interaction Events (1-4 per session) ──
        interaction_types = ["VIEWED", "PICKED_UP", "RETURNED", "PURCHASED"]
        interaction_events = []
        for sess in sessions:
            for _ in range(random.randint(1, 4)):
                target_product = random.choice(products) if products else None
                ie = InteractionEvent(
                    session_id=sess.id,
                    product_id=target_product.id if target_product else None,
                    interaction_type=random.choice(interaction_types),
                    timestamp=sess.start_time + timedelta(seconds=random.randint(20, 400)),
                )
                db.add(ie)
                interaction_events.append(ie)
        db.commit()
        print(f"  ✅ Seeded {len(interaction_events)} interaction events")

        # ── 12. Shopper Segments (one per session) ──
        segment_types = ["Explorer", "Quick Buyer", "Comparison Shopper", "Impulse Buyer", "Brand Loyal"]
        for sess in sessions:
            seg = ShopperSegment(
                session_id=sess.id,
                store_id=primary_store.id,
                segment=random.choice(segment_types),
                confidence=round(random.uniform(0.5, 0.98), 2),
                metrics={
                    "dwell_time": random.randint(60, 600),
                    "zones_visited": random.randint(1, 6),
                    "product_switches": random.randint(0, 8),
                    "pickup_count": random.randint(0, 5),
                },
                reason="Auto-classified by segmentation engine based on behavioral metrics.",
            )
            db.add(seg)
        db.commit()
        print(f"  ✅ Seeded {len(sessions)} shopper segments")

        # ── 13. Customer Journeys (one per session) ──
        zone_names = [z.zone_name for z in zones]
        for sess in sessions:
            visited = random.sample(zone_names, k=min(random.randint(2, 5), len(zone_names)))
            transitions = visited.copy()
            zone_dwells = {z: round(random.uniform(10, 120), 1) for z in visited}
            journey = CustomerJourney(
                session_id=sess.id,
                store_id=primary_store.id,
                entry_point=visited[0] if visited else "Entrance",
                exit_point=visited[-1] if visited else "Exit",
                zones_visited=visited,
                zone_transition_sequence=transitions,
                total_dwell_time_seconds=sum(zone_dwells.values()),
                zone_dwell_times=zone_dwells,
                path_length=round(random.uniform(50, 300), 1),
                visit_frequency=random.randint(1, 3),
                product_interaction_count=random.randint(1, 8),
                pickup_count=random.randint(0, 4),
                return_count=random.randint(0, 2),
                conversion_status=random.random() > 0.6,
            )
            db.add(journey)
        db.commit()
        print(f"  ✅ Seeded {len(sessions)} customer journeys")

        # ── 14. Product Scores ──
        for prod in products:
            score = ProductScore(
                product_id=prod.id,
                store_id=primary_store.id,
                attractiveness_score=round(random.uniform(30, 95), 1),
                shelf_visibility_score=round(random.uniform(40, 100), 1),
                engagement_score=round(random.uniform(20, 90), 1),
                conversion_potential_score=round(random.uniform(10, 85), 1),
                marketing_effectiveness_score=round(random.uniform(25, 95), 1),
                metrics={
                    "attention_duration": round(random.uniform(5, 50), 1),
                    "interaction_frequency": random.randint(3, 40),
                    "pickup_count": random.randint(1, 20),
                    "purchase_count": random.randint(0, 10),
                    "repeat_views": random.randint(2, 30),
                },
            )
            db.add(score)
        db.commit()
        print(f"  ✅ Seeded {len(products)} product scores")

        # ── 15. Heatmap Results ──
        heatmap_types = ["store_traffic", "shelf", "product", "engagement"]
        for ht in heatmap_types:
            points = [
                [round(random.uniform(5, 95), 1), round(random.uniform(5, 95), 1), round(random.uniform(0.1, 1.0), 2)]
                for _ in range(50)
            ]
            hm = HeatmapResult(
                store_id=primary_store.id,
                heatmap_type=ht,
                grid_data={"points": points, "max_val": 1.0},
                time_range_hours=24,
            )
            db.add(hm)
        db.commit()
        print(f"  ✅ Seeded {len(heatmap_types)} heatmap results")

        # ── 16. Recommendations ──
        rec_data = [
            {
                "type": "shelf_placement",
                "title": "Reposition Premium Coffee Blend",
                "desc": "Move Premium Coffee Blend to eye-level shelf position. Current bottom-shelf placement reduces visibility by 40%.",
                "reason": "Product receives 65% attention from passersby but only 12% pickup rate due to low shelf position.",
                "metric": "Shelf Visibility Score: 42/100",
                "impact": "+25% expected increase in pickup rate",
                "priority": "high",
            },
            {
                "type": "promotion",
                "title": "Bundle Snacks with Beverages",
                "desc": "Create cross-category bundle promotions between snack aisle and beverage cooler to increase basket size.",
                "reason": "Shopper journey analysis shows 78% of beverage buyers also visit snack aisle within 2 minutes.",
                "metric": "Cross-Category Transition Rate: 78%",
                "impact": "+15% basket size for bundled purchases",
                "priority": "medium",
            },
            {
                "type": "layout",
                "title": "Dead Zone in Aisle 2",
                "desc": "Low foot traffic detected in the rear section of Aisle 2. Reposition high-demand anchor products to direct traffic.",
                "reason": "Heatmap analysis shows only 8% of shoppers traverse beyond midpoint of Aisle 2.",
                "metric": "Zone Traffic: 8% penetration rate",
                "impact": "+35% traffic flow improvement",
                "priority": "high",
            },
            {
                "type": "traffic",
                "title": "Peak Hour Staffing Alert",
                "desc": "Checkout congestion detected during 12PM-2PM. Consider adding express lanes or self-checkout stations.",
                "reason": "Average queue wait time exceeds 4 minutes during lunch hours.",
                "metric": "Avg Queue Time: 4.2 minutes",
                "impact": "-60% customer wait time",
                "priority": "critical",
            },
            {
                "type": "shelf_placement",
                "title": "Organic Produce Visibility Boost",
                "desc": "Organic produce section has high dwell time (avg 5.1 min) but low conversion. Improve signage and pricing display.",
                "reason": "Customers spend 40% more time browsing organic products than conventional but convert 20% less.",
                "metric": "Dwell:Conversion Ratio: 2.5:1",
                "impact": "+18% conversion improvement",
                "priority": "medium",
            },
        ]
        for rd in rec_data:
            rec = Recommendation(
                store_id=primary_store.id,
                recommendation_type=rd["type"],
                title=rd["title"],
                description=rd["desc"],
                reason=rd["reason"],
                supporting_metric=rd["metric"],
                expected_impact=rd["impact"],
                priority=rd["priority"],
            )
            db.add(rec)
        db.commit()
        print(f"  ✅ Seeded {len(rec_data)} recommendations")

        # ── 17. Campaigns ──
        campaign_data = [
            {
                "name": "Summer Beverage Blast",
                "desc": "Promote summer drink specials with in-store displays and endcap placement.",
                "type": "conversion",
                "status": "active",
                "budget": 5000.0,
                "impressions": 12500,
                "clicks": 3200,
                "conversions": 890,
                "revenue": 15600.0,
            },
            {
                "name": "Healthy Living Campaign",
                "desc": "Drive awareness for organic and health food products through enhanced shelf visibility.",
                "type": "awareness",
                "status": "active",
                "budget": 3000.0,
                "impressions": 8500,
                "clicks": 1800,
                "conversions": 420,
                "revenue": 8200.0,
            },
            {
                "name": "Back to School Snacks",
                "desc": "Promote family-sized snack packages with strategic endcap placements.",
                "type": "engagement",
                "status": "completed",
                "budget": 2500.0,
                "impressions": 6000,
                "clicks": 1500,
                "conversions": 350,
                "revenue": 6800.0,
            },
        ]
        campaign_objs = []
        for cd in campaign_data:
            camp = Campaign(
                store_id=primary_store.id,
                name=cd["name"],
                description=cd["desc"],
                campaign_type=cd["type"],
                status=cd["status"],
                start_date=NOW - timedelta(days=random.randint(10, 30)),
                end_date=NOW + timedelta(days=random.randint(5, 30)) if cd["status"] == "active" else NOW - timedelta(days=2),
                budget=cd["budget"],
                impressions=cd["impressions"],
                clicks=cd["clicks"],
                conversions=cd["conversions"],
                revenue=cd["revenue"],
                metrics={
                    "ctr": round(cd["clicks"] / cd["impressions"] * 100, 1) if cd["impressions"] else 0,
                    "conversion_rate": round(cd["conversions"] / cd["clicks"] * 100, 1) if cd["clicks"] else 0,
                    "roas": round(cd["revenue"] / cd["budget"], 2) if cd["budget"] else 0,
                },
            )
            db.add(camp)
            campaign_objs.append(camp)
        db.commit()
        print(f"  ✅ Seeded {len(campaign_data)} campaigns")

        # ── 18. Promotions ──
        promo_data = [
            {"name": "20% Off Premium Coffee", "type": "discount", "discount": 20, "views": 3500, "interactions": 800, "conversions": 220},
            {"name": "Buy 2 Get 1 Free Chips", "type": "bogo", "discount": None, "views": 2800, "interactions": 650, "conversions": 180},
            {"name": "Energy Drink Endcap Display", "type": "endcap", "discount": None, "views": 4200, "interactions": 1100, "conversions": 340},
            {"name": "Organic Produce 15% Off", "type": "discount", "discount": 15, "views": 1800, "interactions": 400, "conversions": 95},
        ]
        for pd_item in promo_data:
            promo = Promotion(
                store_id=primary_store.id,
                campaign_id=campaign_objs[0].id if campaign_objs else None,
                product_id=random.choice(products).id if products else None,
                name=pd_item["name"],
                promotion_type=pd_item["type"],
                discount_percent=pd_item["discount"],
                is_active=True,
                views=pd_item["views"],
                interactions=pd_item["interactions"],
                conversions=pd_item["conversions"],
                start_date=NOW - timedelta(days=10),
                end_date=NOW + timedelta(days=20),
            )
            db.add(promo)
        db.commit()
        print(f"  ✅ Seeded {len(promo_data)} promotions")

        # ── 19. Alerts ──
        alert_data = [
            {"type": "camera_health", "severity": "critical", "msg": "Entrance Camera offline — connection timeout after 3 retries"},
            {"type": "traffic_anomaly", "severity": "warning", "msg": "High congestion detected in Checkout zone — 45 people in 10 min window"},
            {"type": "shelf_performance", "severity": "info", "msg": "Snacks Aisle shelf engagement dropped 15% compared to last week"},
            {"type": "product_visibility", "severity": "warning", "msg": "Premium Coffee Blend visibility score below threshold (42/100)"},
            {"type": "traffic_anomaly", "severity": "critical", "msg": "Unusual traffic spike in Produce Section — possible event congestion"},
        ]
        for ad in alert_data:
            alert = Alert(
                store_id=primary_store.id,
                alert_type=ad["type"],
                severity=ad["severity"],
                message=ad["msg"],
                status="open",
            )
            db.add(alert)
        db.commit()
        print(f"  ✅ Seeded {len(alert_data)} alerts")

        # ── 20. Audit Logs ──
        audit_data = [
            {"action": "login", "resource": "auth", "details": {"email": "admin@consumerattention.com", "status": "success"}},
            {"action": "create", "resource": "camera", "details": {"camera_name": "Entrance Camera"}},
            {"action": "update", "resource": "store", "details": {"store_name": "Downtown Hypermarket", "field": "location"}},
            {"action": "login", "resource": "auth", "details": {"email": "manager@consumerattention.com", "status": "success"}},
            {"action": "login_failed", "resource": "auth", "details": {"email": "unknown@test.com", "ip": "192.168.1.5"}},
            {"action": "create", "resource": "zone", "details": {"zone_name": "Entrance"}},
            {"action": "update", "resource": "user", "details": {"email": "analyst@consumerattention.com", "field": "role"}},
            {"action": "create", "resource": "shelf", "details": {"shelf_name": "Premium Beverage Shelf"}},
            {"action": "login", "resource": "auth", "details": {"email": "analyst@consumerattention.com", "status": "success"}},
            {"action": "delete", "resource": "camera", "details": {"camera_name": "Old Test Camera"}},
        ]
        admin_user = user_objs.get("Administrator")
        for i, ad in enumerate(audit_data):
            log = AuditLog(
                user_id=admin_user.id if admin_user else None,
                action=ad["action"],
                resource=ad["resource"],
                details=ad["details"],
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                created_at=NOW - timedelta(hours=len(audit_data) - i),
            )
            db.add(log)
        db.commit()
        print(f"  ✅ Seeded {len(audit_data)} audit logs")

        # ── 21. Reports ──
        report_data = [
            {"name": "Weekly Customer Engagement Summary", "type": "consumer_attention", "format": "pdf"},
            {"name": "Monthly Shelf Layout Performance Index", "type": "shelf_performance", "format": "pdf"},
            {"name": "Store Traffic & Dwell Time Analysis", "type": "consumer_behavior", "format": "pdf"},
            {"name": "Q3 Marketing Campaign Report", "type": "marketing_campaign", "format": "xlsx"},
            {"name": "Product Engagement Deep Dive", "type": "product_engagement", "format": "pdf"},
        ]
        for rd_item in report_data:
            report = Report(
                store_id=primary_store.id,
                name=rd_item["name"],
                report_type=rd_item["type"],
                format=rd_item["format"],
                generated_by=admin_user.id if admin_user else None,
                status="completed",
            )
            db.add(report)
        db.commit()
        print(f"  ✅ Seeded {len(report_data)} reports")

        print("\n🎉 Data seeding complete! All entities created successfully.")
        print("\n📋 Test Login Credentials:")
        print("  Admin:     admin@consumerattention.com / Admin@123")
        print("  Manager:   manager@consumerattention.com / Manager@123")
        print("  Analyst:   analyst@consumerattention.com / Analyst@123")
        print("  Marketing: marketing@consumerattention.com / Marketing@123")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
