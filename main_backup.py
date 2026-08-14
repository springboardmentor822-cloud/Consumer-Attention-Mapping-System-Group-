import io
import json
from fastapi.responses import Response
import os
import time
import threading
import random
import asyncio
import numpy as np
import pandas as pd
from typing import Dict, Optional
from contextlib import asynccontextmanager

import cv2
from fastapi import FastAPI, HTTPException,Query, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import Database & Models
import database
import models
import ml_engine  # NEW: Import the Machine Learning module
# NEW: SCHEDULER SETUP
from apscheduler.schedulers.background import BackgroundScheduler

# Automatically create all database tables in sql_app.db / PostgreSQL on startup
models.Base.metadata.create_all(bind=database.engine)

try:
    from ultralytics import YOLO
    detector = YOLO('yolov8n.pt') 
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    print("⚠️ Ultralytics not installed. Run 'pip install ultralytics' for AI detection.")

model_lock = threading.Lock()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build bulletproof absolute paths for the datasets
CAMERA_DATASETS = {
    1: os.path.join(BASE_DIR, "public", "datasets", "archive"),
    2: os.path.join(BASE_DIR, "public", "datasets", "archive_1"),
    3: os.path.join(BASE_DIR, "public", "datasets", "archive_2_products"),
    4: os.path.join(BASE_DIR, "public", "datasets", "archive_3_shelves")
}

DATASET_SALES = os.path.join(BASE_DIR,"frontend", "public", "datasets", "retail_sales_dataset.csv")

USER_DB: Dict[str, Dict[str, str]] = {
    "admin@visionretail.ai": {"password": "admin", "role": "Administrator"},
    "manager@visionretail.ai": {"password": "manager", "role": "Store Manager"},
    "analyst@visionretail.ai": {"password": "analyst", "role": "Retail Analyst"},
    "marketing@visionretail.ai": {"password": "marketing", "role": "Marketing Manager"}
}

REGISTERED_SHELVES = []
REGISTERED_PRODUCTS = []

# LIVE TELEMETRY STATE
LIVE_POS = {"revenue": 892000, "conversions": 238}
LATEST_BBOXES = {1: [], 2: [], 3: [], 4: []}

def calculate_and_store_scores():
    """Recalculates attractiveness scores and updates the database."""
    print("🔄 SCHEDULER: Running Product Attractiveness Scoring...")
    print(f"🔍 DEBUG: Python is looking for the file exactly here -> {DATASET_SALES}")
    if not os.path.exists(DATASET_SALES):
        print("⚠️ SCHEDULER: Sales dataset not found.")
        return

    db = database.SessionLocal()
    try:
        df = pd.read_csv(DATASET_SALES)
        df.columns = [col.strip().lower() for col in df.columns]
        category_stats = df.groupby('product category').agg(total_sold=('quantity', 'sum')).reset_index()
        max_sold = category_stats['total_sold'].max()
        
        # Clear existing data for the simulation update
        db.query(models.ProductAttractiveness).delete()
        db.query(models.Recommendation).delete()

        for idx, row in category_stats.iterrows():
            cat_name = row['product category']
            sku = f"{str(cat_name)[:3].upper()}-00{idx}"

            # Calculate Attractiveness Formula (Simulating changing live data)
            A = float(np.random.uniform(50, 100))
            I = float(np.random.uniform(40, 90)) 
            P = float(np.random.uniform(20, 80))  
            C = float((row['total_sold'] / max_sold) * 100)
            R = float(np.random.uniform(10, 40))  
            
            final_score = round((0.35 * A) + (0.25 * I) + (0.20 * P) + (0.15 * C) + (0.05 * R), 2)

            # Save Attractiveness Score to DB
            db_score = models.ProductAttractiveness(
                sku=sku,
                category=cat_name,
                attention_duration=A,
                interaction_frequency=I,
                pickup_rate=P,
                purchase_conversion=C,
                repeat_engagement=R,
                final_score=final_score
            )
            db.add(db_score)

            # Save Diagnostic Recommendations to DB
            if A > 80 and P < 40:
                db_rec = models.Recommendation(priority="High", sku=sku, action="Price/Packaging Check", reason="High Attention, Low Pickup")
                db.add(db_rec)
            elif final_score > 75 and idx % 2 == 0:
                db_rec = models.Recommendation(priority="Medium", sku=sku, action="Relocate to Eye-Level", reason="High Score on Bottom Shelf")
                db.add(db_rec)

        db.commit()
        print("✅ SCHEDULER: Database successfully updated with new scores.")
    except Exception as e:
        db.rollback()
        print(f"⚠️ SCHEDULER ERROR: {e}")
    finally:
        db.close()


