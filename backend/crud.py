from sqlalchemy.orm import Session

import os
import csv
from datetime import datetime

from openpyxl import Workbook

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
)

from reportlab.lib.styles import getSampleStyleSheet

import models
import schemas

from live_stats import get_stats
from utils.security import hash_password


# ==========================================================
# CONFIGURATION
# ==========================================================

HIGH_CROWD = 10
HIGH_ATTENTION = 80
LOW_ATTENTION = 50
HIGH_DWELL = 20
HIGH_INTERACTIONS = 10


# ==========================================================
# USERS
# ==========================================================

def get_users(db: Session):
    return db.query(models.User).all()


def get_user(db: Session, user_id: int):

    return (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )


def get_user_by_email(db: Session, email: str):

    return (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )


def create_user(
    db: Session,
    user: schemas.UserCreate,
):

    new_user = models.User(

        username=user.username,

        email=user.email,

        password=hash_password(user.password),

        role=user.role,

        is_active=True,

    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return new_user


def update_user(
    db: Session,
    user_id: int,
    user: schemas.UserCreate,
):

    existing = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if existing is None:
        return None

    existing.username = user.username

    existing.email = user.email

    existing.role = user.role

    if user.password:

        existing.password = hash_password(
            user.password
        )

    db.commit()

    db.refresh(existing)

    return existing


def delete_user(
    db: Session,
    user_id: int,
):

    user = (
        db.query(models.User)
        .filter(models.User.id == user_id)
        .first()
    )

    if user is None:
        return False

    db.delete(user)

    db.commit()

    return True


# ==========================================================
# STORES
# ==========================================================
# ==========================================================
# STORES
# ==========================================================

def get_stores(db: Session):

    return db.query(models.Store).all()


def get_store(
    db: Session,
    store_id: int,
):

    return (
        db.query(models.Store)
        .filter(models.Store.id == store_id)
        .first()
    )


def create_store(
    db: Session,
    store: schemas.StoreCreate,
):

    new_store = models.Store(

        store_name=store.store_name,

        manager=store.manager,

        location=store.location,

        address=store.address,

        phone=store.phone,

        status=store.status,

    )

    db.add(new_store)

    db.commit()

    db.refresh(new_store)

    return new_store


def update_store(
    db: Session,
    store_id: int,
    store: schemas.StoreCreate,
):

    existing = (
        db.query(models.Store)
        .filter(models.Store.id == store_id)
        .first()
    )

    if existing is None:
        return None

    existing.store_name = store.store_name
    existing.manager = store.manager
    existing.location = store.location
    existing.address = store.address
    existing.phone = store.phone
    existing.status = store.status

    db.commit()

    db.refresh(existing)

    return existing


def delete_store(
    db: Session,
    store_id: int,
):

    store = (
        db.query(models.Store)
        .filter(models.Store.id == store_id)
        .first()
    )

    if store is None:
        return False

    db.delete(store)

    db.commit()

    return True


# ==========================================================
# SHELVES
# ==========================================================

def get_shelves(db: Session):

    return db.query(models.Shelf).all()


def get_shelf(
    db: Session,
    shelf_id: int,
):

    return (
        db.query(models.Shelf)
        .filter(models.Shelf.id == shelf_id)
        .first()
    )


def create_shelf(
    db: Session,
    shelf: schemas.ShelfCreate,
):

    new_shelf = models.Shelf(

        shelf_name=shelf.shelf_name,

        zone=shelf.zone,

        capacity=shelf.capacity,

        status=shelf.status,

        store_id=shelf.store_id,

    )

    db.add(new_shelf)

    db.commit()

    db.refresh(new_shelf)

    return new_shelf


def update_shelf(
    db: Session,
    shelf_id: int,
    shelf: schemas.ShelfCreate,
):

    existing = (
        db.query(models.Shelf)
        .filter(models.Shelf.id == shelf_id)
        .first()
    )

    if existing is None:
        return None

    existing.shelf_name = shelf.shelf_name
    existing.zone = shelf.zone
    existing.capacity = shelf.capacity
    existing.status = shelf.status
    existing.store_id = shelf.store_id

    db.commit()

    db.refresh(existing)

    return existing


def delete_shelf(
    db: Session,
    shelf_id: int,
):

    shelf = (
        db.query(models.Shelf)
        .filter(models.Shelf.id == shelf_id)
        .first()
    )

    if shelf is None:
        return False

    db.delete(shelf)

    db.commit()

    return True


# ==========================================================
# PRODUCTS
# ==========================================================
# ==========================================================
# PRODUCTS
# ==========================================================

def get_products(db: Session):

    return db.query(models.Product).all()


def get_product(
    db: Session,
    product_id: int,
):

    return (
        db.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )


def create_product(
    db: Session,
    product: schemas.ProductCreate,
):

    new_product = models.Product(

        product_name=product.product_name,

        category=product.category,

        brand=product.brand,

        sku=product.sku,

        barcode=product.barcode,

        price=product.price,

        stock=product.stock,

        image=product.image,

        attention_score=product.attention_score,

        shelf_id=product.shelf_id,

    )

    db.add(new_product)

    db.commit()

    db.refresh(new_product)

    return new_product


def update_product(
    db: Session,
    product_id: int,
    product: schemas.ProductCreate,
):

    existing = (
        db.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )

    if existing is None:
        return None

    existing.product_name = product.product_name
    existing.category = product.category
    existing.brand = product.brand
    existing.sku = product.sku
    existing.barcode = product.barcode
    existing.price = product.price
    existing.stock = product.stock
    existing.image = product.image
    existing.attention_score = product.attention_score
    existing.shelf_id = product.shelf_id

    db.commit()

    db.refresh(existing)

    return existing


def delete_product(
    db: Session,
    product_id: int,
):

    product = (
        db.query(models.Product)
        .filter(models.Product.id == product_id)
        .first()
    )

    if product is None:
        return False

    db.delete(product)

    db.commit()

    return True


# ==========================================================
# CAMERAS
# ==========================================================

def get_cameras(db: Session):

    return db.query(models.Camera).all()


def get_camera(
    db: Session,
    camera_id: int,
):

    return (
        db.query(models.Camera)
        .filter(models.Camera.id == camera_id)
        .first()
    )


def create_camera(
    db: Session,
    camera: schemas.CameraCreate,
):

    try:

        new_camera = models.Camera(

            camera_name=camera.camera_name,

            location=camera.location,

            status=camera.status,

            health=camera.health,

            ip_address=camera.ip_address,

            store_id=camera.store_id,

        )

        db.add(new_camera)

        db.commit()

        db.refresh(new_camera)

        return new_camera

    except Exception:

        db.rollback()

        raise


def update_camera(
    db: Session,
    camera_id: int,
    camera: schemas.CameraCreate,
):

    existing = (
        db.query(models.Camera)
        .filter(models.Camera.id == camera_id)
        .first()
    )

    if existing is None:
        return None

    existing.camera_name = camera.camera_name
    existing.location = camera.location
    existing.status = camera.status
    existing.health = camera.health
    existing.ip_address = camera.ip_address
    existing.store_id = camera.store_id

    db.commit()

    db.refresh(existing)

    return existing


def delete_camera(
    db: Session,
    camera_id: int,
):

    camera = (
        db.query(models.Camera)
        .filter(models.Camera.id == camera_id)
        .first()
    )

    if camera is None:
        return False

    db.delete(camera)

    db.commit()

    return True


# ==========================================================
# ANALYTICS
# ==========================================================
# ==========================================================
# ANALYTICS
# ==========================================================

def get_analytics(db: Session):

    return db.query(models.Analytics).all()


# ==========================================================
# ANALYTICS DASHBOARD
# ==========================================================

def get_dashboard_analytics(
    db: Session,
    camera_id: int = 1,
):
    """
    Dashboard API

    Combines:
    1. Database statistics
    2. Live AI statistics
    """

    stats = get_stats(camera_id)

    if stats is None:
        stats = {}

    camera = (
        db.query(models.Camera)
        .filter(models.Camera.id == camera_id)
        .first()
    )

    camera_status = (
        camera.status
        if camera
        else "Offline"
    )

    total_stores = db.query(models.Store).count()

    total_shelves = db.query(models.Shelf).count()

    total_products = db.query(models.Product).count()

    total_cameras = db.query(models.Camera).count()

    total_users = db.query(models.User).count()

    low_stock_products = (
        db.query(models.Product)
        .filter(models.Product.stock < 20)
        .count()
    )

    return {

        # ===========================
        # Database Statistics
        # ===========================

        "total_stores": total_stores,

        "total_shelves": total_shelves,

        "total_products": total_products,

        "total_cameras": total_cameras,

        "total_users": total_users,

        "low_stock_products": low_stock_products,

        # ===========================
        # Live AI Statistics
        # ===========================

        "current_persons": stats.get(
            "current_persons",
            0,
        ),

        "total_customers": stats.get(
            "total_customers",
            0,
        ),

        "products_detected": stats.get(
            "products_detected",
            0,
        ),

        "product_interactions": stats.get(
            "product_interactions",
            0,
        ),

        "attention_score": stats.get(
            "attention_score",
            0,
        ),

        "average_dwell": stats.get(
            "average_dwell",
            0,
        ),

        "heatmap_points": stats.get(
            "heatmap_points",
            0,
        ),

        "tracked_paths": stats.get(
            "tracked_paths",
            0,
        ),

        "peak_zone": stats.get(
            "peak_zone",
            "None",
        ),

        "store_congestion": stats.get(
            "store_congestion",
            "Low",
        ),

        "customer_flow": stats.get(
            "customer_flow",
            "Normal",
        ),

        "engagement_level": stats.get(
            "engagement_level",
            "Low",
        ),

        "camera_status": camera_status,

        "system_status": stats.get(
            "system_status",
            "Running",
        ),

        "ai_recommendation": stats.get(
            "ai_recommendation",
            "Monitoring...",
        ),

        "dashboard_summary": stats.get(
            "dashboard_summary",
            {},
        ),

        "last_updated": stats.get(
            "last_updated",
            datetime.now(),
        ),
    }

# ==========================================================
# REPORT DASHBOARD
# ==========================================================

def get_report_dashboard(db: Session):

    return {

        "total_stores": db.query(models.Store).count(),

        "total_shelves": db.query(models.Shelf).count(),

        "total_products": db.query(models.Product).count(),

        "total_cameras": db.query(models.Camera).count(),

        "total_users": db.query(models.User).count(),

        "generated_at": datetime.now(),

    }


# ==========================================================
# AI DASHBOARD
# ==========================================================

def get_ai_dashboard(
    db: Session,
    camera_id: int = 1,
):

    stats = get_stats(camera_id)

    if stats is None:
        stats = {}

    camera = (
        db.query(models.Camera)
        .filter(models.Camera.id == camera_id)
        .first()
    )

    camera_status = (
        camera.status
        if camera
        else "Unknown"
    )

    # =====================================
    # Historical Database Statistics
    # =====================================

    total_visitors = db.query(models.Consumer).count()

    male_visitors = (
        db.query(models.Consumer)
        .filter(models.Consumer.gender == "Male")
        .count()
    )

    female_visitors = (
        db.query(models.Consumer)
        .filter(models.Consumer.gender == "Female")
        .count()
    )

    child_visitors = (
        db.query(models.Consumer)
        .filter(models.Consumer.age_group == "Child")
        .count()
    )

    adult_visitors = (
        db.query(models.Consumer)
        .filter(models.Consumer.age_group == "Adult")
        .count()
    )

    senior_visitors = (
        db.query(models.Consumer)
        .filter(models.Consumer.age_group == "Senior")
        .count()
    )

    active_cameras = (
        db.query(models.Camera)
        .filter(models.Camera.status == "Online")
        .count()
    )

    offline_cameras = (
        db.query(models.Camera)
        .filter(models.Camera.status == "Offline")
        .count()
    )

    # =====================================
    # Shopping Behaviour
    # =====================================

    interactions = stats.get(
        "product_interactions",
        0,
    )

    if interactions == 0:

        shopping_behavior = "No Activity"

    elif interactions < 5:

        shopping_behavior = "Browsing"

    elif interactions < 10:

        shopping_behavior = "Engaged"

    else:

        shopping_behavior = "Highly Engaged"

    # =====================================
    # Customer Flow
    # =====================================

    persons = stats.get(
        "current_persons",
        0,
    )

    if persons == 0:

        customer_flow = "Empty"

    elif persons < 5:

        customer_flow = "Normal"

    elif persons < 10:

        customer_flow = "Busy"

    else:

        customer_flow = "Crowded"

    # =====================================
    # Dashboard Response
    # =====================================

    return {

        # Historical

        "total_visitors": total_visitors,

        "male_visitors": male_visitors,

        "female_visitors": female_visitors,

        "child_visitors": child_visitors,

        "adult_visitors": adult_visitors,

        "senior_visitors": senior_visitors,

        "active_cameras": active_cameras,

        "offline_cameras": offline_cameras,

        # Live AI

        "current_persons": stats.get("current_persons", 0),

        "total_customers": stats.get("total_customers", 0),

        "attention_score": stats.get("attention_score", 0),

        "average_attention": stats.get("attention_score", 0),

        "average_dwell": stats.get("average_dwell", 0),

        "average_dwell_time": stats.get("average_dwell", 0),

        "product_interactions": stats.get(
            "product_interactions",
            0,
        ),

        "products_detected": stats.get(
            "products_detected",
            0,
        ),

        "heatmap_active": stats.get(
            "heatmap_active",
            False,
        ),

        "heatmap_points": stats.get(
            "heatmap_points",
            0,
        ),

        "tracked_paths": stats.get(
            "tracked_paths",
            0,
        ),

        "path_tracking": stats.get(
            "path_tracking",
            False,
        ),

        "engagement_level": stats.get(
            "engagement_level",
            "Low",
        ),

        "store_congestion": stats.get(
            "store_congestion",
            "Low",
        ),

        "system_status": stats.get(
            "system_status",
            "Running",
        ),

        "camera_status": camera_status,

        "ai_recommendation": stats.get(
            "ai_recommendation",
            "Customer activity is normal.",
        ),

        "dominant_emotion": stats.get(
            "dominant_emotion",
            "Neutral",
        ),

        "emotion_distribution": stats.get(
            "emotion_distribution",
            {},
        ),

        "male_count": stats.get(
            "male_count",
            0,
        ),

        "female_count": stats.get(
            "female_count",
            0,
        ),

        "dashboard_summary": stats.get(
            "dashboard_summary",
            "System running normally.",
        ),

        "last_updated": datetime.now(),

        # Compatibility

        "happy_count": 0,

        "neutral_count": 0,

        "angry_count": 0,

        "surprised_count": 0,

        "top_store": "-",

        "top_product": "-",

        "shopping_behavior": shopping_behavior,

        "customer_flow": customer_flow,

    }


# ==========================================================
# NOTIFICATIONS
# ==========================================================# ==========================================================
# NOTIFICATIONS
# ==========================================================

def get_notifications(
    db: Session,
    camera_id: int = 1,
):

    stats = get_stats(camera_id)

    if stats is None:
        return []

    notifications = []

    notification_id = 1

    # ======================================================
    # Camera Status
    # ======================================================

    if stats.get("system_status", "Running") == "Running":

        notifications.append({

            "id": notification_id,

            "title": "Camera Online",

            "message": (
                f"Camera {camera_id} is operating normally."
            ),

            "type": "success",

            "created_at": datetime.now(),

        })

    else:

        notifications.append({

            "id": notification_id,

            "title": "Camera Offline",

            "message": (
                f"Camera {camera_id} is not responding."
            ),

            "type": "danger",

            "created_at": datetime.now(),

        })

    notification_id += 1

    # ======================================================
    # Current Persons
    # ======================================================

    current = stats.get("current_persons", 0)

    if current == 0:

        notifications.append({

            "id": notification_id,

            "title": "No Customer Activity",

            "message": (
                f"No customers detected on Camera {camera_id}."
            ),

            "type": "info",

            "created_at": datetime.now(),

        })

    elif current >= HIGH_CROWD:

        notifications.append({

            "id": notification_id,

            "title": "High Crowd Density",

            "message": (
                f"{current} customers detected."
            ),

            "type": "warning",

            "created_at": datetime.now(),

        })

    else:

        notifications.append({

            "id": notification_id,

            "title": "Customer Activity",

            "message": (
                f"{current} customers currently visible."
            ),

            "type": "success",

            "created_at": datetime.now(),

        })

    notification_id += 1

    # ======================================================
    # Attention Score
    # ======================================================

    attention = stats.get("attention_score", 0)

    if attention >= HIGH_ATTENTION:

        notifications.append({

            "id": notification_id,

            "title": "High Customer Attention",

            "message": (
                f"Attention Score is {attention}%."
            ),

            "type": "success",

            "created_at": datetime.now(),

        })

    elif attention < LOW_ATTENTION:

        notifications.append({

            "id": notification_id,

            "title": "Low Customer Attention",

            "message": (
                f"Attention Score dropped to {attention}%."
            ),

            "type": "warning",

            "created_at": datetime.now(),

        })

    notification_id += 1

    # ======================================================
    # Average Dwell Time
    # ======================================================

    dwell = stats.get("average_dwell", 0)

    if dwell >= HIGH_DWELL:

        notifications.append({

            "id": notification_id,

            "title": "High Dwell Time",

            "message": (
                f"Average dwell time is {dwell} seconds."
            ),

            "type": "info",

            "created_at": datetime.now(),

        })

        notification_id += 1

    # ======================================================
    # Product Interactions
    # ======================================================

    interactions = stats.get(
        "product_interactions",
        0,
    )

    if interactions > HIGH_INTERACTIONS:

        notifications.append({

            "id": notification_id,

            "title": "Customer Interaction",

            "message": (
                f"{interactions} product interactions detected."
            ),

            "type": "success",

            "created_at": datetime.now(),

        })

        notification_id += 1

    # ======================================================
    # Store Congestion
    # ======================================================

    congestion = stats.get(
        "store_congestion",
        "Low",
    )

    if congestion == "High":

        notifications.append({

            "id": notification_id,

            "title": "Store Congestion",

            "message": (
                "High customer density detected."
            ),

            "type": "warning",

            "created_at": datetime.now(),

        })

        notification_id += 1

    # ======================================================
    # AI Recommendation
    # ======================================================

    notifications.append({

        "id": notification_id,

        "title": "AI Recommendation",

        "message": stats.get(

            "ai_recommendation",

            "Customer activity is normal.",

        ),

        "type": "info",

        "created_at": datetime.now(),

    })

    return notifications


# ==========================================================
# REPORT EXPORT IMPORTS
# ==========================================================
# ==========================================================
# REPORT EXPORT FUNCTIONS
# ==========================================================

REPORT_FOLDER = "reports"

if not os.path.exists(REPORT_FOLDER):
    os.makedirs(REPORT_FOLDER)


def export_report_pdf(db: Session, camera_id: int = 1):

    stats = get_stats(camera_id)

    if stats is None:
        stats = {}

    filename = os.path.join(
        REPORT_FOLDER,
        f"report_{camera_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    )

    doc = SimpleDocTemplate(filename)

    styles = getSampleStyleSheet()

    elements = []

    elements.append(Paragraph("<b>Consumer Attention Mapping Report</b>", styles["Title"]))

    elements.append(Paragraph(f"Generated: {datetime.now()}", styles["Normal"]))

    elements.append(Paragraph("<br/>", styles["Normal"]))

    report_items = [

        ("Current Persons", stats.get("current_persons", 0)),
        ("Total Customers", stats.get("total_customers", 0)),
        ("Attention Score", stats.get("attention_score", 0)),
        ("Average Dwell", stats.get("average_dwell", 0)),
        ("Product Interactions", stats.get("product_interactions", 0)),
        ("Products Detected", stats.get("products_detected", 0)),
        ("Store Congestion", stats.get("store_congestion", "Low")),
        ("Dominant Emotion", stats.get("dominant_emotion", "Neutral")),
        ("Engagement Level", stats.get("engagement_level", "Low")),
        ("System Status", stats.get("system_status", "Running")),
    ]

    for key, value in report_items:

        elements.append(
            Paragraph(f"<b>{key}</b>: {value}", styles["Normal"])
        )

    doc.build(elements)

    return filename


def export_report_excel(db: Session, camera_id: int = 1):

    stats = get_stats(camera_id)

    if stats is None:
        stats = {}

    filename = os.path.join(
        REPORT_FOLDER,
        f"report_{camera_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    )

    wb = Workbook()

    ws = wb.active

    ws.title = "AI Report"

    ws.append(["Metric", "Value"])

    for key, value in stats.items():

        ws.append([key, value])

    wb.save(filename)

    return filename


def export_report_csv(db: Session, camera_id: int = 1):

    stats = get_stats(camera_id)

    if stats is None:
        stats = {}

    filename = os.path.join(
        REPORT_FOLDER,
        f"report_{camera_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    )

    with open(filename, "w", newline="", encoding="utf-8") as file:

        writer = csv.writer(file)

        writer.writerow(["Metric", "Value"])

        for key, value in stats.items():

            writer.writerow([key, value])

    return filename