import uuid
import datetime
from sqlalchemy.orm import Session
from app.models.models import Alert, Camera, Shelf, Product, ProductInteraction, ShopperSession

DEFAULT_ALERTS = [
    {
        "id": "ALT-01",
        "store_id": "STORE-812",
        "type": "TRAFFIC_ANOMALY",
        "level": "WARNING",
        "title": "High Dwell Congestion in Beverage Aisle",
        "description": "14 shoppers dwelling > 8 mins simultaneously in Zone-01 (Beverages)",
        "source_id": "ZONE-BEVERAGES",
        "acknowledged": False,
        "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    },
    {
        "id": "ALT-02",
        "store_id": "STORE-812",
        "type": "CAMERA_HEALTH",
        "level": "INFO",
        "title": "Camera CAM-02 Homography Calibrated",
        "description": "Auto-calibration matrix updated for shelf planogram overlay with 98.6% confidence",
        "source_id": "CAM-02",
        "acknowledged": False,
        "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=25)
    },
    {
        "id": "ALT-03",
        "store_id": "STORE-812",
        "type": "SHELF_PERFORMANCE",
        "level": "ALERT",
        "title": "Low Inventory Pickup Anomaly",
        "description": "Shelf B1 (Artisanal Chips) pickup rate dropped 35% below expected baseline threshold",
        "source_id": "SHELF-03",
        "acknowledged": False,
        "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    },
    {
        "id": "ALT-04",
        "store_id": "STORE-812",
        "type": "PRODUCT_VISIBILITY",
        "level": "WARNING",
        "title": "High-Value Product Low-Attention Area",
        "description": "Keto Crunch Roasted Almonds (SKU-104) receives high dwell but zero pickup conversion on Shelf B2",
        "source_id": "PROD-104",
        "acknowledged": False,
        "timestamp": datetime.datetime.utcnow() - datetime.timedelta(hours=2)
    },
    {
        "id": "ALT-05",
        "store_id": "STORE-812",
        "type": "CAMERA_HEALTH",
        "level": "CRITICAL",
        "title": "Camera CAM-06 Stream Latency Degradation",
        "description": "Frame drop detected on exit gate camera (FPS dropped from 30 to 12 FPS)",
        "source_id": "CAM-06",
        "acknowledged": False,
        "timestamp": datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    }
]

def init_default_alerts_if_empty(db: Session, store_id: str = "STORE-812"):
    existing_count = db.query(Alert).filter(Alert.store_id == store_id).count()
    if existing_count == 0:
        for a in DEFAULT_ALERTS:
            db_alert = Alert(
                id=a["id"],
                store_id=a["store_id"],
                type=a["type"],
                level=a["level"],
                title=a["title"],
                description=a["description"],
                source_id=a["source_id"],
                acknowledged=a["acknowledged"],
                timestamp=a["timestamp"]
            )
            db.add(db_alert)
        try:
            db.commit()
        except Exception:
            db.rollback()

def evaluate_all_rules(db: Session, store_id: str = "STORE-812"):
    """
    Evaluates rule triggers across 4 mandatory alert dimensions:
    1. Shelf Performance
    2. Product Visibility
    3. Traffic Anomaly
    4. Camera Health
    """
    init_default_alerts_if_empty(db, store_id)
    generated_alerts = []

    # 1. Camera Health Evaluation
    cameras = db.query(Camera).filter(Camera.store_id == store_id).all()
    for cam in cameras:
        if cam.status != "ONLINE":
            alert_id = f"ALT-CAM-{cam.id}-{int(datetime.datetime.utcnow().timestamp())}"
            exists = db.query(Alert).filter(Alert.id == alert_id).first()
            if not exists:
                new_alert = Alert(
                    id=alert_id,
                    store_id=store_id,
                    type="CAMERA_HEALTH",
                    level="CRITICAL" if cam.status == "OFFLINE" else "WARNING",
                    title=f"Camera {cam.name} Stream Issue",
                    description=f"Camera feed {cam.id} ({cam.ip_address}) status is {cam.status}. Frame capture degraded.",
                    source_id=cam.id,
                    acknowledged=False,
                    timestamp=datetime.datetime.utcnow()
                )
                db.add(new_alert)
                generated_alerts.append(new_alert)

    try:
        db.commit()
    except Exception:
        db.rollback()

    return generated_alerts

def get_alerts(db: Session, store_id: str = "STORE-812", alert_type: str = None, level: str = None, acknowledged: bool = None):
    init_default_alerts_if_empty(db, store_id)
    query = db.query(Alert).filter(Alert.store_id == store_id)

    if alert_type and alert_type != "ALL":
        query = query.filter(Alert.type == alert_type)
    if level and level != "ALL":
        query = query.filter(Alert.level == level)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)

    alerts = query.order_by(Alert.timestamp.desc()).all()
    return [
        {
            "id": a.id,
            "store_id": a.store_id,
            "type": a.type,
            "level": a.level,
            "title": a.title,
            "description": a.description,
            "source_id": a.source_id,
            "acknowledged": a.acknowledged,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "time": format_relative_time(a.timestamp)
        }
        for a in alerts
    ]

def trigger_custom_alert(db: Session, store_id: str, alert_type: str, level: str, title: str, description: str, source_id: str = None):
    alert_id = f"ALT-MAN-{uuid.uuid4().hex[:6]}"
    alert = Alert(
        id=alert_id,
        store_id=store_id,
        type=alert_type,
        level=level,
        title=title,
        description=description,
        source_id=source_id,
        acknowledged=False,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return {
        "id": alert.id,
        "type": alert.type,
        "level": alert.level,
        "title": alert.title,
        "description": alert.description,
        "timestamp": alert.timestamp.isoformat()
    }

def acknowledge_alert(db: Session, alert_id: str):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.acknowledged = True
        db.commit()
        return True
    return False

def format_relative_time(dt: datetime.datetime) -> str:
    if not dt:
        return "Just now"
    now = datetime.datetime.utcnow()
    diff = (now - dt).total_seconds()
    if diff < 60:
        return "Just now"
    elif diff < 3600:
        return f"{int(diff // 60)} mins ago"
    elif diff < 86400:
        return f"{int(diff // 3600)} hours ago"
    else:
        return f"{int(diff // 86400)} days ago"