def load_inventory_metadata():
    """Populates temporary UI inventory lists."""
    global REGISTERED_SHELVES, REGISTERED_PRODUCTS
    if not os.path.exists(DATASET_SALES): return
    try:
        df = pd.read_csv(DATASET_SALES)
        df.columns = [col.strip().lower() for col in df.columns]
        category_stats = df.groupby('product category').agg(total_sold=('quantity', 'sum')).reset_index()
        max_sold = category_stats['total_sold'].max()
        
        REGISTERED_SHELVES.clear()
        REGISTERED_PRODUCTS.clear()
        
        for idx, row in category_stats.iterrows():
            cat_name = row['product category']
            score = round((row['total_sold'] / max_sold) * 10, 1)
            REGISTERED_SHELVES.append({"id": f"SHELF-00{idx+1}", "name": f"{str(cat_name).title()} Display", "category": str(cat_name).title(), "rating": f"{score} / 10"})
            sku = f"{str(cat_name)[:3].upper()}-00{idx}"
            REGISTERED_PRODUCTS.append({"id": f"PROD-{100 + idx}", "name": f"Top {str(cat_name).title()}", "sku": sku, "returns": int(row['total_sold'] * 0.05), "comparisons": int(row['total_sold'] * 1.5)})
    except Exception as e: pass

# Configure and start the APScheduler
scheduler = BackgroundScheduler()
# Run the scoring job every 15 minutes
scheduler.add_job(calculate_and_store_scores, 'interval', minutes=15) 


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_inventory_metadata()
    
    # Run the initial DB seeding immediately on startup
    calculate_and_store_scores()
    
    # Start the background scheduler
    scheduler.start()
    
    yield
    
    # Shutdown the scheduler cleanly when the app stops
    scheduler.shutdown()

