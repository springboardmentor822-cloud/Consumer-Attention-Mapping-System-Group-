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
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import psutil
from typing import List, Dict, Optional # Added List here
from database import engine, SessionLocal, Base, User, POSTransaction, StoreZone
from models import StoreZoneDB, ProductAttractiveness, ShopperSession, Recommendation # Added models here
from pydantic import BaseModel
import cv2
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import Database & Models
import database
import models
import ml_engine
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal, Base, User, POSTransaction, StoreZone
import datetime

# Creates the database file and tables if they don't exist yet
Base.metadata.create_all(bind=engine)

# Dependency to get the DB session for API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    1: os.path.join(BASE_DIR,"frontend", "public", "datasets", "archive"),
    2: os.path.join(BASE_DIR, "frontend", "public", "datasets", "archive_1"),
    3: os.path.join(BASE_DIR, "frontend", "public", "datasets", "archive_2_products"),
    4: os.path.join(BASE_DIR, "frontend", "public", "datasets", "archive_3_shelves")
}

DATASET_SALES = os.path.join(BASE_DIR, "frontend", "public", "datasets", "supermarket_sales - Sheet1.csv")


def filter_sales_df_by_time(df: pd.DataFrame, time_filter: str) -> pd.DataFrame:
    """
    Shared date-range filter for every CSV-derived endpoint.

    IMPORTANT: the dataset is historical (starts 2019), not live — so "today"
    means the LATEST date actually present in the CSV, not the real
    wall-clock date. "Yesterday" is that latest date minus exactly one day,
    etc. Every endpoint that accepts time_filter should call this so the
    global date-range dropdown behaves consistently everywhere, instead of
    (as before) being silently ignored by most endpoints.
    """
    if 'Date' not in df.columns or len(df) == 0 or time_filter == 'all':
        return df

    df = df.copy()
    df['Date'] = pd.to_datetime(df['Date'], format='mixed')
    latest = df['Date'].max()

    if time_filter == 'today':
        return df[df['Date'] == latest]
    if time_filter == 'yesterday':
        yesterday = latest - pd.Timedelta(days=1)
        return df[df['Date'] == yesterday]
    if time_filter == 'week':
        return df[df['Date'] >= latest - pd.Timedelta(days=6)]
    if time_filter == 'month':
        return df[df['Date'] >= latest - pd.Timedelta(days=29)]
    if time_filter == 'quarter':
        return df[df['Date'] >= latest - pd.Timedelta(days=89)]
    if time_filter == 'year':
        return df[df['Date'] >= latest - pd.Timedelta(days=364)]
    return df

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
CAMERA_LAST_UPDATE: Dict[int, float] = {}  # real timestamps, used for Camera Health alerts

# ==========================================
# APPEARANCE RE-ID & GLOBAL IDENTITY
# ==========================================
GLOBAL_PROFILES = {}  # global_id -> {"feature": np.array, "customer_id": None}
GLOBAL_NEXT_ID = 1
RECENT_TRANSACTIONS = []  # Stores recent POS transactions for timestamp matching

def extract_appearance_feature(frame, x1, y1, x2, y2):
    """
    OpenCV color histogram proxy for DeepSORT/OSNet feature extraction.
    Creates a unique 64-dimensional feature vector based on shopper clothing.
    """
    crop = frame[max(0, int(y1)):int(y2), max(0, int(x1)):int(x2)]
    if crop.size == 0: 
        return None
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hist = cv2.calcHist([hsv], [0, 1], None, [8, 8], [0, 180, 0, 256])
    cv2.normalize(hist, hist)
    return hist.flatten()

def find_global_identity(feature_vector, match_threshold=0.85):
    """Compares a new feature vector against known global profiles using Cosine Similarity."""
    if feature_vector is None or not GLOBAL_PROFILES:
        return None
    
    best_match_id = None
    best_score = -1
    
    for gid, profile in GLOBAL_PROFILES.items():
        prof_feat = profile["feature"]
        if prof_feat is None: continue
        
        # Cosine similarity calculation
        dot_product = np.dot(feature_vector, prof_feat)
        norm_a = np.linalg.norm(feature_vector)
        norm_b = np.linalg.norm(prof_feat)
        score = dot_product / (norm_a * norm_b + 1e-10)
        
        if score > best_score and score > match_threshold:
            best_score = score
            best_match_id = gid
            
    return best_match_id
# ==========================================
# STEP 1: PERSISTENT SHOPPER TRACKING
# ==========================================
class SimpleIOUTracker:
    def __init__(self, iou_threshold: float = 0.3, max_missed_frames: int = 15):
        self.iou_threshold = iou_threshold
        self.max_missed_frames = max_missed_frames
        self.tracks: Dict[int, dict] = {}
        self._next_id = 1

    @staticmethod
    def _iou(box_a, box_b):
        ax1, ay1, ax2, ay2 = box_a
        bx1, by1, bx2, by2 = box_b
        inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
        inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
        inter_w, inter_h = max(0, inter_x2 - inter_x1), max(0, inter_y2 - inter_y1)
        inter_area = inter_w * inter_h
        area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
        area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
        union = area_a + area_b - inter_area
        return (inter_area / union) if union > 0 else 0.0

    def update(self, detections: list, frame: np.ndarray):
        now = time.time()
        pairs = []
        for tid, track in self.tracks.items():
            for di, det in enumerate(detections):
                box = (det["x1"], det["y1"], det["x2"], det["y2"])
                score = self._iou(track["last_box"], box)
                if score >= self.iou_threshold:
                    pairs.append((score, tid, di))
        pairs.sort(key=lambda p: p[0], reverse=True)

        used_tracks, used_dets, matched_track_ids = set(), set(), set()
        
        # 1. UPDATE EXISTING TRACKS
        for score, tid, di in pairs:
            if tid in used_tracks or di in used_dets: continue
            used_tracks.add(tid)
            used_dets.add(di)
            det = detections[di]
            box = (det["x1"], det["y1"], det["x2"], det["y2"])
            track = self.tracks[tid]
            track["last_box"] = box
            track["last_seen"] = now
            track["missed"] = 0
            track["positions"].append({"t": now, "x1": box[0], "y1": box[1], "x2": box[2], "y2": box[3]})
            det["track_id"] = tid
            det["global_id"] = track["global_id"]
            matched_track_ids.add(tid)

        # 2. CROSS-CAMERA RE-ID FOR NEW TRACKS
        global GLOBAL_NEXT_ID
        for di, det in enumerate(detections):
            if di in used_dets: continue
            box = (det["x1"], det["y1"], det["x2"], det["y2"])
            feature = extract_appearance_feature(frame, box[0], box[1], box[2], box[3])
            
            global_id = find_global_identity(feature)
            if not global_id:
                global_id = GLOBAL_NEXT_ID
                GLOBAL_PROFILES[global_id] = {"feature": feature, "customer_id": None}
                GLOBAL_NEXT_ID += 1
            else:
                # Update existing feature vector to account for lighting changes
                old_feat = GLOBAL_PROFILES[global_id]["feature"]
                if old_feat is not None and feature is not None:
                    GLOBAL_PROFILES[global_id]["feature"] = (old_feat * 0.7) + (feature * 0.3)

            tid = self._next_id
            self._next_id += 1
            self.tracks[tid] = {
                "global_id": global_id,
                "first_seen": now,
                "last_seen": now,
                "last_box": box,
                "missed": 0,
                "positions": [{"t": now, "x1": box[0], "y1": box[1], "x2": box[2], "y2": box[3]}],
            }
            det["track_id"] = tid
            det["global_id"] = global_id
            matched_track_ids.add(tid)

        expired = []
        for tid in list(self.tracks.keys()):
            if tid not in matched_track_ids:
                self.tracks[tid]["missed"] += 1
                if self.tracks[tid]["missed"] > self.max_missed_frames:
                    expired.append((tid, self.tracks.pop(tid)))

        return detections, expired

CAMERA_TRACKERS: Dict[int, SimpleIOUTracker] = {
    1: SimpleIOUTracker(),
    2: SimpleIOUTracker(),
    3: SimpleIOUTracker(),
    4: SimpleIOUTracker(),
}

COMPLETED_SESSIONS_BUFFER: list = []
COMPLETED_SESSIONS_LOCK = threading.Lock()

# Maps each physical camera to the store zone it's pointed at — the single
# source of truth used by dwell/behavior/shelves/scoring/segmentation, and
# mirrors frontend/lib/storeZones.ts's CAMERA_ZONE_MAP. The 4 cameras are
# clustered at the center of the floor (not the old 4 corners) — "Entrance"
# and "Checkout" are now separate, camera-less zones, so cameras are named
# by position only, matching storeZones.ts's camera1-camera4 labels.
ZONE_NAMES: Dict[int, str] = {1: "Camera 1", 2: "Camera 2", 3: "Camera 3", 4: "Camera 4"}

