import os
import time
import threading
import numpy as np
import pandas as pd
from typing import Dict, Optional
from contextlib import asynccontextmanager

import cv2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Try to load YOLOv8 for Person Detection
try:
    from ultralytics import YOLO
    detector = YOLO('yolov8n.pt') 
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    print("⚠️ Ultralytics not installed. Run 'pip install ultralytics' for AI detection.")

model_lock = threading.Lock()

# ============================================================
# CONFIGURATION: DATASET PATHS MAPPED TO CAMERAS
# ============================================================
CAMERA_DATASETS = {
    1: "datasets/archive",
    2: "datasets/archive_1",
    3: "datasets/archive_2_products",
    4: "datasets/archive_3_shelves"
}
DATASET_SALES = "datasets/retail_sales_dataset.csv"

# ============================================================
# DYNAMIC DATABASE & CSV INGESTION
# ============================================================
USER_DB: Dict[str, Dict[str, str]] = {
    "admin@visionretail.ai": {"password": "admin", "role": "Administrator"},
    "manager@visionretail.ai": {"password": "manager", "role": "Store Manager"}
}

STORE_TELEMETRY = {
    "store_downtown_01": {
        "zone_1_foyer": 18, "zone_2_aisle": 42, "zone_3_checkout": 15,
        "total_visitors": 18642, "shelf_impressions": 6425, "high_dwell": 2860,
        "shelf_interactions": 4521, "purchase_conversion": 238,
        "last_updated": time.time()
    }
}

REGISTERED_SHELVES = []
REGISTERED_PRODUCTS = []

def load_sales_data():
    global REGISTERED_SHELVES, REGISTERED_PRODUCTS
    if not os.path.exists(DATASET_SALES):
        return

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
            REGISTERED_PRODUCTS.append({"id": f"PROD-{100 + idx}", "name": f"Top {str(cat_name).title()} Item", "sku": f"{str(cat_name)[:3].upper()}-00{idx}", "returns": int(row['total_sold'] * 0.05), "comparisons": int(row['total_sold'] * 1.5)})
    except Exception as e:
        print(f"⚠️ Error processing CSV data: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 VisionRetail AI Engine Starting...")
    load_sales_data()
    yield

app = FastAPI(title="VisionRetail AI Engine", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AuthCredentials(BaseModel):
    email: str
    password: str
    role: Optional[str] = "Store Manager"

# ============================================================
# MULTI-CAMERA STREAMING & AI ENGINE
# ============================================================
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
            if video_file:
                break
        images = sorted(images)

    # SPEED FIX: Normal video speed (~30 FPS)
    stream_delay = 0.033
    # Process YOLO every 5 frames to prevent lag at higher speeds
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
            # Removed cv2.flip for Camera 4 here

            if HAS_YOLO and frame_idx % process_every_n_frames == 0:
                try:
                    with model_lock:
                        results = detector(frame, classes=[0], verbose=False)
                    for r in results:
                        for box in r.boxes:
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            conf = box.conf[0]
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 128), 2)
                            cv2.putText(frame, f"Shopper {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 128), 1)
                except Exception as e:
                    pass

            cv2.putText(frame, f"Cam {camera_id} - AI Live Stream", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 212), 2)
            ret_enc, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret_enc:
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            frame_idx += 1
            time.sleep(stream_delay)

    elif images:
        while True:
            if frame_idx >= len(images):
                frame_idx = 0

            frame = cv2.imread(images[frame_idx])
            if frame is not None:
                frame = cv2.resize(frame, (640, 360))
                # Removed cv2.flip for Camera 4 here

                if HAS_YOLO and frame_idx % process_every_n_frames == 0:
                    try:
                        with model_lock:
                            results = detector(frame, classes=[0], verbose=False)
                        for r in results:
                            for box in r.boxes:
                                x1, y1, x2, y2 = map(int, box.xyxy[0])
                                conf = box.conf[0]
                                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 128), 2)
                                cv2.putText(frame, f"Shopper {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 128), 1)
                    except Exception as e:
                        pass

                cv2.putText(frame, f"Cam {camera_id} - AI Live Stream", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 212), 2)
                
                ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
                if ret:
                    yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            frame_idx += 1
            time.sleep(stream_delay)
            
    else:
        while True:
            frame = np.full((360, 640, 3), (15, 23, 42), dtype=np.uint8)
            cv2.putText(frame, f"CAM-{camera_id}: NO FEED FOUND", (20, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            ret, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(1)

# ============================================================
# API ROUTES
# ============================================================
@app.post("/api/auth/login")
def process_user_login(creds: AuthCredentials):
    user = USER_DB.get(creds.email)
    if not user or user["password"] != creds.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"status": "authenticated", "email": creds.email, "role": user["role"]}

@app.get("/api/camera/stream/{camera_id}")
def live_camera_stream_feed(camera_id: int):
    return StreamingResponse(stream_camera_frames(camera_id), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/telemetry/snapshot/{store_id}")
def retrieve_store_snapshot(store_id: str):
    return STORE_TELEMETRY.get(store_id, STORE_TELEMETRY["store_downtown_01"])

@app.get("/api/inventory/shelves")
def list_shelves(): return REGISTERED_SHELVES

@app.get("/api/inventory/products")
def list_products(): return REGISTERED_PRODUCTS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=9000, reload=True)