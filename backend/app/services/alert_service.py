from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
import datetime

from app.models.store import Alert, Shelf, Product, ProductMetric, Camera, Zone, Store


def get_alerts(
    db: Session,
    store_id: int = 1,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    is_read: Optional[bool] = None,
    limit: int = 100
) -> List[Alert]:
    query = db.query(Alert).filter(Alert.store_id == store_id)
    
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)
        
    return query.order_by(desc(Alert.created_at)).limit(limit).all()


def get_active_alerts(db: Session, store_id: int = 1) -> List[Alert]:
    return db.query(Alert).filter(
        Alert.store_id == store_id,
        Alert.status == "active"
    ).order_by(desc(Alert.created_at)).all()


def mark_alert_read(db: Session, alert_id: int) -> Optional[Alert]:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if alert:
        alert.is_read = True
        db.commit()
        db.refresh(alert)
    return alert


def create_alert(
    db: Session,
    alert_type: str,
    message: str,
    severity: str = "HIGH",
    store_id: int = 1,
    zone_id: Optional[int] = None,
    camera_id: Optional[int] = None,
    product_id: Optional[int] = None,
    shelf_id: Optional[int] = None
) -> Alert:
    alert = Alert(
        store_id=store_id,
        zone_id=zone_id,
        camera_id=camera_id,
        product_id=product_id,
        shelf_id=shelf_id,
        alert_type=alert_type,
        severity=severity,
        message=message,
        status="active",
        is_read=False
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def evaluate_system_alerts(db: Session, store_id: int = 1) -> Dict[str, Any]:
    """
    Evaluates real store state and automatically generates database alerts for:
    1. Shelf Performance Alert
    2. Product Visibility Alert
    3. Traffic Anomaly Alert
    4. Camera Health Alert
    """
    new_alerts_count = 0

    # 1. Shelf Performance Check
    shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
    for s in shelves:
        if s.attention_score < 70.0 or s.average_dwell_time < 15.0:
            existing = db.query(Alert).filter(
                Alert.store_id == store_id,
                Alert.alert_type == "shelf_performance",
                Alert.shelf_id == s.id,
                Alert.status == "active"
            ).first()
            if not existing:
                msg = f"Engagement on {s.label or s.shelf_name} has dropped below the target (Attention Score: {s.attention_score:.1f}%)."
                create_alert(db, alert_type="shelf_performance", message=msg, severity="HIGH", store_id=store_id, shelf_id=s.id, zone_id=s.zone_id)
                new_alerts_count += 1

    # 2. Product Visibility Check
    metrics = db.query(ProductMetric).filter(ProductMetric.store_id == store_id).all()
    for m in metrics:
        if m.visibility_score < 60.0 or m.attractiveness_score < 55.0:
            existing = db.query(Alert).filter(
                Alert.store_id == store_id,
                Alert.alert_type == "product_visibility",
                Alert.product_id == m.product_id,
                Alert.status == "active"
            ).first()
            if not existing:
                prod = db.query(Product).get(m.product_id)
                pname = prod.product_name if prod else f"Product #{m.product_id}"
                msg = f"High-value product '{pname}' has low visibility score ({m.visibility_score:.1f}) in current location."
                create_alert(db, alert_type="product_visibility", message=msg, severity="MEDIUM", store_id=store_id, product_id=m.product_id)
                new_alerts_count += 1

    # 3. Traffic Anomaly Check
    busy_zones = db.query(Zone).filter(Zone.store_id == store_id, Zone.status == "Busy").all()
    if len(busy_zones) >= 2:
        existing = db.query(Alert).filter(
            Alert.store_id == store_id,
            Alert.alert_type == "traffic_anomaly",
            Alert.status == "active"
        ).first()
        if not existing:
            znames = ", ".join([z.name for z in busy_zones])
            msg = f"Traffic Anomaly: High crowding and congestion detected in zones: {znames}."
            create_alert(db, alert_type="traffic_anomaly", message=msg, severity="CRITICAL", store_id=store_id)
            new_alerts_count += 1

    # 4. Camera Health Check
    cameras = db.query(Camera).filter(Camera.store_id == store_id).all()
    for cam in cameras:
        if cam.status != "online":
            existing = db.query(Alert).filter(
                Alert.store_id == store_id,
                Alert.alert_type == "camera_health",
                Alert.camera_id == cam.id,
                Alert.status == "active"
            ).first()
            if not existing:
                msg = f"Camera Health Alert: Camera '{cam.label}' in {cam.location} status is {cam.status.upper()} (Frame loss / Stream disconnect)."
                create_alert(db, alert_type="camera_health", message=msg, severity="CRITICAL", store_id=store_id, camera_id=cam.id)
                new_alerts_count += 1

    return {
        "message": "System alert evaluation completed",
        "new_alerts_generated": new_alerts_count,
        "total_active_alerts": len(get_active_alerts(db, store_id))
    }