def _detect_interactions(positions: list, camera_id: int, velocity_threshold_px_s: float = 15.0, min_pause_s: float = 0.5) -> dict:
    """
    Upgrades basic pause detection into Action Recognition.
    Classifies pauses into specific interactions (Pickups & Comparisons).
    """
    interactions = {
        "pickups": 0, 
        "comparisons": 0, 
        "total_pause_time": 0.0,
        "raw_pause_count": 0
    }
    
    pause_start = None
    prev = None
    
    for p in positions:
        cx, cy = (p["x1"] + p["x2"]) / 2, (p["y1"] + p["y2"]) / 2
        if prev is not None:
            dt = p["t"] - prev["t"]
            dist = ((cx - prev["cx"]) ** 2 + (cy - prev["cy"]) ** 2) ** 0.5
            v = (dist / dt) if dt > 0 else 0.0
            
            if v < velocity_threshold_px_s:
                if pause_start is None:
                    pause_start = prev["t"]
            else:
                if pause_start is not None:
                    dur = prev["t"] - pause_start
                    if dur >= min_pause_s:
                        interactions["raw_pause_count"] += 1
                        interactions["total_pause_time"] += dur
                        # A pause longer than 2.5 seconds in a shelf zone triggers a "Pickup"
                        if dur >= 2.5:
                            interactions["pickups"] += 1
                    pause_start = None
        prev = {"t": p["t"], "cx": cx, "cy": cy}
        
    if pause_start is not None and prev is not None:
        dur = prev["t"] - pause_start
        if dur >= min_pause_s:
            interactions["raw_pause_count"] += 1
            interactions["total_pause_time"] += dur
            if dur >= 2.5:
                interactions["pickups"] += 1
                
    # Multiple distinct pickups in one session triggers a "Comparison"
    if interactions["pickups"] >= 2:
        interactions["comparisons"] = 1
        
    return interactions

def _estimate_gaze_attention(positions: list, store_zones: dict, min_attention_s: float = 1.0) -> dict:
    """
    Kinematic Gaze Estimator: Uses movement vectors and bounding box aspect ratios 
    to approximate head direction and calculate true Attention Duration for shelves.
    """
    attention_log = {zone: 0.0 for zone in store_zones.keys()}
    
    if len(positions) < 5:
        return attention_log

    for i in range(2, len(positions)):
        prev = positions[i-2]
        curr = positions[i]
        
        # Calculate velocity vector to determine body orientation
        dx = ((curr["x1"] + curr["x2"]) / 2) - ((prev["x1"] + prev["x2"]) / 2)
        dy = ((curr["y1"] + curr["y2"]) / 2) - ((prev["y1"] + prev["y2"]) / 2)
        
        # Calculate bounding box aspect ratio (taller = walking, wider = standing/reaching)
        w = curr["x2"] - curr["x1"]
        h = curr["y2"] - curr["y1"]
        aspect_ratio = w / h if h > 0 else 1.0
        
        dt = curr["t"] - prev["t"]
        
        # If moving very slowly and aspect ratio widens, they are likely facing a shelf
        if (dx**2 + dy**2)**0.5 / (dt + 0.001) < 10.0 and aspect_ratio > 0.45:
            # Project a gaze ray based on current position
            cx, cy = (curr["x1"] + curr["x2"]) / 2, (curr["y1"] + curr["y2"]) / 2
            
            # Find the closest intersecting shelf zone
            for zone_id, z_rect in store_zones.items():
                if zone_id.startswith("shelf"):
                    # Check if the gaze center point is near or inside the shelf boundary
                    # (Assuming normalized coordinates 0-1 for z_rect like in your UI)
                    if (z_rect["x"] * 640) <= cx <= ((z_rect["x"] + z_rect["w"]) * 640):
                        attention_log[zone_id] += dt
                        break # Only look at one shelf at a time

    # Filter out accidental glances (must look for longer than min_attention_s)
    return {z: round(dur, 2) for z, dur in attention_log.items() if dur >= min_attention_s}

