import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.auth import RoleChecker
from app.models import Store, Camera, Shelf, Product, TrackingLog, ProductInteraction as InteractionLog

router = APIRouter()

require_manager = RoleChecker(["Store Manager", "Administrator"])

@router.get("/{store_id}", response_model=Dict[str, Any])
def get_manager_dashboard(store_id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_manager)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    today_start = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).replace(hour=0, minute=0, second=0, microsecond=0)
    now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    two_minutes_ago = now - datetime.timedelta(minutes=2)

    # 1. Today's Visitors
    today_visitors = db.query(func.count(func.distinct(TrackingLog.shopper_id)))\
        .filter(TrackingLog.timestamp >= today_start).scalar() or 0

    # 2. Live Occupancy
    current_occupancy = db.query(func.count(func.distinct(TrackingLog.shopper_id)))\
        .filter(TrackingLog.timestamp >= two_minutes_ago).scalar() or 0

    # 3. Avg Dwell
    avg_dwell_query = db.query(func.avg(TrackingLog.dwell_time))\
        .filter(TrackingLog.timestamp >= today_start).scalar()
    avg_dwell_time = round(float(avg_dwell_query or 0.0), 1)

    # 4. Pickups
    picked_today = db.query(func.count(InteractionLog.id))\
        .filter(InteractionLog.interaction_type == "pickup", InteractionLog.timestamp >= today_start).scalar() or 0

    # 5. Conversion Rate
    from app.models.session import Session as ShopperSession
    purchases_today = db.query(func.count(func.distinct(ShopperSession.shopper_identifier)))\
        .join(InteractionLog, InteractionLog.session_id == ShopperSession.id)\
        .filter(InteractionLog.interaction_type == "purchased", InteractionLog.timestamp >= today_start).scalar() or 0
    conversion_rate = 0.0
    if today_visitors > 0:
        conversion_rate = round((purchases_today / today_visitors) * 100, 1)


    # 6. Online Cameras
    cameras = db.query(Camera).filter(Camera.store_id == store_id).all()
    online_cameras = sum(1 for c in cameras if c.is_active)
    total_cameras = len(cameras)

    kpis = {
        "today_visitors": today_visitors,
        "current_occupancy": current_occupancy,
        "avg_dwell_time_seconds": avg_dwell_time,
        "products_picked_today": picked_today,
        "conversion_rate_percentage": conversion_rate,
        "cameras_status": f"{online_cameras}/{total_cameras} Online"
    }

    # Live cameras detail
    live_cameras = []
    for cam in cameras:
        cam_people_count = db.query(func.count(func.distinct(TrackingLog.shopper_id)))\
            .filter(TrackingLog.camera_id == cam.id, TrackingLog.timestamp >= two_minutes_ago).scalar() or 0
        crowd_status = "High" if cam_people_count > 10 else ("Medium" if cam_people_count > 4 else "Low")
        zone_shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
        shelf_names = [s.name for s in zone_shelves]
        live_cameras.append({
            "camera_id": cam.id,
            "name": cam.name,
            "zone_id": 1,
            "people_count": cam_people_count,
            "crowd_status": crowd_status,
            "shelf_activity": "Active" if cam_people_count > 2 else "Quiet",
            "status": "Online" if cam.is_active else "Offline",
            "stream_url": cam.stream_url,
            "monitored_shelves": shelf_names
        })


    # Hourly traffic
    hourly_traffic = []
    for hour in range(9, 21):
        hour_start = today_start.replace(hour=hour)
        hour_end = hour_start + datetime.timedelta(hours=1)
        cnt = db.query(func.count(func.distinct(TrackingLog.shopper_id)))\
            .filter(TrackingLog.timestamp >= hour_start, TrackingLog.timestamp < hour_end).scalar() or 0
        hourly_traffic.append({"hour": f"{hour:02d}:00", "visitors": cnt})

    # Zone Occupancy
    zone_names = {1: "Entrance Foyer", 2: "Main Product Aisle", 3: "Checkout Lanes"}
    zone_occupancy = []
    for zone_id, name in zone_names.items():
        cnt = db.query(func.count(func.distinct(TrackingLog.shopper_id)))\
            .filter(TrackingLog.zone_id == zone_id, TrackingLog.timestamp >= today_start).scalar() or 0
        zone_occupancy.append({"zone_id": zone_id, "zone_name": name, "visitors": cnt})

    # Shelf Performance
    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    shelf_performance = []
    for sh in shelves:
        view_count = db.query(func.count(TrackingLog.id))\
            .filter(TrackingLog.gaze_facing_shelf_id == sh.id, TrackingLog.timestamp >= today_start).scalar() or 0
        pickup_count = db.query(func.count(InteractionLog.id))\
            .filter(InteractionLog.shelf_id == sh.id, InteractionLog.interaction_type == "pickup", InteractionLog.timestamp >= today_start).scalar() or 0
        purchased_count = db.query(func.count(InteractionLog.id))\
            .filter(InteractionLog.shelf_id == sh.id, InteractionLog.interaction_type == "purchased", InteractionLog.timestamp >= today_start).scalar() or 0
        shelf_performance.append({
            "shelf_id": sh.id,
            "name": sh.name,
            "views": view_count,
            "pickups": pickup_count,
            "purchases": purchased_count,
            "engagement_score": round((view_count * 0.3 + pickup_count * 0.5 + purchased_count * 0.2), 1)
        })
    shelf_performance = sorted(shelf_performance, key=lambda x: x["engagement_score"], reverse=True)

    # Product interactions
    products = db.query(Product).filter(Product.store_id == store_id).all()
    product_interactions = []
    for pr in products:
        pickups = db.query(func.count(InteractionLog.id))\
            .filter(InteractionLog.product_id == pr.id, InteractionLog.interaction_type == "pickup", InteractionLog.timestamp >= today_start).scalar() or 0
        returns = db.query(func.count(InteractionLog.id))\
            .filter(InteractionLog.product_id == pr.id, InteractionLog.interaction_type == "returned", InteractionLog.timestamp >= today_start).scalar() or 0
        views = db.query(func.count(InteractionLog.id))\
            .filter(InteractionLog.product_id == pr.id, InteractionLog.interaction_type == "viewed", InteractionLog.timestamp >= today_start).scalar() or 0
        product_interactions.append({
            "product_id": pr.id,
            "name": pr.name,
            "category": pr.category,
            "pickups": pickups,
            "returns": returns,
            "views": views,
            "compared": db.query(func.count(InteractionLog.id))\
                .filter(InteractionLog.product_id == pr.id, InteractionLog.interaction_type == "compare", InteractionLog.timestamp >= today_start).scalar() or 0
        })

    # Active alerts queried from CameraEvent table
    from app.models.camera_event import CameraEvent
    events = db.query(CameraEvent).filter(CameraEvent.timestamp >= today_start).all()
    active_alerts = [{
        "id": e.id,
        "camera_id": e.camera_id,
        "event_type": e.event_type,
        "details": e.details,
        "timestamp": e.timestamp.isoformat() if e.timestamp else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()
    } for e in events]

    # Format zone occupancy to match frontend ZoneOccupancyPoint
    formatted_zone_occupancy = [
        {"zone": zo["zone_name"], "occupancy": zo["visitors"]}
        for zo in zone_occupancy
    ]

    # Format shelf performance to match frontend ShelfPoint
    formatted_shelf_performance = [
        {"shelf": sp["name"], "score": sp["engagement_score"]}
        for sp in shelf_performance
    ]

    # Format product interactions to match frontend ProductPoint
    formatted_product_interactions = [
        {
            "product": pi["name"],
            "picked": pi["pickups"],
            "returned": pi["returns"],
            "compared": pi["compared"]
        }
        for pi in product_interactions
    ]

    # Format alerts to match frontend AlertItem
    formatted_alerts = [
        {
            "id": al["id"],
            "type": al["event_type"],
            "message": al["details"],
            "timestamp": al["timestamp"]
        }
        for al in active_alerts
    ]

    # Store Heatmap coordinates
    heatmap_logs = db.query(TrackingLog.x, TrackingLog.y, TrackingLog.zone_id)\
        .filter(TrackingLog.timestamp >= today_start).limit(500).all()
    heatmap_data = [{"x": float(log[0]), "y": float(log[1]), "value": 1, "zone_id": log[2]} for log in heatmap_logs]

    return {
        "store_id": store_id,
        "store_name": store.name,
        "kpis": kpis,
        "live_cameras": live_cameras,
        "traffic_chart": hourly_traffic,
        "zone_occupancy": formatted_zone_occupancy,
        "shelf_performance": formatted_shelf_performance,
        "product_interactions": formatted_product_interactions,
        "alerts": formatted_alerts,
        "heatmap_data": heatmap_data
    }

