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
from app.models.store import (
    Store, Zone, Shelf, Product, Camera, AttentionLog,
    ShopperSession, ShopperTrajectory, ProductMetric, Recommendation, MarketingCampaign, Alert
)
from app.models.user import User, UserRole
from app.core.security import hash_password

db = SessionLocal()

try:
    # 0. Seed Users
    if db.query(User).count() == 0:
        default_users = [
            User(full_name="Admin User", email="admin@cams.com", hashed_password=hash_password("admin123"), role=UserRole.ADMINISTRATOR, is_active=True),
            User(full_name="Store Manager", email="manager@cams.com", hashed_password=hash_password("manager123"), role=UserRole.STORE_MANAGER, is_active=True),
            User(full_name="Retail Analyst", email="analyst@cams.com", hashed_password=hash_password("analyst123"), role=UserRole.RETAIL_ANALYST, is_active=True),
            User(full_name="Marketing Manager", email="market@cams.com", hashed_password=hash_password("market123"), role=UserRole.MARKETING_MANAGER, is_active=True),
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

    # 2. Seed Zones
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

    # 2.5 Seed Default Cameras if empty
    default_cam = db.query(Camera).first()
    if not default_cam:
        default_cam = Camera(
            label="Entrance Camera",
            location="Entrance",
            stream_url="http://127.0.0.1:8000/processed/2_1_crop.mp4",
            status="online",
            store_id=default_store.id
        )
        db.add(default_cam)
        db.commit()
        db.refresh(default_cam)
        print("Default camera successfully seeded!")

    # 3. Seed M3 Shopper Sessions & Trajectories if empty
    if db.query(ShopperSession).count() == 0:
        session_seeds = [
            ShopperSession(store_id=default_store.id, track_id=101, total_dwell=45.0, attention_duration=32.0, visited_zones='["Entrance", "Beverages", "Bakery"]', visited_shelves='["Beverage Shelf A1", "Bakery Shelf B1"]', product_pickups=1, purchases=0, switching_count=0, promo_zone_visited="false", shopper_segment="Explorer"),
            ShopperSession(store_id=default_store.id, track_id=102, total_dwell=38.0, attention_duration=28.0, visited_zones='["Entrance", "Cooking Products", "Bakery"]', visited_shelves='["Cooking Shelf C1", "Bakery Shelf B1"]', product_pickups=1, purchases=0, switching_count=1, promo_zone_visited="false", shopper_segment="Explorer"),
            ShopperSession(store_id=default_store.id, track_id=103, total_dwell=12.0, attention_duration=10.0, visited_zones='["Beverages", "Billing Counter"]', visited_shelves='["Beverage Shelf A1"]', product_pickups=2, purchases=2, switching_count=0, promo_zone_visited="false", shopper_segment="Quick Buyer"),
            ShopperSession(store_id=default_store.id, track_id=104, total_dwell=14.0, attention_duration=11.0, visited_zones='["Cooking Products", "Billing Counter"]', visited_shelves='["Cooking Shelf C1"]', product_pickups=1, purchases=1, switching_count=0, promo_zone_visited="false", shopper_segment="Quick Buyer"),
            ShopperSession(store_id=default_store.id, track_id=105, total_dwell=52.0, attention_duration=44.0, visited_zones='["Beverages", "Bakery"]', visited_shelves='["Beverage Shelf A1", "Bakery Shelf B1"]', product_pickups=4, purchases=1, switching_count=3, promo_zone_visited="false", shopper_segment="Comparison Shopper"),
            ShopperSession(store_id=default_store.id, track_id=106, total_dwell=48.0, attention_duration=40.0, visited_zones='["Cooking Products"]', visited_shelves='["Cooking Shelf C1"]', product_pickups=3, purchases=1, switching_count=2, promo_zone_visited="false", shopper_segment="Comparison Shopper"),
            ShopperSession(store_id=default_store.id, track_id=107, total_dwell=16.0, attention_duration=14.0, visited_zones='["Entrance", "Beverages"]', visited_shelves='["Beverage Shelf A1"]', product_pickups=2, purchases=1, switching_count=0, promo_zone_visited="true", shopper_segment="Impulse Buyer"),
            ShopperSession(store_id=default_store.id, track_id=108, total_dwell=18.0, attention_duration=15.0, visited_zones='["Entrance"]', visited_shelves='["Bakery Shelf B1"]', product_pickups=2, purchases=2, switching_count=0, promo_zone_visited="true", shopper_segment="Impulse Buyer"),
            ShopperSession(store_id=default_store.id, track_id=109, total_dwell=9.0, attention_duration=8.0, visited_zones='["Bakery"]', visited_shelves='["Bakery Shelf B1"]', product_pickups=1, purchases=1, switching_count=0, promo_zone_visited="false", shopper_segment="Brand Loyal Customer"),
            ShopperSession(store_id=default_store.id, track_id=110, total_dwell=10.0, attention_duration=9.0, visited_zones='["Beverages"]', visited_shelves='["Beverage Shelf A1"]', product_pickups=1, purchases=1, switching_count=0, promo_zone_visited="false", shopper_segment="Brand Loyal Customer"),
        ]
        db.add_all(session_seeds)
        db.commit()

        traj_seeds = []
        for sess in session_seeds:
            db.refresh(sess)
            base_x, base_y = 300 + (sess.id * 80) % 600, 200 + (sess.id * 60) % 400
            for pt_idx in range(6):
                traj_seeds.append(ShopperTrajectory(
                    session_id=sess.id,
                    camera_id=default_cam.id,
                    x=base_x + pt_idx * 25,
                    y=base_y + (pt_idx % 2) * 15,
                    focus_x=base_x + pt_idx * 25 + 10,
                    focus_y=base_y + (pt_idx % 2) * 15 + 5,
                    zone_name="Beverages" if pt_idx > 2 else "Entrance",
                    shelf_name="Beverage Shelf A1" if pt_idx > 2 else None,
                    dwell_time=4.0
                ))
        db.add_all(traj_seeds)
        db.commit()
        print("Default M3 Shopper Sessions & Trajectories seeded!")


    # 4. Seed Product Metrics if empty
    products = db.query(Product).all()
    if db.query(ProductMetric).count() == 0 and products:
        metric_seeds = []
        for idx, p in enumerate(products):
            attn_dur = 85.0 if idx == 0 else (72.0 if idx == 1 else 60.0)
            inter_freq = 70.0 if idx == 0 else (55.0 if idx == 1 else 40.0)
            pick_rate = 75.0 if idx == 0 else (68.0 if idx == 1 else 50.0)
            conv_rate = 65.0 if idx == 0 else (58.0 if idx == 1 else 45.0)
            rep_eng = 55.0 if idx == 0 else (48.0 if idx == 1 else 35.0)

            score = round(0.35 * attn_dur + 0.25 * inter_freq + 0.20 * pick_rate + 0.15 * conv_rate + 0.05 * rep_eng, 2)
            
            metric_seeds.append(ProductMetric(
                product_id=p.id,
                store_id=default_store.id,
                attention_duration=attn_dur,
                interaction_frequency=inter_freq,
                pickup_rate=pick_rate,
                conversion_rate=conv_rate,
                repeat_engagement=rep_eng,
                attractiveness_score=score,
                visibility_score=round(0.6 * attn_dur + 0.4 * inter_freq, 1),
                engagement_score=round(0.5 * inter_freq + 0.5 * pick_rate, 1),
                conversion_potential_score=round(0.7 * conv_rate + 0.3 * pick_rate, 1),
                marketing_effectiveness_score=round(0.4 * attn_dur + 0.3 * conv_rate + 0.3 * rep_eng, 1),
                rank=idx + 1
            ))
        db.add_all(metric_seeds)
        db.commit()
        print("Default M3 Product Metrics seeded!")

    # 5. Seed Marketing Campaigns if empty
    if db.query(MarketingCampaign).count() == 0:
        campaign_seeds = [
            MarketingCampaign(
                store_id=default_store.id,
                name="Summer Beverage Blitz '26",
                promoted_products="Cold Brew, Energy Drinks, Fresh Juices",
                duration="Jul 15 - Aug 15",
                reach=14250,
                attention_score=84.5,
                visitors=4820,
                product_engagement="78.2%",
                sales_lift="+34.5%",
                roi="412%",
                status="Active"
            ),
            MarketingCampaign(
                store_id=default_store.id,
                name="Organic Bakery Fresh Promo",
                promoted_products="Artisan Breads, Croissants, Pastries",
                duration="Jul 20 - Jul 31",
                reach=8900,
                attention_score=76.2,
                visitors=2940,
                product_engagement="64.0%",
                sales_lift="+22.1%",
                roi="285%",
                status="Active"
            ),
            MarketingCampaign(
                store_id=default_store.id,
                name="Chef Cooking Essentials",
                promoted_products="Olive Oil, Gourmet Spices, Pasta Sauces",
                duration="Jul 01 - Jul 31",
                reach=11400,
                attention_score=81.0,
                visitors=3650,
                product_engagement="71.5%",
                sales_lift="+28.4%",
                roi="350%",
                status="Active"
            )
        ]
        db.add_all(campaign_seeds)
        db.commit()
        print("Default M3 Marketing Campaigns seeded!")

    # 6. Seed Operational Alerts if empty
    if db.query(Alert).count() == 0:
        alert_seeds = [
            Alert(
                store_id=default_store.id,
                alert_type="shelf_performance",
                severity="HIGH",
                message="Engagement on Shelf B3 has dropped below the target (Attention Score: 52.4%).",
                status="active",
                is_read=False
            ),
            Alert(
                store_id=default_store.id,
                alert_type="product_visibility",
                severity="MEDIUM",
                message="High-value product 'Gourmet Organic Coffee' has poor visibility in rear end-cap area.",
                status="active",
                is_read=False
            ),
            Alert(
                store_id=default_store.id,
                alert_type="traffic_anomaly",
                severity="CRITICAL",
                message="Traffic Anomaly: Unusual crowding and checkout queue spike detected near Billing Counter.",
                status="active",
                is_read=False
            ),
            Alert(
                store_id=default_store.id,
                alert_type="camera_health",
                severity="HIGH",
                message="Camera Health Alert: Parking Lot Camera 2 stream frame rate drop detected (12 FPS).",
                status="active",
                is_read=False
            ),
        ]
        db.add_all(alert_seeds)
        db.commit()
        print("Default Operational Alerts seeded!")

except Exception as e:
    print(f"Error seeding database: {e}")

finally:
    db.close()


from app.routers import auth, store as store_router, camera, analytics, marketing, retail_analyst, store_manager, alerts

app = FastAPI(
    title="Consumer Attention Mapping System API",
    description="Enterprise Retail Analytics Platform — Entrance, Bakery, Beverages, Cooking Products, Billing Counter & Parking",
    version="1.0.0",
)

os.makedirs("processed", exist_ok=True)
os.makedirs("uploads", exist_ok=True)

app.mount("/processed", StaticFiles(directory="processed"), name="processed")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_raw.strip() == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(alerts.router)


@app.get("/health")
def health_check():
    db_session = SessionLocal()
    try:
        store_count = db_session.query(Store).count()
        camera_count = db_session.query(Camera).count()
        active_alerts_count = db_session.query(Alert).filter(Alert.status == "active").count()
        db_status = "healthy"
    except Exception as err:
        db_status = f"unhealthy: {err}"
        store_count, camera_count, active_alerts_count = 0, 0, 0
    finally:
        db_session.close()

    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "processing_engine": "YOLOv8 ByteTrack Pipeline Active",
        "platform": "Consumer Attention Mapping System v1.0",
        "counts": {
            "stores": store_count,
            "cameras": camera_count,
            "active_alerts": active_alerts_count
        }
    }