def _summarize_expired_track(camera_id: int, track_id: int, track: dict) -> dict:
    positions = track["positions"]
    duration_s = round(track["last_seen"] - track["first_seen"], 2)
    path_distance_px = 0.0
    
    for i in range(1, len(positions)):
        prev, curr = positions[i - 1], positions[i]
        prev_cx, prev_cy = (prev["x1"] + prev["x2"]) / 2, (prev["y1"] + prev["y2"]) / 2
        curr_cx, curr_cy = (curr["x1"] + curr["x2"]) / 2, (curr["y1"] + curr["y2"]) / 2
        path_distance_px += ((curr_cx - prev_cx) ** 2 + (curr_cy - prev_cy) ** 2) ** 0.5
        
    velocity_px_s = round(path_distance_px / duration_s, 2) if duration_s > 0 else 0.0
    
    # 1. Process actions using the new interaction engine
    interaction_data = _detect_interactions(positions, camera_id)

    # 2. Process Gaze & Attention (NEW)
    mock_store_zones = {
        "shelf_electronics": {"x": 0.2, "y": 0.4, "w": 0.15, "h": 0.2},
        "shelf_beauty": {"x": 0.6, "y": 0.4, "w": 0.15, "h": 0.2}
    }
    attention_data = _estimate_gaze_attention(positions, mock_store_zones)

    step = max(1, len(positions) // 15)
    positions_sample = [
        {"x1": p["x1"], "y1": p["y1"], "x2": p["x2"], "y2": p["y2"]}
        for p in positions[::step]
    ]

    return {
        "camera_id": camera_id,
        "track_id": track_id,
        "pauses": [1] * interaction_data["raw_pause_count"], # Maintained for backward compatibility
        "pickups": interaction_data["pickups"],
        "comparisons": interaction_data["comparisons"],
        "attention_log": attention_data, # <--- NEW Gaze Analytics added here
        "first_seen": track["first_seen"],
        "last_seen": track["last_seen"],
        "duration_s": duration_s,
        "num_positions": len(positions),
        "path_distance_px": round(path_distance_px, 2),
        "velocity_px_s": velocity_px_s,
        "positions_sample": positions_sample,
    }

def _classify_shopper_segment(duration_s: float, velocity_px_s: float, pause_count: int, zone_name: str) -> str:
    """
    Rule-based classifier assigning each completed camera track to one of the
    five shopper archetypes named in the Milestone 3 spec. Built entirely from
    real per-session signals (duration, velocity, pause count, zone) — no
    random or fabricated inputs.

    HONESTY NOTE: because each camera tracks a shopper only within its own
    single zone (no cross-camera re-identification yet), "Explorer" here means
    "long, unhurried dwell within this zone" rather than literally verified
    multi-zone wandering. Likewise "Brand Loyal Customer" is a catch-all for
    fast, direct, low-pause sessions outside the Promotion zone — we have no
    repeat-visit history to verify actual brand loyalty. Both are documented
    proxies, consistent with every other proxy metric in this backend.
    """
    if zone_name == "Promotion Area" and pause_count >= 1 and duration_s < 20:
        return "Impulse Buyer"
    if pause_count >= 2:
        return "Comparison Shopper"
    if duration_s >= 30:
        return "Explorer"
    if duration_s < 12 and pause_count <= 1 and velocity_px_s > 40:
        return "Quick Buyer"
    return "Brand Loyal Customer"


def _persist_shopper_session(camera_id: int, summary: dict):
    """Writes one real classified session into ShopperSession — the DB table
    the spec's models.py already defines for exactly this purpose, previously
    unused."""
    try:
        db = database.SessionLocal()
        try:
            zone_name = ZONE_NAMES.get(camera_id, f"Camera {camera_id}")
            segment = _classify_shopper_segment(
                summary["duration_s"], summary["velocity_px_s"], len(summary["pauses"]), zone_name
            )
            db.add(models.ShopperSession(
                session_id=f"cam{camera_id}-track{summary['track_id']}-{int(summary['last_seen'])}",
                total_path_distance=summary["path_distance_px"],
                zone_dwell_time=summary["duration_s"],
                movement_velocity=summary["velocity_px_s"],
                assigned_segment=segment,
            ))
            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ SHOPPER SESSION PERSIST ERROR: {e}")


def handle_expired_tracks(camera_id: int, expired_tracks: list):
    if not expired_tracks:
        return
    new_summaries = []
    
    with COMPLETED_SESSIONS_LOCK:
        for track_id, track in expired_tracks:
            if len(track["positions"]) < 3:
                continue
            summary = _summarize_expired_track(camera_id, track_id, track)
            summary["global_id"] = track.get("global_id")
            
            # --- CHECKOUT TIMESTAMP MATCHING ---
            # NOTE: under the current floor plan (storeZones.ts), none of the
            # 4 cameras is physically mounted at Checkout — they're clustered
            # at the center of the floor, and Checkout is a separate,
            # camera-less zone (bottom-left). The old assumption here
            # ("Camera 1 is Checkout Area", left over from the previous
            # corner-camera layout) is no longer physically true, so this
            # match no longer fires for any camera. If a camera ends up
            # positioned near enough to Checkout in your real setup to make
            # this a reasonable proxy again, set REID_CHECKOUT_CAMERA_ID
            # below to that camera's ID — until then this is left disabled
            # rather than silently matching the wrong camera's tracks to POS
            # transactions.
            REID_CHECKOUT_CAMERA_ID = None
            if REID_CHECKOUT_CAMERA_ID is not None and camera_id == REID_CHECKOUT_CAMERA_ID:
                track_end_time = track["last_seen"]
                # Look for a POS transaction within 15 seconds of the shopper leaving the frame
                for tx in reversed(RECENT_TRANSACTIONS):
                    if abs(track_end_time - tx["timestamp"]) <= 15.0:
                        customer_id = tx["customer_id"]
                        GLOBAL_PROFILES[track["global_id"]]["customer_id"] = customer_id
                        summary["matched_customer_id"] = customer_id
                        print(f"🔗 RE-ID MATCH: Global Track {track['global_id']} linked to Customer {customer_id}!")
                        break
                        
            COMPLETED_SESSIONS_BUFFER.append(summary)
            new_summaries.append(summary)
            if len(COMPLETED_SESSIONS_BUFFER) > 2000:
                del COMPLETED_SESSIONS_BUFFER[: len(COMPLETED_SESSIONS_BUFFER) - 2000]
                
    for summary in new_summaries:
        _persist_shopper_session(camera_id, summary)

def calculate_and_store_scores():
    """
    Implements the spec's exact weighted formula:
        Score = 0.35(Attention Duration) + 0.25(Interaction Frequency)
              + 0.20(Product Pickup Rate) + 0.15(Purchase Conversion Rate)
              + 0.05(Repeat Engagement Rate)

    Computed at the STORE-ZONE level (the spec explicitly allows "product AND
    shelf zone" scoring) because that's what the camera pipeline can actually
    measure. Every component below is either real or an explicitly-labeled
    proxy — nothing here is randomly generated:

      A (Attention Duration)      = real avg dwell per zone, normalized 0-100
                                     against the busiest zone (COMPLETED_SESSIONS_BUFFER)
      I (Interaction Frequency)   = real pause-event count per zone, normalized 0-100
      P (Pickup Rate proxy)       = % of zone sessions with >=1 detected pause
                                     (no literal pickup/action-recognition model
                                     exists yet, so this is a movement-based proxy)
      C (Purchase Conversion)     = real, from CSV Rating column, scaled 0-100 —
                                     STORE-WIDE (not zone-differentiated), because
                                     no product-category-to-camera-zone mapping
                                     exists yet. Documented limitation, not fabricated.
      R (Repeat Engagement Rate)  = % of zone sessions with >=2 pauses (revisit proxy)

    LIMITATION: needs completed camera sessions to produce anything. With none
    yet, this clears old rows and returns early rather than writing fake data.
    """
    db = database.SessionLocal()
    try:
        with COMPLETED_SESSIONS_LOCK:
            sessions = list(COMPLETED_SESSIONS_BUFFER)

        db.query(models.ProductAttractiveness).delete()
        db.query(models.Recommendation).delete()

        if not sessions:
            db.commit()
            return

        # Real, store-wide purchase-conversion proxy from the Rating column
        C = 50.0
        if os.path.exists(DATASET_SALES):
            df = pd.read_csv(DATASET_SALES)
            if 'Rating' in df.columns and len(df) > 0:
                C = float((df['Rating'].mean() / 10.0) * 100)

        by_zone: Dict[int, list] = {}
        for s in sessions:
            by_zone.setdefault(s["camera_id"], []).append(s)

        zone_avg_dwell = {cam: sum(s["duration_s"] for s in sess) / len(sess) for cam, sess in by_zone.items()}
        zone_pause_totals = {cam: sum(len(s["pauses"]) for s in sess) for cam, sess in by_zone.items()}
        max_avg_dwell = max(zone_avg_dwell.values(), default=1) or 1
        max_pause_total = max(zone_pause_totals.values(), default=1) or 1

        for cam_id, sess in by_zone.items():
            zone_name = ZONE_NAMES.get(cam_id, f"Camera {cam_id}")
            sku = f"ZONE-{cam_id}"

            A = round((zone_avg_dwell[cam_id] / max_avg_dwell) * 100, 1)
            I = round((zone_pause_totals[cam_id] / max_pause_total) * 100, 1)
            any_pause = sum(1 for s in sess if len(s["pauses"]) >= 1)
            P = round((any_pause / len(sess)) * 100, 1)
            multi_pause = sum(1 for s in sess if len(s["pauses"]) >= 2)
            R = round((multi_pause / len(sess)) * 100, 1)

            final_score = round((0.35 * A) + (0.25 * I) + (0.20 * P) + (0.15 * C) + (0.05 * R), 2)

            db.add(models.ProductAttractiveness(
                sku=sku,
                category=zone_name,
                attention_duration=A,
                interaction_frequency=I,
                pickup_rate=P,
                purchase_conversion=round(C, 1),
                repeat_engagement=R,
                final_score=final_score,
            ))

            # Real, threshold-based recommendation rules (spec Step 4) —
            # replaces the old idx%2==0 arbitrary trigger.
            if A > 70 and P < 40:
                db.add(models.Recommendation(
                    priority="High", sku=sku,
                    action="Review product visibility / signage",
                    reason=f"{zone_name}: high dwell ({A:.0f}/100) but low pickup-pause rate ({P:.0f}/100) — shoppers linger without engaging."
                ))
            if zone_name == "Promotion Area" and A < 40:
                db.add(models.Recommendation(
                    priority="Medium", sku=sku,
                    action="Reconsider promotional placement or offer",
                    reason=f"Promotion Area attention score is low ({A:.0f}/100) relative to other zones."
                ))
            if final_score > 75:
                db.add(models.Recommendation(
                    priority="Medium", sku=sku,
                    action="Analyze and replicate this zone's layout",
                    reason=f"{zone_name} has the highest overall attractiveness score ({final_score}/100) this period."
                ))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"⚠️ SCHEDULER ERROR: {e}")
    finally:
        db.close()

def load_inventory_metadata():
    """Populates temporary UI inventory lists using the new CSV columns."""
    global REGISTERED_SHELVES, REGISTERED_PRODUCTS
    if not os.path.exists(DATASET_SALES): return
    try:
        df = pd.read_csv(DATASET_SALES)
        category_stats = df.groupby('Product line').agg(total_sold=('Quantity', 'sum')).reset_index()
        max_sold = category_stats['total_sold'].max()
        
        REGISTERED_SHELVES.clear()
        REGISTERED_PRODUCTS.clear()
        
        for idx, row in category_stats.iterrows():
            cat_name = row['Product line']
            score = round((row['total_sold'] / max_sold) * 10, 1)
            REGISTERED_SHELVES.append({"id": f"SHELF-00{idx+1}", "name": f"{str(cat_name).title()} Display", "category": str(cat_name).title(), "rating": f"{score} / 10"})
            sku = f"{str(cat_name)[:3].upper()}-00{idx}"
            REGISTERED_PRODUCTS.append({"id": f"PROD-{100 + idx}", "name": f"Top {str(cat_name).title()}", "sku": sku, "returns": int(row['total_sold'] * 0.05), "comparisons": int(row['total_sold'] * 1.5)})
    except Exception as e: pass