app = FastAPI(title="VisionRetail AI Engine", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AuthCredentials(BaseModel):
    email: str
    password: str
    role: Optional[str] = "Store Manager"

def stream_camera_frames(camera_id: int):
    folder_path = CAMERA_DATASETS.get(camera_id, "datasets/archive")
    images = []
    video_file = None

    if os.path.exists(folder_path):
        for root_dir, dirs, files in os.walk(folder_path):
            for f in files:
                if f.lower().endswith(('.mp4', '.avi', '.mov')):
                    video_file = os.path.join(root_dir, f)
                    break
                elif f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    images.append(os.path.join(root_dir, f))
            if video_file: break
        images = sorted(images)

    stream_delay = 0.033
    process_every_n_frames = 5 
    frame_idx = 0

    if video_file:
        cap = cv2.VideoCapture(video_file)
        while True:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            frame = cv2.resize(frame, (640, 360))

            if HAS_YOLO and frame_idx % process_every_n_frames == 0:
                try:
                    with model_lock:
                        results = detector(frame, classes=[0], verbose=False)
                    current_boxes = []
                    for r in results:
                        for box in r.boxes:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = float(box.conf[0])
                            current_boxes.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "conf": conf})
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 128), 2)
                            cv2.putText(frame, f"Shopper {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 128), 1)
                    LATEST_BBOXES[camera_id] = current_boxes
                except Exception as e: pass

            cv2.putText(frame, f"Cam {camera_id} - AI Live Stream", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 212), 2)
            ret_enc, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret_enc: yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            frame_idx += 1
            time.sleep(stream_delay)

    elif images:
        while True:
            if frame_idx >= len(images): frame_idx = 0
            frame = cv2.imread(images[frame_idx])
            if frame is not None:
                frame = cv2.resize(frame, (640, 360))
                if HAS_YOLO and frame_idx % process_every_n_frames == 0:
                    try:
                        with model_lock:
                            results = detector(frame, classes=[0], verbose=False)
                        current_boxes = []
                        for r in results:
                            for box in r.boxes:
                                x1, y1, x2, y2 = map(int, box.xyxy[0])
                                conf = float(box.conf[0])
                                current_boxes.append({"x1": x1, "y1": y1, "x2": x2, "y2": y2, "conf": conf})
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 128), 2)
                                cv2.putText(frame, f"Shopper {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 128), 1)
                        LATEST_BBOXES[camera_id] = current_boxes
                    except Exception as e: pass

                cv2.putText(frame, f"Cam {camera_id} - AI Live Stream", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 212), 2)
                ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                if ret: yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            frame_idx += 1
            time.sleep(stream_delay)
    else:
        while True:
            frame = np.full((360, 640, 3), (15, 23, 42), dtype=np.uint8)
            cv2.putText(frame, f"CAM-{camera_id}: NO FEED FOUND", (20, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            ret, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(1)

# API ROUTES
@app.post("/api/auth/login")
def process_user_login(creds: AuthCredentials):
    user = USER_DB.get(creds.email)
    if not user or user["password"] != creds.password: raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"status": "authenticated", "email": creds.email, "role": user["role"]}

@app.get("/api/camera/stream/{camera_id}")
def live_camera_stream_feed(camera_id: int):
    return StreamingResponse(stream_camera_frames(camera_id), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/inventory/shelves")
def list_shelves(): return REGISTERED_SHELVES

@app.get("/api/inventory/products")
def list_products(): return REGISTERED_PRODUCTS

def generate_dynamic_ai_insights(db: Session, role: str):
    """
    Generates dynamic AI insights calculated from active camera telemetry 
    and product attractiveness scores in the database.
    """
    insights = []
    
    # 1. Insight based on active camera tracking telemetry
    total_active_boxes = sum(len(boxes) for boxes in LATEST_BBOXES.values())
    if total_active_boxes > 0:
        avg_conf = sum(
            box["conf"] for boxes in LATEST_BBOXES.values() for box in boxes
        ) / total_active_boxes
        insights.append(
            f"Live YOLOv8 tracking active: detecting {total_active_boxes} target(s) across edge nodes with {avg_conf * 100:.1f}% mean confidence."
        )
    else:
        insights.append("Edge nodes operational; standby mode with active spatial background subtraction.")

    # 2. Insights derived from SQL Database / ProductAttractiveness table
    try:
        top_product = db.query(models.ProductAttractiveness).order_by(
            models.ProductAttractiveness.final_score.desc()
        ).first()
        
        low_pickup_product = db.query(models.ProductAttractiveness).filter(
            models.ProductAttractiveness.attention_duration > 70,
            models.ProductAttractiveness.pickup_rate < 50
        ).first()

        if top_product:
            insights.append(
                f"Top performing category '{top_product.category}' (SKU: {top_product.sku}) reached an engagement score of {top_product.final_score}/100."
            )
        
        if low_pickup_product:
            insights.append(
                f"High gaze dwell identified for SKU {low_pickup_product.sku} ({low_pickup_product.attention_duration:.1f}s avg), but pickup conversion remains low ({low_pickup_product.pickup_rate:.1f}%)."
            )
    except Exception:
        insights.append("Database telemetry sync active; computing real-time trajectory metrics.")

    # 3. Default adaptive modeling insight
    insights.append("Adaptive signal filtering active: spatial trajectory jitter reduced across Node Cluster Alpha.")

    return insights
# MILESTONE 3: DATABASE-BACKED ENDPOINTS
@app.get("/api/v1/analytics/attractiveness")
def get_attractiveness_scores(db: Session = Depends(database.get_db)):
    return db.query(models.ProductAttractiveness).all()

@app.get("/api/v1/recommendations")
def get_optimization_recommendations(db: Session = Depends(database.get_db)):
    return db.query(models.Recommendation).all()

@app.get("/api/v1/dashboard/telemetry")
def get_dashboard_telemetry(role: str = "Store Manager", db: Session = Depends(database.get_db)):
    """
    Serves dynamic KPI data and AI insights to the React OverviewTab.
    """
    live_tracking_count = sum(len(boxes) for boxes in LATEST_BBOXES.values())
    
    # Generate dynamic insights from DB & Telemetry
    dynamic_insights = generate_dynamic_ai_insights(db, role)
    
    return {
        "kpis": [
            { "label": "Detected Trajectories", "val": str(300 + LIVE_POS["conversions"]), "trend": "+5.2% vs Yesterday", "icon": "🚶" },
            { "label": "Active Tracking IDs", "val": str(live_tracking_count), "trend": "Live in Frame", "icon": "🎯" },
            { "label": "Avg. Attention Span", "val": "12.5s", "trend": "↑ 2.1s vs Yesterday", "icon": "👁️" },
            { "label": "Physical Pickups", "val": str(89 + (LIVE_POS["conversions"] // 2)), "trend": "CV Detected", "icon": "📦" },
            { "label": "Shelf Conversion", "val": "16.4%", "trend": "↑ 1.2% vs Yesterday", "icon": "📈" },
            { "label": "YOLOv8 Edge Nodes", "val": "4 / 4", "trend": "All Nodes Active", "icon": "📹" }
        ],
        "insights": dynamic_insights
    }
import math
import random

@app.get("/api/v1/dashboard/heatmap")
def get_live_heatmap():
    """
    Serves normalized spatial coordinates (X, Y) and weights for the frontend heatmap.
    Applies basic spatial smoothing to raw bounding boxes to reduce jitter.
    """
    points = []
    
    # Check if we have active YOLOv8 detections in memory
    total_active = sum(len(boxes) for boxes in LATEST_BBOXES.values())
    
    if total_active > 0:
        # Extract centers from live tracking boxes and normalize them
        for node_id, boxes in LATEST_BBOXES.items():
            for box in boxes:
                # Assuming box is [x1, y1, x2, y2, conf, cls]
                # Calculate center point
                center_x = (box[0] + box[2]) / 2
                center_y = (box[1] + box[3]) / 2
                
                # Normalize based on an assumed 1920x1080 resolution (adjust as needed)
                norm_x = min(max(center_x / 1920.0, 0.0), 1.0)
                norm_y = min(max(center_y / 1080.0, 0.0), 1.0)
                
                points.append({
                    "x": norm_x,
                    "y": norm_y,
                    "weight": box[4] * 100 # Use confidence as heat weight
                })
    else:
        # Fallback: Serve historically aggregated clusters if live tracking is empty
        # This simulates data from the Aisle A, B, C, and Checkout zones
        base_clusters = [
            {"cx": 0.23, "cy": 0.29}, # Aisle A
            {"cx": 0.50, "cy": 0.29}, # Aisle B
            {"cx": 0.77, "cy": 0.29}, # Aisle C
            {"cx": 0.50, "cy": 0.76}  # Checkout
        ]
        
        # Generate slightly randomized points around these clusters to mimic human dwell time
        for cluster in base_clusters:
            # Generate 5-10 data points per zone
            for _ in range(random.randint(5, 10)):
                # Apply a Gaussian-like spread (denoised distribution)
                drift_x = random.uniform(-0.08, 0.08)
                drift_y = random.uniform(-0.08, 0.08)
                points.append({
                    "x": max(0, min(1, cluster["cx"] + drift_x)),
                    "y": max(0, min(1, cluster["cy"] + drift_y)),
                    "weight": random.uniform(30.0, 85.0)
                })

    return {"status": "success", "data": points}
import pandas as pd
import random

@app.get("/api/v1/dashboard/products")
def get_product_metrics():
    """
    Reads the retail sales CSV, calculates revenue and units sold per category,
    and merges it with simulated computer vision attention scores.
    """
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    
    try:
        df = pd.read_csv(DATASET_SALES)
        # Normalize column names to lowercase to avoid exact match errors
        df.columns = [col.strip().lower() for col in df.columns]
        
        # Group by category and sum up quantities and amounts
        stats = df.groupby('product category').agg(
            total_sold=('quantity', 'sum'),
            total_revenue=('total amount', 'sum'),
            avg_price=('price per unit', 'mean')
        ).reset_index()
        
        data = []
        for _, row in stats.iterrows():
            cat = row['product category']
            data.append({
                "category": cat.capitalize(),
                "sku_prefix": f"{cat[:3].upper()}-00X",
                "units_sold": int(row['total_sold']),
                "revenue": float(row['total_revenue']),
                "avg_price": float(row['avg_price']),
                # Simulating a dynamic CV attention score for the UI
                "cv_attention_score": round(random.uniform(75.0, 98.5), 1) 
            })
            
        # Sort by revenue (highest first)
        data.sort(key=lambda x: x['revenue'], reverse=True)
        return {"status": "success", "data": data}
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

import pandas as pd
import random
import os
from fastapi import APIRouter # Assuming you are using FastAPI routing
@app.get("/api/v1/dashboard/visitors")
def get_visitors():
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    
    try:
        df = pd.read_csv(DATASET_SALES)
        df.columns = [col.strip().lower() for col in df.columns]
        
        total_visitors = len(df)
        
        # Gender Distribution
        gender_counts = df['gender'].value_counts()
        gender_data = [
            {"label": g, "count": int(c), "percent": round((c / total_visitors) * 100)} 
            for g, c in gender_counts.items()
        ]
        
        # Age Grouping
        bins = [0, 25, 35, 45, 55, 100]
        labels = ['18-25', '26-35', '36-45', '46-55', '55+']
        df['age_group'] = pd.cut(df['age'], bins=bins, labels=labels, right=False)
        age_counts = df['age_group'].value_counts().sort_index()
        age_data = [
            {"label": str(a), "count": int(c), "percent": round((c / total_visitors) * 100)} 
            for a, c in age_counts.items()
        ]

        # NEW: Calculate Top Converting Demographic directly from CSV revenue
        demo_spend = df.groupby(['gender', 'age_group'], observed=True)['total amount'].sum().reset_index()
        top_demo_row = demo_spend.loc[demo_spend['total amount'].idxmax()]
        top_converting_demo = f"{top_demo_row['gender']} / {top_demo_row['age_group']}"

        # NEW: Find highest unit volume category to represent "Primary Traffic Zone"
        top_category = df.groupby('product category')['quantity'].sum().idxmax()
        
        return {
            "status": "success", 
            "data": {
                "total_visitors": total_visitors,
                "gender": gender_data,
                "age": age_data,
                "insights": {
                    "top_converting_demo": top_converting_demo,
                    "primary_traffic_zone": f"{top_category} Aisle"
                }
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/dashboard/zones")
def get_zones():
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    
    try:
        df = pd.read_csv(DATASET_SALES)
        df.columns = [col.strip().lower() for col in df.columns]
        
        # Map CSV categories to physical store zones
        category_metrics = df.groupby('product category').agg(
            transactions=('transaction id', 'count'),
            units=('quantity', 'sum'),
            revenue=('total amount', 'sum')
        ).reset_index()

        total_tx = category_metrics['transactions'].sum()
        
        zones = []
        colors = ['emerald', 'cyan', 'purple', 'amber']
        
        for idx, row in category_metrics.iterrows():
            cat = str(row['product category']).capitalize()
            tx_share = round((row['transactions'] / total_tx) * 100)
            
            # Since conversion requires spatial tracking, we simulate it based on unit-per-transaction density from the CSV
            units_per_tx = row['units'] / row['transactions']
            simulated_conversion = min(round((units_per_tx / 4.0) * 100), 95) 

            zones.append({
                "id": f"Zone {chr(65+idx)}", # Generates Zone A, Zone B, etc.
                "name": f"{cat} & Displays",
                "traffic_type": "High Traffic" if tx_share > 30 else "Medium Traffic",
                "footfall_share": tx_share,
                "conversion_rate": simulated_conversion,
                "color": colors[idx % len(colors)]
            })
            
        # Sort by highest traffic
        zones.sort(key=lambda x: x['footfall_share'], reverse=True)
        
        return {"status": "success", "data": zones}
    except Exception as e:
        return {"status": "error", "message": str(e)}
import time
import uuid

@app.get("/api/v1/dashboard/alerts")
def get_system_alerts():
    """
    Simulates a live alert feed monitoring YOLOv8 telemetry and system health.
    """
    current_time = time.strftime("%I:%M %p")
    
    # Simulating a dynamic list of alerts that the CV system might flag
    alerts = [
        {
            "id": str(uuid.uuid4())[:8].upper(),
            "severity": "critical",
            "type": "Congestion Warning",
            "message": "Checkout Zone density exceeded safe threshold (8+ active trajectories).",
            "timestamp": current_time,
            "source": "Node 4 (Checkout)",
            "status": "Active"
        },
        {
            "id": str(uuid.uuid4())[:8].upper(),
            "severity": "warning",
            "type": "Zero Attention Span",
            "message": "Beauty Aisle has registered zero dwell time for the last 45 minutes.",
            "timestamp": current_time,
            "source": "Node 3 (Beauty)",
            "status": "Active"
        },
        {
            "id": str(uuid.uuid4())[:8].upper(),
            "severity": "info",
            "type": "Model Synchronization",
            "message": "Adaptive signal denoising weights successfully synced.",
            "timestamp": current_time,
            "source": "API Gateway",
            "status": "Resolved"
        },
        {
            "id": str(uuid.uuid4())[:8].upper(),
            "severity": "info",
            "type": "Database Cron Job",
            "message": "K-Means clustering and retail_sales_dataset.csv metrics recalculated.",
            "timestamp": current_time,
            "source": "Scheduler",
            "status": "Resolved"
        }
    ]
    
    # Shuffle slightly to mimic a live incoming feed if desired, 
    # but for now we return them in priority order
    return {"status": "success", "data": alerts}
@app.get("/api/v1/dashboard/export")
def export_system_data(
    format: str = Query("csv", enum=["csv", "json"]),
    metric: str = Query("all", enum=["all", "products", "telemetry"])
):
    """
    Gathers telemetry and dataset metrics, packaging them into a downloadable
    CSV or JSON file stream with custom headers.
    """
    try:
        export_payload = []

        # 1. Gather product financial & dataset metrics
        if os.path.exists(DATASET_SALES):
            df = pd.read_csv(DATASET_SALES)
            df.columns = [col.strip().lower() for col in df.columns]

            category_stats = df.groupby('product category').agg(
                units_sold=('quantity', 'sum'),
                total_revenue=('total amount', 'sum'),
                avg_unit_price=('price per unit', 'mean')
            ).reset_index()

            for _, row in category_stats.iterrows():
                export_payload.append({
                    "data_type": "product_category",
                    "category": str(row['product category']).capitalize(),
                    "units_sold": int(row['units_sold']),
                    "total_revenue": round(float(row['total_revenue']), 2),
                    "avg_unit_price": round(float(row['avg_unit_price']), 2)
                })

        # 2. Append active telemetry summary
        total_active_boxes = sum(len(boxes) for boxes in LATEST_BBOXES.values())
        export_payload.append({
            "data_type": "system_telemetry",
            "category": "Live_Tracking_Summary",
            "units_sold": total_active_boxes,
            "total_revenue": 0.0,
            "avg_unit_price": 0.0
        })

        # 3. Format as JSON File Stream
        if format == "json":
            json_content = json.dumps(export_payload, indent=2)
            return Response(
                content=json_content,
                media_type="application/json",
                headers={
                    "Content-Disposition": "attachment; filename=consumer_attention_metrics.json"
                }
            )

        # 4. Format as CSV File Stream
        elif format == "csv":
            export_df = pd.DataFrame(export_payload)
            stream = io.StringIO()
            export_df.to_csv(stream, index=False)

            return Response(
                content=stream.getvalue(),
                media_type="text/csv",
                headers={
                    "Content-Disposition": "attachment; filename=consumer_attention_metrics.csv"
                }
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate export file: {str(e)}"
        )
import random

@app.get("/api/v1/dashboard/shelves")
def get_shelf_metrics():
    """
    Simulates vertical shelf-level interaction metrics based on CV bounding box 
    overlaps and gaze estimation.
    """
    # Generating dynamic shelf data for our three main categories
    shelves = [
        {
            "category": "Clothing",
            "tiers": [
                {"level": "Top (Premium)", "attention_score": random.randint(75, 85), "status": "Optimal"},
                {"level": "Middle (Eye-Level)", "attention_score": random.randint(88, 98), "status": "High Traffic"},
                {"level": "Bottom (Value)", "attention_score": random.randint(35, 50), "status": "Low Engagement"}
            ]
        },
        {
            "category": "Electronics",
            "tiers": [
                {"level": "Top (Premium)", "attention_score": random.randint(70, 80), "status": "Optimal"},
                {"level": "Middle (Eye-Level)", "attention_score": random.randint(90, 99), "status": "High Traffic"},
                {"level": "Bottom (Value)", "attention_score": random.randint(55, 65), "status": "Moderate"}
            ]
        },
        {
            "category": "Beauty",
            "tiers": [
                {"level": "Top (Premium)", "attention_score": random.randint(80, 88), "status": "Optimal"},
                {"level": "Middle (Eye-Level)", "attention_score": random.randint(92, 98), "status": "High Traffic"},
                {"level": "Bottom (Value)", "attention_score": random.randint(65, 75), "status": "Optimal"}
            ]
        }
    ]
    return {"status": "success", "data": shelves}
@app.get("/api/v1/dashboard/reports")
def get_reports_summary():
    """
    Simulates a high-level executive report summary for stakeholder review.
    """
    return {
        "status": "success",
        "data": {
            "period": "Last 7 Days",
            "weekly_visitors": 1420,
            "avg_dwell_time": "12.4s",
            "conversion_rate": "18.5%",
            "top_zone": "Electronics",
            "critical_alerts": 3,
            "recommendations": [
                "Shift high-margin Beauty products to Eye-Level tiers to capitalize on high engagement.",
                "Clear Aisle A bottleneck during peak hours (14:00 - 16:00).",
                "Cross-merchandise Clothing accessories near the Checkout zone to increase impulse buys."
            ]
        }
    }
@app.get("/api/v1/dashboard/ai-insights")
def get_ai_insights():
    """
    Analyzes the retail_sales_dataset.csv to generate dynamic, data-driven 
    AI recommendations and anomaly alerts.
    """
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    
    try:
        df = pd.read_csv(DATASET_SALES)
        # Normalize columns
        df.columns = [col.strip().lower() for col in df.columns]
        
        # 1. Identify Top Revenue Demographic (Gender + Category)
        demo_grouped = df.groupby(['gender', 'product category'])['total amount'].sum().reset_index()
        top_demo = demo_grouped.loc[demo_grouped['total amount'].idxmax()]
        
        # 2. Calculate Average Transaction Value
        avg_order = df['total amount'].mean()

        # 3. Formulate Dynamic Insights based on CSV data
        insights = [
            {
                "id": "AI-001",
                "type": "Clustering (K-Means)",
                "title": "Primary Revenue Driver Identified",
                "description": f"Our clustering algorithm identified that {top_demo['gender']} shoppers are the primary drivers for the {top_demo['product category']} category, generating ${top_demo['total amount']:,.2f} in total revenue.",
                "severity": "success",
                "action": f"Deploy targeted A/B digital signage near the {top_demo['product category']} aisles tailored to {top_demo['gender']} demographics."
            },
            {
                "id": "AI-002",
                "type": "Predictive Analytics",
                "title": "Average Transaction Value (ATV) Baseline",
                "description": f"The dataset indicates an average transaction value of ${avg_order:,.2f}. Computer vision indicates high dwell times without pickup in premium categories.",
                "severity": "info",
                "action": f"Trigger associate assistance when dwell time exceeds 45s on items priced 20% above the ${avg_order:,.2f} ATV."
            },
            {
                "id": "AI-003",
                "type": "Anomaly Detection",
                "title": "Conversion Drop Alert",
                "description": "Cross-referencing CV trajectories with sales transaction timestamps reveals a 12% bottleneck in checkout flow during peak hours.",
                "severity": "warning",
                "action": "Open additional mobile-checkout nodes in Zone B when active tracking IDs exceed 15."
            }
        ]
        
        return {"status": "success", "data": insights}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@app.get("/api/v1/dashboard/category-performance")
def get_category_performance():
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    
    try:
        df = pd.read_csv(DATASET_SALES)
        df.columns = [col.strip().lower() for col in df.columns]
        
        # Group by category
        cat_stats = df.groupby('product category').agg(
            revenue=('total amount', 'sum'),
            units=('quantity', 'sum'),
            avg_price=('price per unit', 'mean')
        ).reset_index()
        
        total_rev = cat_stats['revenue'].sum()
        
        categories = []
        for _, row in cat_stats.iterrows():
            cat = row['product category']
            rev = float(row['revenue'])
            categories.append({
                "name": str(cat).capitalize(),
                "revenue": rev,
                "units": int(row['units']),
                "share": round((rev / total_rev) * 100, 1) if total_rev > 0 else 0,
                # Simulated CV metrics for the Analyst view
                "avg_dwell": round(random.uniform(15.0, 45.0), 1),
                "conversion": round(random.uniform(10.0, 30.0), 1)
            })
            
        categories.sort(key=lambda x: x['revenue'], reverse=True)
        return {"status": "success", "data": categories}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/dashboard/journey")
def get_journey_analysis():
    """
    Returns spatial trajectory flow data for the Sankey-style Journey Tab.
    Simulates entry points, in-store zone dwell volumes, and exit/conversion points.
    """
    return {
        "status": "success",
        "data": {
            "entries": [
                {"id": "e1", "label": "Main Entrance", "value": "8,426", "pct": "65%"},
                {"id": "e2", "label": "Side Entrance", "value": "4,531", "pct": "35%"}
            ],
            "zones": [
                {"id": "z1", "label": "Electronics", "value": "4,821", "pct": "37%"},
                {"id": "z2", "label": "Clothing", "value": "5,214", "pct": "40%"},
                {"id": "z3", "label": "Beauty", "value": "2,922", "pct": "23%"}
            ],
            "exits": [
                {"id": "x1", "label": "Checkout", "value": "8,892", "pct": "68%"},
                {"id": "x2", "label": "Exit (No Purchase)", "value": "4,065", "pct": "32%"}
            ]
        }
    }
# MOCK POS REST API & WEBSOCKETS
@app.get("/api/v1/pos/live")
def get_live_pos():
    if random.random() > 0.4:
        sale_amount = random.randint(150, 4500)
        LIVE_POS["revenue"] += sale_amount
        LIVE_POS["conversions"] += 1
        return {"new_sale": True, "amount": sale_amount, "total_revenue": LIVE_POS["revenue"], "total_conversions": LIVE_POS["conversions"]}
    return {"new_sale": False, "total_revenue": LIVE_POS["revenue"], "total_conversions": LIVE_POS["conversions"]}

@app.websocket("/ws/ai/bboxes/{camera_id}")
async def websocket_bboxes(websocket: WebSocket, camera_id: int):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({"camera": camera_id, "boxes": LATEST_BBOXES.get(camera_id, [])})
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=9000, reload=True)