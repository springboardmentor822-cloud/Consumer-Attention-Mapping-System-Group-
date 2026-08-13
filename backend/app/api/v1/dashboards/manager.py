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
    # Determine reference time based on latest tracking log in database to handle ingestion CPU lag dynamically
    latest_log_ts = db.query(func.max(TrackingLog.timestamp)).scalar()
    ref_time = latest_log_ts if latest_log_ts else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
    two_minutes_ago = ref_time - datetime.timedelta(minutes=2)

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

    # Load shelves once to avoid N+1 queries inside camera loops and shelf loops
    zone_shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    shelf_names = [s.name for s in zone_shelves]

    # Batch query shopper counts per camera for the last 2 minutes in a single query
    cam_ids = [c.id for c in cameras]
    cam_counts_raw = db.query(
        TrackingLog.camera_id,
        func.count(func.distinct(TrackingLog.shopper_id))
    ).filter(
        TrackingLog.camera_id.in_(cam_ids),
        TrackingLog.timestamp >= two_minutes_ago
    ).group_by(TrackingLog.camera_id).all()
    cam_counts_map = dict(cam_counts_raw)

    # Live cameras detail
    live_cameras = []
    for cam in cameras:
        cam_people_count = cam_counts_map.get(cam.id, 0)
        crowd_status = "High" if cam_people_count > 10 else ("Medium" if cam_people_count > 4 else "Low")
        
        # Calculate matching shelves for interaction counts
        loc = cam.location_name.lower() if cam.location_name else ""
        matching_shelf_ids = [s.id for s in zone_shelves if loc in s.name.lower()] if loc else []
        interactions_count = 0
        if matching_shelf_ids:
            interactions_count = db.query(func.count(InteractionLog.id))\
                .filter(InteractionLog.shelf_id.in_(matching_shelf_ids), InteractionLog.timestamp >= today_start).scalar() or 0
        
        live_cameras.append({
            "camera_id": cam.id,
            "name": cam.name,
            "zone_id": 1,
            "zone_name": cam.location_name or "General Area",
            "people_count": cam_people_count,
            "interactions_count": interactions_count,
            "crowd_status": crowd_status,
            "shelf_activity": "Active" if cam_people_count > 2 else "Quiet",
            "status": "Online" if cam.is_active else "Offline",
            "stream_url": cam.stream_url,
            "monitored_shelves": shelf_names,
            "last_updated": ref_time.isoformat()
        })


    # Hourly traffic - Batch query hourly traffic converting UTC to local timezone (+5.5 hours)
    # Since sqlite returns string hours, group and count
    hourly_raw = db.query(
        func.strftime("%H", func.datetime(TrackingLog.timestamp, "+5 hours", "30 minutes")),
        func.count(func.distinct(TrackingLog.shopper_id))
    ).filter(
        TrackingLog.timestamp >= today_start,
        TrackingLog.timestamp < today_start + datetime.timedelta(days=1)
    ).group_by(func.strftime("%H", func.datetime(TrackingLog.timestamp, "+5 hours", "30 minutes"))).all()
    hourly_map = {f"{int(h):02d}:00": count for h, count in hourly_raw if h is not None}

    hourly_traffic = []
    for hour in range(9, 21):
        hour_str = f"{hour:02d}:00"
        cnt = hourly_map.get(hour_str, 0)
        hourly_traffic.append({"hour": hour_str, "visitors": cnt})

    # Zone Occupancy - Batch query zone occupancy counts in a single query
    zone_names = {1: "Entrance Foyer", 2: "Main Product Aisle", 3: "Checkout Lanes"}
    zone_raw = db.query(
        TrackingLog.zone_id,
        func.count(func.distinct(TrackingLog.shopper_id))
    ).filter(
        TrackingLog.timestamp >= today_start
    ).group_by(TrackingLog.zone_id).all()
    zone_map = dict(zone_raw)

    zone_occupancy = []
    for zone_id, name in zone_names.items():
        cnt = zone_map.get(zone_id, 0)
        zone_occupancy.append({"zone_id": zone_id, "zone_name": name, "visitors": cnt})

    # Shelf Performance - Batch query views, pickups and purchases for all shelves in two queries
    shelf_ids = [s.id for s in zone_shelves]
    
    # 1. Batch views
    shelf_views_raw = db.query(
        TrackingLog.gaze_facing_shelf_id,
        func.count(TrackingLog.id)
    ).filter(
        TrackingLog.gaze_facing_shelf_id.in_(shelf_ids),
        TrackingLog.timestamp >= today_start
    ).group_by(TrackingLog.gaze_facing_shelf_id).all()
    shelf_views_map = dict(shelf_views_raw)

    # 2. Batch pickups & purchases
    shelf_ints_raw = db.query(
        InteractionLog.shelf_id,
        InteractionLog.interaction_type,
        func.count(InteractionLog.id)
    ).filter(
        InteractionLog.shelf_id.in_(shelf_ids),
        InteractionLog.timestamp >= today_start
    ).group_by(InteractionLog.shelf_id, InteractionLog.interaction_type).all()
    
    shelf_pickups_map = {}
    shelf_purchased_map = {}
    for sh_id, itype, cnt in shelf_ints_raw:
        if itype == "pickup":
            shelf_pickups_map[sh_id] = cnt
        elif itype == "purchased":
            shelf_purchased_map[sh_id] = cnt

    shelf_performance = []
    for sh in zone_shelves:
        view_count = shelf_views_map.get(sh.id, 0)
        pickup_count = shelf_pickups_map.get(sh.id, 0)
        purchased_count = shelf_purchased_map.get(sh.id, 0)
        shelf_performance.append({
            "shelf_id": sh.id,
            "name": sh.name,
            "views": view_count,
            "pickups": pickup_count,
            "purchases": purchased_count,
            "engagement_score": round((view_count * 0.3 + pickup_count * 0.5 + purchased_count * 0.2), 1)
        })
    shelf_performance = sorted(shelf_performance, key=lambda x: x["engagement_score"], reverse=True)

    # Product interactions - Batch query views, pickups, returns and compares in a single query
    products = db.query(Product).filter(Product.store_id == store_id).all()
    prod_ids = [p.id for p in products]
    
    prod_ints_raw = db.query(
        InteractionLog.product_id,
        InteractionLog.interaction_type,
        func.count(InteractionLog.id)
    ).filter(
        InteractionLog.product_id.in_(prod_ids),
        InteractionLog.timestamp >= today_start
    ).group_by(InteractionLog.product_id, InteractionLog.interaction_type).all()
    
    prod_ints_map = {}
    for p_id, itype, cnt in prod_ints_raw:
        if p_id not in prod_ints_map:
            prod_ints_map[p_id] = {}
        prod_ints_map[p_id][itype] = cnt

    product_interactions = []
    for pr in products:
        p_map = prod_ints_map.get(pr.id, {})
        pickups = p_map.get("pickup", 0)
        returns = p_map.get("returned", 0)
        views = p_map.get("viewed", 0)
        compared = p_map.get("compare", 0)
        product_interactions.append({
            "product_id": pr.id,
            "name": pr.name,
            "category": pr.category,
            "pickups": pickups,
            "returns": returns,
            "views": views,
            "compared": compared
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

    # Include notifications as alerts as well
    from app.models.notification import Notification
    notifications = db.query(Notification).filter(Notification.store_id == store_id).all()
    for n in notifications:
        active_alerts.append({
            "id": n.id,
            "camera_id": None,
            "event_type": n.type,
            "details": n.message,
            "timestamp": n.created_at.isoformat() if n.created_at else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat()
        })

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
    formatted_alerts.sort(key=lambda x: x["timestamp"], reverse=True)

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