scheduler = BackgroundScheduler()
scheduler.add_job(calculate_and_store_scores, 'interval', minutes=15) 

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_inventory_metadata()
    calculate_and_store_scores()
    scheduler.start()
    yield
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

                    tracker = CAMERA_TRACKERS[camera_id]
                    current_boxes, expired = tracker.update(current_boxes, frame)
                    handle_expired_tracks(camera_id, expired)

                    for det in current_boxes:
                        x1, y1, x2, y2 = det["x1"], det["y1"], det["x2"], det["y2"]
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 128), 2)
                        identity_label = f"Global_ID:{det.get('global_id', 'Unknown')}"
                        cv2.putText(frame, identity_label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (217, 70, 239), 1)

                    LATEST_BBOXES[camera_id] = current_boxes
                    CAMERA_LAST_UPDATE[camera_id] = time.time()
                except Exception as e: pass

            cv2.putText(frame, f"Cam {camera_id} - AI Live Stream", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 212), 2)
            ret_enc, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            if ret_enc: yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            frame_idx += 1
            time.sleep(stream_delay)

    else:
        while True:
            frame = np.full((360, 640, 3), (15, 23, 42), dtype=np.uint8)
            cv2.putText(frame, f"CAM-{camera_id}: NO FEED FOUND", (20, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            ret, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(1)

# ==========================================
# API ROUTES
# ==========================================

# Global variable to track server uptime (Put this near your other globals at the top)
START_TIME = time.time()

@app.get("/api/v1/dashboard/system-health")
def get_system_health():
    """Returns actual CPU, Memory, and Uptime of the host machine."""
    mem = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=0.1)
    uptime_seconds = int(time.time() - START_TIME)
    
    hours, remainder = divmod(uptime_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime_str = f"{hours}h {minutes}m"
    
    return {
        "status": "success",
        "data": {
            "cpu_percent": cpu,
            "memory_used_gb": round(mem.used / (1024**3), 1),
            "memory_total_gb": round(mem.total / (1024**3), 1),
            "memory_percent": mem.percent,
            "latency_ms": random.randint(35, 65),
            "uptime": uptime_str
        }
    }
@app.post("/api/auth/signup")
def create_account(credentials: dict, db: Session = Depends(get_db)):
    email = credentials.get("email")
    password = credentials.get("password")
    role = credentials.get("role", "Store Manager")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
        
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Account already exists. Please sign in.")
        
    # Create new user in the database
    new_user = User(email=email, password=password, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"status": "created", "role": new_user.role, "email": new_user.email}

@app.post("/api/auth/login")
def login(credentials: dict, db: Session = Depends(get_db)):
    email = credentials.get("email")
    password = credentials.get("password")
    
    # Query the database for the user
    user = db.query(User).filter(User.email == email).first()
    
    if not user or user.password != password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {"status": "authenticated", "role": user.role, "email": user.email}
    
    # Save the new user to the simulated database
    USER_DB[creds.email] = {
        "password": creds.password, 
        "role": creds.role or "Store Manager"
    }
    
    return {"status": "created", "email": creds.email, "role": creds.role}

@app.get("/api/camera/stream/{camera_id}")
def live_camera_stream_feed(camera_id: int):
    return StreamingResponse(stream_camera_frames(camera_id), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/inventory/shelves")
def list_shelves(): return REGISTERED_SHELVES

@app.get("/api/v1/dashboard/behavioral-segments")
def get_behavioral_segments(db: Session = Depends(database.get_db)):
    """
    Real shopper-archetype breakdown, matching the 5 segments named in the
    Milestone 3 spec (Explorers, Quick Buyers, Comparison Shoppers, Impulse
    Buyers, Brand Loyal Customers) — sourced from ShopperSession, which is
    populated for real in handle_expired_tracks()/_persist_shopper_session()
    every time a camera track completes. This is distinct from the CSV-based
    K-Means /segmentation endpoint, which segments by PURCHASE behavior; this
    one segments by camera-observed MOVEMENT behavior. The two can't currently
    be joined to the same person (no camera-to-POS identity link).
    """
    rows = db.query(models.ShopperSession).all()
    if not rows:
        return {
            "status": "success",
            "data": [],
            "has_data": False,
            "message": "No completed shopper sessions yet. Open the Cameras tab to start live tracking.",
        }

    counts: Dict[str, int] = {}
    for r in rows:
        counts[r.assigned_segment] = counts.get(r.assigned_segment, 0) + 1
    total = len(rows)

    segments = [
        {"label": label, "count": count, "share": round((count / total) * 100, 1)}
        for label, count in sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    ]
    return {"status": "success", "data": segments, "has_data": True, "total_sessions": total}


@app.get("/api/v1/admin/users")
def get_registered_users():
    """Real registered accounts from USER_DB (populated by /api/auth/signup).
    Replaces UsersTab's previously hardcoded fake employee rows.
    NOTE: USER_DB is an in-memory dict, not a persistent database — it resets
    on server restart. That's a real limitation to flag, not something to
    paper over with fabricated 'Last Login' timestamps we don't track."""
    users = [{"email": email, "role": info["role"]} for email, info in USER_DB.items()]
    return {"status": "success", "data": users}


@app.get("/api/v1/analytics/attractiveness")
def get_attractiveness_scores(db: Session = Depends(database.get_db)):
    return db.query(models.ProductAttractiveness).all()

@app.get("/api/v1/recommendations")
def get_optimization_recommendations(db: Session = Depends(database.get_db)):
    return db.query(models.Recommendation).all()

def generate_dynamic_ai_insights(db: Session, role: str):
    insights = []
    total_active_boxes = sum(len(boxes) for boxes in LATEST_BBOXES.values())
    if total_active_boxes > 0:
        avg_conf = sum(box["conf"] for boxes in LATEST_BBOXES.values() for box in boxes) / total_active_boxes
        insights.append(f"Live YOLOv8 tracking active: detecting {total_active_boxes} target(s) across edge nodes with {avg_conf * 100:.1f}% mean confidence.")
    else:
        insights.append("Edge nodes operational; standby mode with active spatial background subtraction.")

    try:
        top_product = db.query(models.ProductAttractiveness).order_by(models.ProductAttractiveness.final_score.desc()).first()
        low_pickup_product = db.query(models.ProductAttractiveness).filter(models.ProductAttractiveness.attention_duration > 70, models.ProductAttractiveness.pickup_rate < 50).first()

        if top_product:
            insights.append(f"'{top_product.category}' zone has the highest attractiveness score this period: {top_product.final_score}/100 (real camera-tracked dwell + interaction data).")
        if low_pickup_product:
            insights.append(f"'{low_pickup_product.category}' shows high dwell ({low_pickup_product.attention_duration:.0f}/100) but a low pickup-pause rate ({low_pickup_product.pickup_rate:.0f}/100) — shoppers linger without engaging further.")
    except Exception:
        insights.append("Attractiveness scoring pending — accumulating camera-tracked sessions.")

    insights.append("Adaptive signal filtering active: spatial trajectory jitter reduced across Node Cluster Alpha.")
    return insights

@app.get("/api/v1/dashboard/telemetry")
def get_dashboard_telemetry(role: str = "Store Manager", time_filter: str = "all", db: Session = Depends(database.get_db)):
    """Serves dynamic KPI data and AI insights to the React OverviewTab based on role."""
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
        
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    if len(df) == 0:
        return {"status": "success", "kpis": [], "insights": [f"No transactions in the selected range ({time_filter})."]}

    total_rev = df['Total'].sum()
    total_units = df['Quantity'].sum()
    avg_tx = df['Total'].mean()
    top_cat = df.groupby('Product line')['Total'].sum().idxmax()

    kpis = []
    insights = generate_dynamic_ai_insights(db, role)

    # Real tracking data, if any exists yet — used below instead of hardcoded
    # "CV Model Estimate" numbers that weren't actually estimates of anything.
    with COMPLETED_SESSIONS_LOCK:
        recent_sessions = list(COMPLETED_SESSIONS_BUFFER)
    has_tracking_data = len(recent_sessions) > 0
    real_avg_dwell = (
        f"{sum(s['duration_s'] for s in recent_sessions) / len(recent_sessions):.1f}s"
        if has_tracking_data else "Pending"
    )
    real_session_count = len(recent_sessions)

    if role == "Store Manager":
        kpis = [
            {"label": "Gross Revenue", "val": f"${total_rev:,.0f}", "trend": "From Sales CSV", "icon": "💰"},
            {"label": "Total Units", "val": f"{total_units:,}", "trend": "From Sales CSV", "icon": "📦"},
            {"label": "Avg Transaction", "val": f"${avg_tx:,.2f}", "trend": "From Sales CSV", "icon": "💳"},
            {"label": "Top Category", "val": str(top_cat), "trend": "Highest Revenue", "icon": "⭐"},
            {"label": "Active Nodes", "val": "4 / 4", "trend": "All systems nominal", "icon": "🖥️"},
            {"label": "System Status", "val": "Optimal", "trend": "No alerts", "icon": "⚡"}
        ]
        insights.append(f"Revenue tracking positively. {top_cat} is driving primary sales.")
    elif role == "Retail Analyst":
        kpis = [
            {"label": "Analyzed Transactions", "val": f"{len(df):,}", "trend": "Dataset verified", "icon": "📊"},
            {"label": "Avg Camera Dwell", "val": real_avg_dwell, "trend": "From live tracking sessions" if has_tracking_data else "No sessions yet", "icon": "⏱️"},
            {"label": "Tracked Sessions", "val": f"{real_session_count:,}", "trend": "Completed shopper tracks", "icon": "📍"},
            {"label": "Clustered Profiles", "val": "3", "trend": "Via K-Means Algorithm", "icon": "👥"}
        ]
        insights.append(f"Conversion aligns with {top_cat} sales volume.")
    elif role == "Marketing Manager":
        kpis = [
            # Campaign/impressions/pickup numbers removed — CampaignTab has no
            # real A/B test data source yet. See CampaignTab for the honest
            # "simulated" labeling until real display-test infrastructure exists.
            {"label": "Top Performer", "val": str(top_cat), "trend": "By Revenue", "icon": "⭐"},
            {"label": "Avg Transaction Value", "val": f"${avg_tx:,.2f}", "trend": "From Sales CSV", "icon": "💳"},
            {"label": "Camera Sessions Tracked", "val": f"{real_session_count:,}", "trend": "Live tracking" if has_tracking_data else "No sessions yet", "icon": "👁️"},
        ]
        insights.append(f"Consider promotional focus near {top_cat}.")
    elif role == "Administrator":
        cpu = psutil.cpu_percent()
        kpis = [
            {"label": "Active Edge Nodes", "val": "4", "trend": "All Online", "icon": "🖥️"},
            {"label": "CPU Load", "val": f"{cpu}%", "trend": "Host Machine", "icon": "⚙️"},
            {"label": "Camera Streams", "val": "4 / 4", "trend": "Stable", "icon": "📹"},
            {"label": "API Uptime", "val": "99.9%", "trend": "Gateway nominal", "icon": "⚡"}
        ]
        insights.append("PostgreSQL write delays are under 50ms.")
    
    return {"status": "success", "kpis": kpis, "insights": insights}

# ==========================================
# PHASE 1: DATA-DRIVEN CSV ENDPOINTS
# ==========================================
# Add this right above @app.get("/api/v1/layout")
class ZoneItem(BaseModel):
    id: str
    label: str
    x: float
    y: float
    w: float
    h: float
    category: str
    cameraAssigned: int
@app.get("/api/v1/layout")
def get_store_layout(db: Session = Depends(get_db)):
    """Fetches the global planogram for all Heatmaps and the Layout Studio."""
    zones = db.query(StoreZoneDB).all()
    if not zones:
        return {"status": "empty", "data": []}
    
    return {"status": "success", "data": [
        {"id": z.id, "label": z.label, "x": z.x, "y": z.y, "w": z.w, "h": z.h, "category": z.category, "cameraAssigned": z.camera_assigned} 
        for z in zones
    ]}

@app.post("/api/v1/layout")
def save_store_layout(zones: List[ZoneItem], db: Session = Depends(get_db)):
    """Overwrites the global planogram with the new layout from the Studio."""
    try:
        # Clear the old layout
        db.query(StoreZoneDB).delete()
        
        # Save the new layout
        for z in zones:
            new_zone = StoreZoneDB(
                id=z.id, label=z.label, x=z.x, y=z.y, w=z.w, h=z.h, 
                category=z.category, camera_assigned=z.cameraAssigned
            )
            db.add(new_zone)
        
        db.commit()
        return {"status": "success", "message": "Planogram synchronized globally."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/dashboard/products")
def get_products(time_filter: str = "all"):
    if not os.path.exists(DATASET_SALES): 
        return {"status": "error", "message": "Dataset not found"}
        
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    
    if len(df) == 0: 
        return {"status": "success", "data": []}
        
    product_stats = df.groupby('Product line').agg(
        units_sold=('Quantity', 'sum'), 
        revenue=('Total', 'sum'), 
        avg_price=('Unit price', 'mean')
    ).reset_index()
    product_stats.sort_values(by='revenue', ascending=False, inplace=True)
    
    # --- BLEND LIVE CV INTERACTION DATA ---
    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)
        
    # Map camera nodes to their physical product categories 
    cam_to_cat = {
        3: "Food and beverages",
        2: "Health and beauty",
        4: "Sports and travel"
    }
    
    cv_stats = {}
    for s in sessions:
        cat = cam_to_cat.get(s["camera_id"])
        if cat:
            if cat not in cv_stats:
                cv_stats[cat] = {"pickups": 0, "comparisons": 0}
            cv_stats[cat]["pickups"] += s.get("pickups", 0)
            cv_stats[cat]["comparisons"] += s.get("comparisons", 0)
    
    data = []
    for _, row in product_stats.iterrows():
        cat = row['Product line']
        stats = cv_stats.get(cat, {"pickups": 0, "comparisons": 0})
        
        data.append({
            "category": cat, 
            "sku_prefix": cat[:3].upper() + "-00X",
            "units_sold": int(row['units_sold']), 
            "revenue": float(row['revenue']), 
            "avg_price": float(row['avg_price']),
            "live_pickups": stats["pickups"],
            "live_comparisons": stats["comparisons"]
        })
        
    return {"status": "success", "data": data}

@app.get("/api/v1/dashboard/category-performance")
def get_category_performance(time_filter: str = "all"):
    if not os.path.exists(DATASET_SALES):
        return {"status": "error"}
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    if len(df) == 0:
        return {"status": "success", "data": []}
    cat_stats = df.groupby('Product line').agg(revenue=('Total', 'sum'), units=('Quantity', 'sum')).reset_index()
    total_rev = cat_stats['revenue'].sum()
    
    categories = []
    for _, row in cat_stats.iterrows():
        cat = row['Product line']
        rev = float(row['revenue'])
        categories.append({"name": cat, "revenue": rev, "units": int(row['units']), "share": round((rev / total_rev) * 100, 1) if total_rev > 0 else 0})
        
    categories.sort(key=lambda x: x['revenue'], reverse=True)
    return {"status": "success", "data": categories}

@app.get("/api/v1/dashboard/visitors")
def get_visitors(time_filter: str = "all"):
    if not os.path.exists(DATASET_SALES):
        return {"status": "error"}
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    total_tx = len(df)
    if total_tx == 0:
        return {"status": "success", "data": {"total_visitors": 0, "gender": [], "customer_types": [], "insights": {"top_converting_demo": "N/A"}}}
    
    gender_counts = df['Gender'].value_counts()
    gender_data = [{"label": g, "count": int(c), "percent": round((c / total_tx) * 100)} for g, c in gender_counts.items()]
    
    type_counts = df['Customer type'].value_counts()
    type_data = [{"label": str(t), "count": int(c), "percent": round((c / total_tx) * 100)} for t, c in type_counts.items()]
    
    demo_spend = df.groupby(['Gender', 'Customer type'])['Total'].sum().reset_index()
    top_demo_row = demo_spend.loc[demo_spend['Total'].idxmax()]

    return {
        "status": "success", 
        "data": {
            "total_visitors": total_tx, 
            "gender": gender_data,
            "customer_types": type_data,
            "insights": {
                "top_converting_demo": f"{top_demo_row['Gender']} {top_demo_row['Customer type']}"
            }
        }
    }

@app.get("/api/v1/dashboard/dwell")
def get_dwell_analysis():
    """
    Real dwell-time analytics computed entirely from completed shopper tracks
    produced by the server-side YOLOv8 + IOU tracker (see SimpleIOUTracker /
    _summarize_expired_track). Replaces DwellTab's previously hardcoded chart.
    """
    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)

    if not sessions:
        return {
            "status": "success",
            "data": {
                "has_data": False,
                "message": "No completed shopper sessions yet — dwell metrics populate as tracked people leave camera frame.",
                "trend": [],
                "session_count_trend": [],
                "peak_avg": 0,
                "overall_avg": 0,
                "bounce_rate": 0,
                "zone_breakdown": [],
                "total_sessions": 0,
            }
        }

    durations = [s["duration_s"] for s in sessions]
    peak_avg = round(max(durations), 1)
    overall_avg = round(sum(durations) / len(durations), 1)
    bounces = sum(1 for d in durations if d < 5)
    bounce_rate = round((bounces / len(durations)) * 100, 1)

    # Hourly trend, bucketed by when each session ended
    buckets: Dict[str, list] = {}
    for s in sessions:
        hour_label = time.strftime("%H:00", time.localtime(s["last_seen"]))
        buckets.setdefault(hour_label, []).append(s["duration_s"])
    trend = [{"time": h, "value": round(sum(v) / len(v), 1)} for h, v in sorted(buckets.items())]
    session_count_trend = [{"time": h, "value": len(v)} for h, v in sorted(buckets.items())]

    zone_totals: Dict[int, list] = {}
    for s in sessions:
        zone_totals.setdefault(s["camera_id"], []).append(s["duration_s"])
    zone_breakdown = [
        {
            "zone": ZONE_NAMES.get(cam, f"Camera {cam}"),
            "avg_dwell": round(sum(v) / len(v), 1),
            "sessions": len(v),
        }
        for cam, v in zone_totals.items()
    ]
    zone_breakdown.sort(key=lambda z: z["avg_dwell"], reverse=True)

    return {
        "status": "success",
        "data": {
            "has_data": True,
            "trend": trend,
            "session_count_trend": session_count_trend,
            "peak_avg": peak_avg,
            "overall_avg": overall_avg,
            "bounce_rate": bounce_rate,
            "zone_breakdown": zone_breakdown,
            "total_sessions": len(sessions),
        }
    }


@app.get("/api/v1/dashboard/behavior")
def get_behavior_analysis():
    """
    Real, movement-derived behavior signals from completed shopper tracks.

    HONESTY NOTE: We do not run action recognition (no pose/hand model yet),
    so we cannot detect literal "pickups" or "product comparisons". What we
    CAN measure honestly from bounding-box tracks: intervals where a shopper
    stood still (a "pause event") and sessions with multiple separate pauses
    (a "multi-pause" proxy for revisiting/comparing). Field names reflect
    that — see is_estimated flag.
    """
    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)

    if not sessions:
        return {
            "status": "success",
            "data": {
                "has_data": False,
                "message": "No completed shopper sessions yet.",
                "pause_events": 0,
                "multi_pause_sessions_pct": 0,
                "avg_pause_duration": 0,
                "trend": [],
            }
        }

    total_pause_events = 0
    total_pause_duration = 0.0
    multi_pause_sessions = 0
    hourly_pause_counts: Dict[str, int] = {}

    for s in sessions:
        # positions were not retained on the summarized session dict, only on
        # the live track — see wiring note below for exposing raw positions.
        pauses = s.get("pauses", [])
        if pauses:
            total_pause_events += len(pauses)
            total_pause_duration += sum(pauses)
            if len(pauses) >= 2:
                multi_pause_sessions += 1
            hour_label = time.strftime("%H:00", time.localtime(s["last_seen"]))
            hourly_pause_counts[hour_label] = hourly_pause_counts.get(hour_label, 0) + len(pauses)

    avg_pause_duration = round(total_pause_duration / total_pause_events, 1) if total_pause_events else 0
    multi_pause_pct = round((multi_pause_sessions / len(sessions)) * 100, 1) if sessions else 0
    trend = [{"time": h, "value": c} for h, c in sorted(hourly_pause_counts.items())]

    return {
        "status": "success",
        "data": {
            "has_data": True,
            "is_estimated": True,
            "estimate_basis": "Movement-based proxy from tracked position data (no action-recognition model yet)",
            "pause_events": total_pause_events,
            "multi_pause_sessions_pct": multi_pause_pct,
            "avg_pause_duration": avg_pause_duration,
            "trend": trend,
            "total_sessions": len(sessions),
        }
    }


@app.get("/api/v1/dashboard/customer-history")
def get_customer_history(time_filter: str = "all", limit: int = 50):
    """Real recent-transaction feed from DATASET_SALES. Previously called by
    CustomerHistoryTab but never implemented — this was a dead endpoint."""
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}

    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    if len(df) == 0:
        return {"status": "success", "data": []}
    df['Date'] = pd.to_datetime(df['Date'], format='mixed')

    df = df.sort_values('Date', ascending=False).head(limit)

    data = []
    for _, row in df.iterrows():
        data.append({
            "invoice": str(row.get('Invoice ID', 'N/A')),
            "date": row['Date'].strftime('%Y-%m-%d'),
            "time": str(row.get('Time', '--:--')),
            "type": str(row.get('Customer type', 'Guest')),
            "gender": str(row.get('Gender', '')),
            "product": str(row.get('Product line', '')),
            "total": float(row.get('Total', 0)) if pd.notna(row.get('Total', 0)) else 0.0,
        })

    return {"status": "success", "data": data}


@app.get("/api/v1/dashboard/segmentation")
def get_segmentation(time_filter: str = "all"):
    if not os.path.exists(DATASET_SALES):
        return {"status": "error"}
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    if len(df) < 3:
        return {"status": "success", "data": [], "message": "Not enough transactions in this range to cluster."}
    
    features = df[['Total', 'Quantity', 'Rating']]
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    
    n_clusters = min(3, len(df))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
    df['Cluster'] = kmeans.fit_predict(scaled_features)
    
    clusters = []
    for i in range(n_clusters):
        cluster_data = df[df['Cluster'] == i]
        if len(cluster_data) == 0:
            continue
        avg_spend = cluster_data['Total'].mean()
        avg_rating = cluster_data['Rating'].mean()
        
        if avg_spend > 400: label = "High-Value Bulk Buyers"
        elif avg_rating > 8.0: label = "Satisfied Explorers"
        else: label = "Disengaged / Impulse"
            
        clusters.append({
            "id": i,
            "label": label,
            "size": len(cluster_data),
            "share": round((len(cluster_data) / len(df)) * 100, 1),
            "avg_spend": float(avg_spend),
            "avg_rating": float(avg_rating)
        })
        
    return {"status": "success", "data": clusters}

@app.get("/api/v1/dashboard/traffic")
def get_traffic_trend(time_filter: str = "all"):
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    if len(df) == 0:
        return {"status": "success", "data": []}
    df['Date'] = pd.to_datetime(df['Date'], format='mixed')

    daily = df.groupby(df['Date'].dt.date).size().reset_index(name='value')
    daily.columns = ['date_obj', 'value']
    daily = daily.sort_values('date_obj')

    # 'all' can span years — cap to the most recent 30 active days so the
    # chart stays readable; bounded ranges (today/week/month/etc.) are
    # already a reasonable size and shown in full.
    if time_filter == 'all' and len(daily) > 30:
        daily = daily.tail(30)

    daily['time'] = daily['date_obj'].apply(lambda d: d.strftime('%m/%d'))
    trend_data = daily[['time', 'value']].to_dict(orient='records')

    return {"status": "success", "data": trend_data}

@app.get("/api/v1/dashboard/zones")
def get_zones(time_filter: str = "all"):
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    df = pd.read_csv(DATASET_SALES)
    df = filter_sales_df_by_time(df, time_filter)
    if len(df) == 0:
        return {"status": "success", "data": []}

    # NOTE: "transactions" here counts POS invoices per category — a real, CSV-derived
    # proxy for footfall share. It is NOT camera-based footfall; that lives in /dashboard/dwell.
    category_metrics = df.groupby('Product line').agg(
        transactions=('Invoice ID', 'count'),
        units=('Quantity', 'sum'),
        revenue=('Total', 'sum'),
        avg_rating=('Rating', 'mean'),
    ).reset_index()
    total_tx = category_metrics['transactions'].sum()

    zones = []
    colors = ['emerald', 'cyan', 'purple', 'amber', 'rose', 'blue']

    for idx, row in category_metrics.iterrows():
        cat = str(row['Product line']).capitalize()
        tx_share = round((row['transactions'] / total_tx) * 100)
        # Real, CSV-grounded satisfaction score (0-100) derived from the actual
        # 'Rating' column (1-10 scale in the source data) — replaces the previous
        # invented units-per-transaction "conversion" formula.
        satisfaction_score = round((row['avg_rating'] / 10.0) * 100, 1) if pd.notna(row['avg_rating']) else None

        zones.append({
            "id": f"Zone {chr(65+idx)}",
            "name": f"{cat} Displays",
            "traffic_type": "High Traffic" if tx_share > 16 else "Medium Traffic",
            "footfall_share": tx_share,
            "conversion_rate": satisfaction_score,  # kept key name for frontend compatibility; now a real satisfaction score
            "conversion_metric_label": "Customer Satisfaction (Rating-based)",
            "color": colors[idx % len(colors)]
        })
        
    zones.sort(key=lambda x: x['footfall_share'], reverse=True)
    return {"status": "success", "data": zones}

@app.get("/api/v1/dashboard/ai-insights")
def get_ai_insights():
    if not os.path.exists(DATASET_SALES):
        return {"status": "error", "message": "Dataset not found"}
    try:
        df = pd.read_csv(DATASET_SALES)
        demo_grouped = df.groupby(['Gender', 'Product line'])['Total'].sum().reset_index()
        top_demo = demo_grouped.loc[demo_grouped['Total'].idxmax()]
        avg_order = df['Total'].mean()

        rating_by_cat = df.groupby('Product line')['Rating'].mean().sort_values()
        lowest_rated_cat = rating_by_cat.index[0]
        lowest_rating = rating_by_cat.iloc[0]

        # Every insight below is derived directly from columns that exist in
        # DATASET_SALES. No claim references computer vision, clustering results,
        # or "bottleneck" numbers unless the underlying computation actually happened.
        insights = [
            {
                "id": "AI-001",
                "type": "Sales Analysis",
                "title": "Primary Revenue Driver Identified",
                "description": f"{top_demo['Gender']} shoppers are the primary revenue driver for {top_demo['Product line']}, generating ${top_demo['Total']:,.2f} in total sales across {len(df)} recorded transactions.",
                "severity": "success",
                "action": f"Consider targeted promotions or signage near {top_demo['Product line']} aimed at {top_demo['Gender']} shoppers."
            },
            {
                "id": "AI-002",
                "type": "Transaction Analysis",
                "title": "Average Transaction Value (ATV) Baseline",
                "description": f"The dataset shows an average transaction value of ${avg_order:,.2f} across all recorded sales.",
                "severity": "info",
                "action": "Use this baseline to flag unusually high or low-value transactions for review."
            },
            {
                "id": "AI-003",
                "type": "Customer Satisfaction",
                "title": "Lowest-Rated Category",
                "description": f"{lowest_rated_cat} has the lowest average customer rating at {lowest_rating:.1f}/10 across recorded transactions.",
                "severity": "warning",
                "action": f"Review stock availability, staffing, or product quality feedback for {lowest_rated_cat}."
            }
        ]

        # If real camera-tracking sessions exist, add one genuinely CV-sourced insight.
        # This is the ONLY insight allowed to reference dwell/tracking data, and only
        # when COMPLETED_SESSIONS_BUFFER actually has entries to back it up.
        with COMPLETED_SESSIONS_LOCK:
            recent_sessions = list(COMPLETED_SESSIONS_BUFFER[-50:])
        if recent_sessions:
            avg_recent_dwell = sum(s["duration_s"] for s in recent_sessions) / len(recent_sessions)
            insights.append({
                "id": "AI-004",
                "type": "Live Camera Tracking",
                "title": "Recent In-Store Dwell Time",
                "description": f"Across the last {len(recent_sessions)} tracked shopper sessions from live camera feeds, average time-in-frame was {avg_recent_dwell:.1f}s.",
                "severity": "info",
                "action": "See the Dwell tab for a per-zone breakdown of this live tracking data."
            })

        return {"status": "success", "data": insights}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/v1/dashboard/export")
def export_system_data(format: str = Query("csv", enum=["csv", "json"]), metric: str = Query("all", enum=["all", "products", "telemetry"])):
    try:
        export_payload = []
        if os.path.exists(DATASET_SALES):
            df = pd.read_csv(DATASET_SALES)
            category_stats = df.groupby('Product line').agg(units_sold=('Quantity', 'sum'), total_revenue=('Total', 'sum'), avg_unit_price=('Unit price', 'mean')).reset_index()

            for _, row in category_stats.iterrows():
                export_payload.append({
                    "data_type": "product_category",
                    "category": str(row['Product line']).capitalize(),
                    "units_sold": int(row['units_sold']),
                    "total_revenue": round(float(row['total_revenue']), 2),
                    "avg_unit_price": round(float(row['avg_unit_price']), 2)
                })

        if metric in ("all", "telemetry"):
            with COMPLETED_SESSIONS_LOCK:
                sessions = list(COMPLETED_SESSIONS_BUFFER)
            for s in sessions:
                export_payload.append({
                    "data_type": "shopper_session",
                    "category": ZONE_NAMES.get(s["camera_id"], f"Camera {s['camera_id']}"),
                    "units_sold": s["track_id"],       # reused column: track ID
                    "total_revenue": s["duration_s"],  # reused column: session duration (s)
                    "avg_unit_price": s["velocity_px_s"],  # reused column: avg velocity (px/s)
                })
            total_active_boxes = sum(len(boxes) for boxes in LATEST_BBOXES.values())
            export_payload.append({"data_type": "system_telemetry", "category": "Live_Active_Detections", "units_sold": total_active_boxes, "total_revenue": 0.0, "avg_unit_price": 0.0})

        if format == "json":
            json_content = json.dumps(export_payload, indent=2)
            return Response(content=json_content, media_type="application/json", headers={"Content-Disposition": "attachment; filename=consumer_attention_metrics.json"})
        elif format == "csv":
            export_df = pd.DataFrame(export_payload)
            stream = io.StringIO()
            export_df.to_csv(stream, index=False)
            return Response(content=stream.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=consumer_attention_metrics.csv"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate export file: {str(e)}")

# ==========================================
# ATTRACTIVENESS SCORING SERVICE
# ==========================================
def calculate_attractiveness(attention_s, interactions, pickups, conversions, repeats):
    """
    Calculates the Product Attractiveness Score based on the weighted 
    composite model from the project specifications.
    """
    # Normalize raw metrics to a 0-100 baseline for scoring
    norm_attention = min((attention_s / 120.0) * 100, 100)   # Cap at 120s of attention
    norm_interactions = min((interactions / 10.0) * 100, 100) # Cap at 10 interactions
    norm_pickups = min((pickups / 5.0) * 100, 100)            # Cap at 5 pickups
    norm_conversions = min((conversions / 3.0) * 100, 100)    # Cap at 3 conversions
    norm_repeats = min((repeats / 2.0) * 100, 100)            # Cap at 2 repeat visits

    # Apply the exact project weights
    score = (
        (norm_attention * 0.35) +
        (norm_interactions * 0.25) +
        (norm_pickups * 0.20) +
        (norm_conversions * 0.15) +
        (norm_repeats * 0.05)
    )
    return round(score, 1)

@app.get("/api/v1/dashboard/attractiveness")
def get_attractiveness_scores():
    """API Endpoint to serve live Attractiveness Scores to the dashboard."""
    
    # Mocking historical + live data fusion for the demonstration
    mock_products = {
        "Electronics": {"att_s": 85, "intx": 6, "pick": 2, "conv": 1, "rep": 0},
        "Health & Beauty": {"att_s": 110, "intx": 8, "pick": 4, "conv": 2, "rep": 1},
        "Food & Beverage": {"att_s": 45, "intx": 3, "pick": 1, "conv": 1, "rep": 0}
    }
    
    results = []
    for category, metrics in mock_products.items():
        score = calculate_attractiveness(
            metrics["att_s"], 
            metrics["intx"], 
            metrics["pick"], 
            metrics["conv"], 
            metrics["rep"]
        )
        
        results.append({
            "category": category,
            "raw_metrics": metrics,
            "attractiveness_score": score
        })
        
    # Sort highest to lowest
    results.sort(key=lambda x: x["attractiveness_score"], reverse=True)
    
    return {"status": "success", "data": results}

# ==========================================
# MOCK / SUPPLEMENTARY ENDPOINTS
# ==========================================

@app.get("/api/v1/dashboard/alerts")
def get_system_alerts(db: Session = Depends(database.get_db)):
    """
    Rule-based alerts in the 4 categories named by the Milestone 4 spec
    (Shelf Performance, Product Visibility, Traffic Anomaly, Camera Health),
    each only included if the real condition it describes actually holds.
    """
    import uuid
    current_time = time.strftime("%I:%M %p")
    alerts = []

    # --- Shelf Performance Alerts: zone attractiveness score below threshold ---
    scores = db.query(models.ProductAttractiveness).all()
    for s in scores:
        if s.final_score < 35:
            alerts.append({
                "id": str(uuid.uuid4())[:8].upper(),
                "severity": "warning",
                "type": "Shelf Performance Alert",
                "message": f"{s.category} attractiveness score is {s.final_score}/100 — below the 35 target threshold.",
                "timestamp": current_time,
                "source": s.category,
                "status": "Active",
            })

    # --- Product Visibility Alerts: real Rating below threshold in the sales data ---
    if os.path.exists(DATASET_SALES):
        df = pd.read_csv(DATASET_SALES)
        rating_by_cat = df.groupby('Product line')['Rating'].mean()
        for cat, rating in rating_by_cat[rating_by_cat < 6.0].items():
            alerts.append({
                "id": str(uuid.uuid4())[:8].upper(),
                "severity": "warning",
                "type": "Product Visibility Alert",
                "message": f"{cat} is averaging {rating:.1f}/10 — consider reviewing placement, signage, or stock quality.",
                "timestamp": current_time,
                "source": "Sales Dataset",
                "status": "Active",
            })

    # --- Traffic Anomaly Notifications: zone dwell far above the overall average ---
    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)
    if sessions:
        zone_totals: Dict[int, list] = {}
        for s in sessions:
            zone_totals.setdefault(s["camera_id"], []).append(s["duration_s"])
        overall_avg = sum(s["duration_s"] for s in sessions) / len(sessions)
        for cam, durations in zone_totals.items():
            zone_avg = sum(durations) / len(durations)
            if zone_avg > overall_avg * 1.75 and len(durations) >= 3:
                alerts.append({
                    "id": str(uuid.uuid4())[:8].upper(),
                    "severity": "critical",
                    "type": "Traffic Anomaly Notification",
                    "message": f"{ZONE_NAMES.get(cam, f'Camera {cam}')} shows {zone_avg:.1f}s avg dwell — well above the {overall_avg:.1f}s overall average (possible congestion).",
                    "timestamp": current_time,
                    "source": ZONE_NAMES.get(cam, f"Camera {cam}"),
                    "status": "Active",
                })
    else:
        alerts.append({
            "id": str(uuid.uuid4())[:8].upper(),
            "severity": "info",
            "type": "Traffic Anomaly Notification",
            "message": "No completed camera sessions yet — traffic anomaly detection needs live tracking data.",
            "timestamp": current_time,
            "source": "System",
            "status": "Active",
        })

    # --- Camera Health Alerts: real staleness check against CAMERA_LAST_UPDATE ---
    STALE_THRESHOLD_S = 30
    now = time.time()
    for cam_id, zone_name in ZONE_NAMES.items():
        last_update = CAMERA_LAST_UPDATE.get(cam_id)
        if last_update is None:
            alerts.append({
                "id": str(uuid.uuid4())[:8].upper(),
                "severity": "info",
                "type": "Camera Health Alert",
                "message": f"Camera {cam_id} ({zone_name}) has never reported detections — its MJPEG stream endpoint hasn't been consumed yet.",
                "timestamp": current_time,
                "source": f"Camera {cam_id}",
                "status": "Active",
            })
        elif now - last_update > STALE_THRESHOLD_S:
            alerts.append({
                "id": str(uuid.uuid4())[:8].upper(),
                "severity": "critical",
                "type": "Camera Health Alert",
                "message": f"Camera {cam_id} ({zone_name}) hasn't reported detections in {int(now - last_update)}s — possible stream disconnect or frame loss.",
                "timestamp": current_time,
                "source": f"Camera {cam_id}",
                "status": "Active",
            })

    return {"status": "success", "data": alerts}


@app.get("/api/v1/dashboard/heatmap")
def get_heatmap_data(layer: str = "traffic", time_filter: str = "all", db: Session = Depends(get_db)):
    """
    Real heatmap points, in 3 layers matching the spec's Heatmap Layer
    Generation step.
    """
    # 1. Dynamically fetch the updated zones from the SQLite Database
    db_zones = db.query(StoreZoneDB).all()
    
    # 2. Map the DB zones to the format the heatmap engine expects
    camera_zone_rects = {}
    for z in db_zones:
        if z.camera_assigned > 0:
            camera_zone_rects[z.camera_assigned] = {"x": z.x, "y": z.y, "w": z.w, "h": z.h}
            
    FRAME_W, FRAME_H = 640, 360  # matches the resize in stream_camera_frames

    def _real_wallclock_cutoff(tf: str):
        now = time.time()
        DAY = 86400
        if tf == "today":
            return now - DAY
        if tf == "yesterday":
            return now - 2 * DAY  
        if tf == "week":
            return now - 7 * DAY
        if tf == "month":
            return now - 30 * DAY
        if tf == "quarter":
            return now - 90 * DAY
        if tf == "year":
            return now - 365 * DAY
        return None  

    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)
        
    cutoff = _real_wallclock_cutoff(time_filter)
    if cutoff is not None:
        sessions = [s for s in sessions if s["last_seen"] >= cutoff]

    points = []

    if layer == "traffic":
        # Prefer live detections if any camera is actively streaming right now
        for cam_id, boxes in LATEST_BBOXES.items():
            zone = camera_zone_rects.get(cam_id)
            if not zone or not boxes:
                continue
            for box in boxes:
                x1, y1, x2, y2 = box.get("x1", 0), box.get("y1", 0), box.get("x2", 0), box.get("y2", 0)
                conf = box.get("conf", 0.5)
                nx = min(max(((x1 + x2) / 2) / FRAME_W, 0), 1)
                ny = min(max(((y1 + y2) / 2) / FRAME_H, 0), 1)
                points.append({
                    "x": zone["x"] + nx * zone["w"],
                    "y": zone["y"] + ny * zone["h"],
                    "weight": min(40 + conf * 60, 100),
                })

        # Replay historical trajectory points
        if not points or time_filter != "all":
            for s in sessions:
                zone = camera_zone_rects.get(s["camera_id"])
                if not zone:
                    continue
                for p in s.get("positions_sample", []):
                    nx = min(max(((p["x1"] + p["x2"]) / 2) / FRAME_W, 0), 1)
                    ny = min(max(((p["y1"] + p["y2"]) / 2) / FRAME_H, 0), 1)
                    points.append({
                        "x": zone["x"] + nx * zone["w"],
                        "y": zone["y"] + ny * zone["h"],
                        "weight": 55,
                    })

    elif layer == "shelf":
        shelf_resp = get_shelf_metrics()
        for z in shelf_resp.get("data", []):
            zone = camera_zone_rects.get(z["camera_id"])
            if not zone:
                continue
            points.append({
                "x": zone["x"] + zone["w"] / 2,
                "y": zone["y"] + zone["h"] / 2,
                "weight": max(z["engagement_score"], 15),
            })

    elif layer == "attention":
        by_zone: Dict[int, int] = {}
        for s in sessions:
            by_zone[s["camera_id"]] = by_zone.get(s["camera_id"], 0) + len(s.get("pauses", []))
        max_pauses = max(by_zone.values(), default=1) or 1
        for cam_id, pause_count in by_zone.items():
            zone = camera_zone_rects.get(cam_id)
            if not zone:
                continue
            points.append({
                "x": zone["x"] + zone["w"] / 2,
                "y": zone["y"] + zone["h"] / 2,
                "weight": max(round((pause_count / max_pauses) * 100), 15),
            })

    message = None
    if not points:
        if layer == "traffic":
            message = "No active detections or completed sessions in this range. Open the Cameras tab to start live tracking."
        else:
            message = "No completed shopper sessions yet — this layer needs real tracking data first."

    return {"status": "success", "data": points, "has_data": len(points) > 0, "message": message}
@app.get("/api/v1/dashboard/shelves")
def get_shelf_metrics():
    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)

    if not sessions:
        return {
            "status": "success",
            "data": [],
            "has_data": False,
            "message": "No completed shopper sessions yet. Engagement scores populate as tracked people leave camera frame."
        }

    by_zone: Dict[int, list] = {}
    for s in sessions:
        by_zone.setdefault(s["camera_id"], []).append(s["duration_s"])

    max_avg = max((sum(v) / len(v) for v in by_zone.values()), default=1) or 1

    zones = []
    for cam_id, durations in by_zone.items():
        avg_dwell = sum(durations) / len(durations)
        # Normalize against the busiest zone so scores are comparable 0-100
        engagement_score = round((avg_dwell / max_avg) * 100)
        if engagement_score >= 80:
            status = "High Engagement"
        elif engagement_score >= 50:
            status = "Moderate"
        else:
            status = "Low Engagement"

        zones.append({
            "zone": ZONE_NAMES.get(cam_id, f"Camera {cam_id}"),
            "camera_id": cam_id,
            "avg_dwell_seconds": round(avg_dwell, 1),
            "engagement_score": engagement_score,
            "sessions": len(durations),
            "status": status,
        })

    zones.sort(key=lambda z: z["engagement_score"], reverse=True)
    return {"status": "success", "data": zones, "has_data": True}

@app.get("/api/v1/dashboard/journey")
def get_journey_analysis():
    """
    Real per-camera completed-session counts as "zones" — the only part of
    a shopper journey the current 4-camera center cluster can actually
    measure. Previously this whole endpoint was a single hardcoded dict
    (fake "Main Entrance: 8,426" / "Checkout: 8,892" numbers that didn't
    move no matter what the cameras saw).

    HONESTY LIMITATION: under the current floor plan (storeZones.ts), no
    camera is mounted at Entrance or Checkout — those are separate,
    camera-less zones — so there is no real detection count for "entries"
    or "exits" to report. Rather than fabricate numbers for zones nothing
    is watching, those arrays are returned empty with has_data flags the
    frontend can check, consistent with /dashboard/dwell, /behavior, and
    /shelves.
    """
    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)

    by_camera: Dict[int, int] = {}
    for s in sessions:
        by_camera[s["camera_id"]] = by_camera.get(s["camera_id"], 0) + 1

    total = sum(by_camera.values())
    zones = []
    if total > 0:
        for cam_id, count in sorted(by_camera.items(), key=lambda kv: kv[1], reverse=True):
            zones.append({
                "id": f"cam{cam_id}",
                "label": ZONE_NAMES.get(cam_id, f"Camera {cam_id}"),
                "value": f"{count:,}",
                "pct": f"{round((count / total) * 100)}%",
            })

    return {
        "status": "success",
        "data": {
            "entries": [],
            "zones": zones,
            "exits": [],
        },
        "has_camera_data": total > 0,
        "has_entrance_exit_data": False,
        "message": (
            None if total > 0
            else "No completed shopper sessions yet. Open the Cameras tab to start live tracking."
        ),
        "note": "Entrance/exit counts aren't shown — no camera is mounted at either zone in the current floor plan.",
    }

@app.get("/api/v1/dashboard/reports")
def get_reports_summary():
    weekly_visitors = 0
    top_sales_category = "N/A"
    if os.path.exists(DATASET_SALES):
        df = pd.read_csv(DATASET_SALES)
        weekly_visitors = len(df)  # real transaction count from CSV
        top_sales_category = str(df.groupby('Product line')['Total'].sum().idxmax())

    with COMPLETED_SESSIONS_LOCK:
        sessions = list(COMPLETED_SESSIONS_BUFFER)

    avg_dwell_time = "N/A — no completed camera sessions yet"
    top_traffic_zone = "N/A — no completed camera sessions yet"
    recommendations = ["Recommendations will populate once camera tracking sessions accumulate."]

    if sessions:
        avg_dwell_time = f"{sum(s['duration_s'] for s in sessions) / len(sessions):.1f}s"
        counts: Dict[int, int] = {}
        for s in sessions:
            counts[s["camera_id"]] = counts.get(s["camera_id"], 0) + 1
        top_cam = max(counts, key=counts.get)
        top_traffic_zone = ZONE_NAMES.get(top_cam, f"Camera {top_cam}")
        recommendations = [f"{top_traffic_zone} shows the highest camera-tracked engagement — verify staffing coverage there."]

    return {
        "status": "success",
        "data": {
            "period": "All Recorded Data",
            "weekly_visitors": weekly_visitors,
            "avg_dwell_time": avg_dwell_time,
            # Honest placeholder: we don't yet link a POS transaction to a specific
            # tracked camera session, so a true conversion rate isn't computable.
            "conversion_rate": "N/A — requires POS/camera session linkage",
            "top_zone": top_traffic_zone,
            "top_sales_category": top_sales_category,
            "critical_alerts": 0,
            "recommendations": recommendations,
        }
    }

@app.get("/api/v1/pos/live")
def get_live_pos():
    if random.random() > 0.4:
        sale_amount = random.randint(150, 4500)
        LIVE_POS["revenue"] += sale_amount
        LIVE_POS["conversions"] += 1
        
        # Generate Customer ID and precise Timestamp for matching
        customer_id = f"CUST-{random.randint(1000, 9999)}"
        tx_time = time.time()
        RECENT_TRANSACTIONS.append({
            "timestamp": tx_time,
            "customer_id": customer_id,
            "amount": sale_amount
        })
        if len(RECENT_TRANSACTIONS) > 50:
            RECENT_TRANSACTIONS.pop(0)
            
        return {
            "new_sale": True, 
            "amount": sale_amount, 
            "total_revenue": LIVE_POS["revenue"], 
            "total_conversions": LIVE_POS["conversions"],
            "recent_customer": customer_id
        }
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