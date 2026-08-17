"""
CAMS FastAPI Backend — Main Entry Point
=======================================
Extends existing REST analytics endpoints with:
  - WebSocket streaming: /cams/stream/{cameraId}
  - One independent detection session per camera
  - YOLOv8 + ByteTrack via detection_engine.py

Existing REST endpoints are UNCHANGED.
"""

import sys
import os
import asyncio
import logging
import json
from pathlib import Path

from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Load .env from backend directory
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# Add directory to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from behavior_engine import behavior_engine
from heatmap_engine import heatmap_engine
from attractiveness_engine import attractiveness_engine
from recommendation_engine import recommendation_engine
from detection_engine import get_or_create_session, get_session, YOLO_MODEL, YOLO_DEVICE
from database import execute_query

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Video file paths — relative to project root
# The frontend serves these from /public/videos/ but the backend reads the
# same files directly from the filesystem via their absolute path.
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent.parent
VIDEO_ROOT   = PROJECT_ROOT / "frontend" / "public" / "videos"

CAMERA_VIDEO_MAP = {
    "CAM-01": str(VIDEO_ROOT / "store1.mp4"),
    "CAM-02": str(VIDEO_ROOT / "aisle1.mp4"),
    "CAM-03": str(VIDEO_ROOT / "checkout1.mp4"),
    "CAM-04": str(VIDEO_ROOT / "checkout2.mp4"),
}

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CAMS Retail Analytics AI Engine",
    description=(
        "Consumer Attention Mapping System — Behavior, Heatmap, Attractiveness, "
        "Recommendation, and Live Person Detection API"
    ),
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Startup: pre-load model and pre-start all camera sessions
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    logger.info("CAMS Backend starting up...")
    logger.info(f"YOLO model: {YOLO_MODEL}  device: {YOLO_DEVICE}")
    logger.info(f"Video root: {VIDEO_ROOT}")

    # Pre-load YOLO model so first WebSocket connection is fast
    try:
        from detection_engine import get_yolo_model
        await asyncio.get_running_loop().run_in_executor(None, get_yolo_model)
        logger.info("YOLO model pre-loaded ✓")
    except Exception as exc:
        logger.error(f"YOLO model pre-load failed: {exc}")

    # Pre-start detection sessions for all cameras
    for cam_id, video_path in CAMERA_VIDEO_MAP.items():
        if not Path(video_path).exists():
            logger.warning(f"Video file missing for {cam_id}: {video_path}")
            continue
        get_or_create_session(cam_id, video_path)
        logger.info(f"Detection session started: {cam_id}")


# ---------------------------------------------------------------------------
# WebSocket — Live Person Tracking Stream
# ---------------------------------------------------------------------------
@app.websocket("/cams/stream/{camera_id}")
async def websocket_stream(websocket: WebSocket, camera_id: str):
    """
    Per-camera WebSocket endpoint.
    Sends JSON tracking payloads as YOLOv8+ByteTrack detects people.

    Payload format:
    {
      "type": "tracks",
      "cameraId": "CAM-01",
      "source": { "width": 1920, "height": 1080 },
      "tracks": [ { "trackId": "TRK-001", "bbox": {x,y,w,h}, "confidence": 0.87, ... } ],
      "timestamp": 1699999999999
    }
    """
    await websocket.accept()
    logger.info(f"WebSocket connected: {camera_id} from {websocket.client}")

    camera_id_upper = camera_id.upper()

    if camera_id_upper not in CAMERA_VIDEO_MAP:
        await websocket.send_json({
            "type": "error",
            "message": f"Unknown camera ID: {camera_id}. Valid: {list(CAMERA_VIDEO_MAP.keys())}",
        })
        await websocket.close(code=4004)
        return

    video_path = CAMERA_VIDEO_MAP[camera_id_upper]
    if not Path(video_path).exists():
        await websocket.send_json({
            "type": "error",
            "message": f"Video file not found: {video_path}",
        })
        await websocket.close(code=4005)
        return

    # Get or create the detection session
    session = get_or_create_session(camera_id_upper, video_path)

    # Register this WebSocket's queue subscriber
    queue = asyncio.Queue(maxsize=2)
    session.add_subscriber_queue(queue)

    # Notify client of connection success
    await websocket.send_json({
        "type": "connected",
        "cameraId": camera_id_upper,
        "message": f"Streaming {camera_id_upper} — YOLO: {YOLO_MODEL}",
    })

    async def sender_task():
        try:
            while True:
                payload = await queue.get()
                await websocket.send_json(payload)
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    send_job = asyncio.create_task(sender_task())

    try:
        # Keep the connection alive by receiving client messages/pings
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_text("pong")
                    continue
                if data == "pong":
                    continue
            except asyncio.TimeoutError:
                # Send keepalive ping
                await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {camera_id_upper}")
    except Exception as exc:
        logger.warning(f"WebSocket error {camera_id_upper}: {exc}")
    finally:
        send_job.cancel()
        session.remove_subscriber_queue(queue)


# ---------------------------------------------------------------------------
# Existing Pydantic Models (unchanged)
# ---------------------------------------------------------------------------
class TrackingPoint(BaseModel):
    x: float
    y: float
    t: Optional[float] = None


class TrajectoryRequest(BaseModel):
    shopper_id: str
    points: List[TrackingPoint]
    pickups: Optional[int] = 0
    returns: Optional[int] = 0
    comparisons: Optional[int] = 0


# ---------------------------------------------------------------------------
# Existing REST Endpoints (ALL UNCHANGED)
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "system": "Consumer Attention Mapping System (CAMS) Engine",
        "version": "4.0.0",
        "status": "Online",
        "docs_url": "/docs",
        "websocket": "/cams/stream/{cameraId}",
    }


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "CAMS Milestone 4 — YOLOv8 + ByteTrack",
        "yolo_model": YOLO_MODEL,
        "cameras": list(CAMERA_VIDEO_MAP.keys()),
    }


@app.post("/api/v1/behavior/trajectory")
def calculate_shopper_trajectory(req: TrajectoryRequest):
    pts = [{"x": p.x, "y": p.y, "t": p.t} for p in req.points]
    trajectory = behavior_engine.calculate_trajectory(pts)
    segment = behavior_engine.classify_shopper_segment(
        trajectory, req.pickups, req.returns, req.comparisons
    )
    return {
        "shopper_id": req.shopper_id,
        "trajectory": trajectory,
        "segmentation": segment,
    }


@app.get("/api/v1/heatmap")
def get_heatmap(
    layer: str = Query("Store Traffic"),
    period: str = Query("Last 7 Days"),
):
    return heatmap_engine.get_heatmap_layer(layer, period)


@app.get("/api/v1/attractiveness/scores")
def get_attractiveness_scores():
    return attractiveness_engine.compute_sku_scores()


@app.get("/api/v1/recommendations")
def get_merchandising_recommendations():
    scores = attractiveness_engine.compute_sku_scores()
    return recommendation_engine.generate_recommendations(scores)


@app.get("/api/v1/dashboards/store-manager")
def get_store_manager_analytics(period: str = Query("Last 7 Days")):
    heatmap_data = heatmap_engine.get_heatmap_layer("Store Traffic", period)
    scores = attractiveness_engine.compute_sku_scores()
    recs = recommendation_engine.generate_recommendations(scores)
    return {
        "period": period,
        "kpis": {
            "totalVisitors": 2450 if period == "Last 7 Days" else 350,
            "avgDwellTime": 18.5,
            "conversionRate": 24.2,
            "productsPicked": 1245,
        },
        "heatmap": heatmap_data,
        "attractiveness_scores": scores[:5],
        "recommendations": recs,
    }


@app.get("/api/v1/behavior/journey")
def get_behavior_journey_analytics(period: str = Query("Last 7 Days")):
    """
    Computes real customer journey analytics, transitions, and shopper segments from PostgreSQL.
    """
    try:
        # 1. Fetch real customer sessions
        cust_rows = execute_query(
            "SELECT customer_id, dwell_time, purchase_status, purchase_amount, zone, products_viewed, products_purchased FROM customers;"
        )
        
        # 2. Fetch real transition tracks
        tracks_res = execute_query(
            "SELECT track_id, zone_id, timestamp FROM tracking ORDER BY track_id, timestamp;"
        )
    except Exception as e:
        logger.error(f"Failed to query journey analytics: {e}")
        cust_rows = []
        tracks_res = []

    # If no real data, fallback to baseline models
    if not cust_rows:
        return {
            "period": period,
            "segmentation": [
                {"segment": "Explorer",              "share": "32%", "count": 784},
                {"segment": "Quick Buyer",           "share": "28%", "count": 686},
                {"segment": "Comparison Shopper",    "share": "18%", "count": 441},
                {"segment": "Impulse Buyer",         "share": "14%", "count": 343},
                {"segment": "Brand Loyal Customer",  "share": "8%",  "count": 196},
            ],
            "common_paths": [
                {"path": "Entry → Bakery → Dairy → Checkout", "freq": 2840, "convRate": 32.4, "avgTime": 18.2},
                {"path": "Entry → Produce → Dairy → Aisle 1 → Checkout", "freq": 2210, "convRate": 28.6, "avgTime": 24.1},
                {"path": "Entry → Promo → Electronics → Checkout", "freq": 1680, "convRate": 18.4, "avgTime": 15.6},
                {"path": "Entry → Bakery → Produce → Dairy → Frozen → Checkout", "freq": 1420, "convRate": 42.1, "avgTime": 32.8},
                {"path": "Entry → Cosmetics → Household → Checkout", "freq": 980, "convRate": 14.2, "avgTime": 12.4},
            ],
            "zone_transitions": [
                {"from": "Entry", "to": "Produce", "count": 4820, "pct": 33.8},
                {"from": "Entry", "to": "Bakery", "count": 3960, "pct": 27.8},
                {"from": "Entry", "to": "Promo Zone", "count": 2850, "pct": 20.0},
                {"from": "Produce", "to": "Dairy", "count": 3210, "pct": 66.6},
                {"from": "Bakery", "to": "Dairy", "count": 2680, "pct": 67.7},
                {"from": "Dairy", "to": "Aisle 1", "count": 2940, "pct": 49.9},
                {"from": "Aisle 1", "to": "Checkout", "count": 1820, "pct": 61.9},
                {"from": "Promo Zone", "to": "Electronics", "count": 1420, "pct": 49.8},
            ]
        }

    # Group tracks to find journeys
    journeys = {}
    for r in tracks_res:
        t_id = r["track_id"]
        z_id = r["zone_id"]
        if t_id not in journeys:
            journeys[t_id] = []
        if not journeys[t_id] or journeys[t_id][-1] != z_id:
            journeys[t_id].append(z_id)

    # Count paths frequency
    path_freqs = {}
    path_details = {}
    for t_id, zones in journeys.items():
        if len(zones) < 2:
            continue
        path_str = " → ".join(zones)
        path_freqs[path_str] = path_freqs.get(path_str, 0) + 1
        
        # Calculate conversion and time stats for this track
        cust_match = [c for c in cust_rows if c["customer_id"].endswith(t_id)]
        dwell_min = (cust_match[0]["dwell_time"] or 0.25) * 60.0 if cust_match else 15.0
        is_conv = 1 if (cust_match and cust_match[0]["purchase_status"] == 'Purchased') else 0
        
        if path_str not in path_details:
            path_details[path_str] = {"total_time": 0.0, "conversions": 0, "count": 0}
        
        path_details[path_str]["total_time"] += dwell_min
        path_details[path_str]["conversions"] += is_conv
        path_details[path_str]["count"] += 1

    common_paths = []
    for path, freq in sorted(path_freqs.items(), key=lambda x: x[1], reverse=True)[:5]:
        details = path_details[path]
        avg_time = round(details["total_time"] / details["count"], 1)
        conv_rate = round((details["conversions"] / details["count"]) * 100, 1)
        common_paths.append({
            "path": path,
            "freq": freq,
            "convRate": conv_rate,
            "avgTime": avg_time
        })

    # Group transitions
    transitions = {}
    from_zone_counts = {}
    for t_id, zones in journeys.items():
        for i in range(len(zones) - 1):
            fz = zones[i]
            tz = zones[i+1]
            pair = (fz, tz)
            transitions[pair] = transitions.get(pair, 0) + 1
            from_zone_counts[fz] = from_zone_counts.get(fz, 0) + 1

    zone_transitions = []
    for (fz, tz), count in sorted(transitions.items(), key=lambda x: x[1], reverse=True)[:8]:
        total_from = from_zone_counts[fz]
        pct = round((count / total_from) * 100, 1) if total_from > 0 else 0.0
        zone_transitions.append({
            "from": fz,
            "to": tz,
            "count": count,
            "pct": pct
        })

    # Group segments
    segment_counts = {
        "Explorer": 0,
        "Quick Buyer": 0,
        "Comparison Shopper": 0,
        "Impulse Buyer": 0,
        "Brand Loyal Customer": 0
    }
    
    for c in cust_rows:
        dwell_min = (c["dwell_time"] or 0.0) * 60.0
        purchased = c["purchase_status"] == 'Purchased'
        p_viewed = len(c["products_viewed"] or [])
        
        if p_viewed >= 2 and dwell_min >= 20:
            segment = "Comparison Shopper"
        elif dwell_min >= 30:
            segment = "Explorer"
        elif dwell_min <= 5 and purchased:
            segment = "Quick Buyer"
        elif purchased and p_viewed <= 1:
            segment = "Impulse Buyer"
        else:
            segment = "Brand Loyal Customer"
        segment_counts[segment] += 1

    total_custs = len(cust_rows)
    segmentation = []
    for seg, count in segment_counts.items():
        share_pct = round((count / total_custs) * 100, 1) if total_custs > 0 else 0.0
        segmentation.append({
            "segment": seg,
            "share": f"{share_pct}%",
            "count": count
        })

    # 1. Hourly Activity Heatmap from real tracking logs
    hours_labels = ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM", "6PM", "7PM", "8PM", "9PM"]
    day_keys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    matrix = {h: {d: 0 for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} for h in hours_labels}
    try:
        hourly_res = execute_query(
            "SELECT EXTRACT(DOW FROM timestamp)::int as dow, EXTRACT(HOUR FROM timestamp)::int as hour, COUNT(*) as cnt "
            "FROM tracking WHERE timestamp IS NOT NULL GROUP BY dow, hour;"
        )
        if hourly_res:
            max_cnt = max((r["cnt"] for r in hourly_res), default=1)
            for r in hourly_res:
                hr = r["hour"]
                dow = r["dow"]
                if 9 <= hr <= 21:
                    lbl = hours_labels[hr - 9]
                    day_name = day_keys[dow % 7]
                    heat_val = min(100, max(10, round((r["cnt"] / max_cnt) * 100)))
                    matrix[lbl][day_name] = heat_val
    except Exception as e:
        logger.error(f"Error calculating hourly heatmap: {e}")

    hourly_activity_heatmap = [{"hour": h, **matrix[h]} for h in hours_labels]

    # 2. RFM Distribution from PostgreSQL customers
    rfm_distribution = []
    try:
        rfm_res = execute_query("""
            SELECT 
                COALESCE(AVG(EXTRACT(DAY FROM NOW() - visit_date::timestamp)), 4) as avg_recency,
                COUNT(*) as size,
                COALESCE(AVG(purchase_amount), 35.0) as avg_monetary,
                COALESCE(AVG(dwell_time * 10), 2.5) as avg_freq,
                purchase_status
            FROM customers 
            GROUP BY purchase_status;
        """)
        for r in rfm_res:
            is_p = r["purchase_status"] == "Purchased"
            seg_name = "Loyal Champions" if is_p else "Browse Visitors"
            rfm_distribution.append({
                "recency": round(float(r["avg_recency"] or 3), 1),
                "frequency": round(float(r["avg_freq"] or 2.0), 1),
                "monetary": round(float(r["avg_monetary"] or 25.0), 1),
                "segment": seg_name,
                "size": int(r["size"] or 0)
            })
    except Exception as e:
        logger.error(f"Error calculating RFM: {e}")

    # 3. Shopping Behavior breakdown from PostgreSQL product_interactions & transactions
    shopping_behavior = []
    try:
        inter_totals = execute_query(
            "SELECT SUM(views) as v, SUM(pickups) as p, SUM(returns) as r FROM product_interactions;"
        )
        txn_cnt = execute_query("SELECT COUNT(*) as cnt FROM transactions;")[0]["cnt"] or 0
        total_v = (inter_totals[0]["v"] or 0) if inter_totals else 0
        total_p = (inter_totals[0]["p"] or 0) if inter_totals else 0
        total_r = (inter_totals[0]["r"] or 0) if inter_totals else 0
        
        actions_raw = [
            ("Browse Only", max(1, total_v - total_p)),
            ("Product Pickup", total_p),
            ("Compare & Return", total_r),
            ("Add to Cart", total_p),
            ("Purchase", txn_cnt)
        ]
        sum_actions = sum(c for _, c in actions_raw) or 1
        shopping_behavior = [
            {"action": name, "count": count, "pct": round((count / sum_actions) * 100, 1)}
            for name, count in actions_raw
        ]
    except Exception as e:
        logger.error(f"Error calculating shopping behavior: {e}")

    # 4. Traffic Flow Bottlenecks from PostgreSQL dwell_metrics & tracking
    bottlenecks = []
    try:
        dwell_res = execute_query(
            "SELECT zone_id, avg_dwell_time, visitor_count FROM dwell_metrics ORDER BY visitor_count DESC LIMIT 6;"
        )
        if dwell_res:
            max_v = max((r["visitor_count"] for r in dwell_res), default=1)
            for d in dwell_res:
                density = min(99, max(15, round((d["visitor_count"] / max_v) * 100)))
                wait_min = round(float(d["avg_dwell_time"] or 30.0) / 60.0, 1)
                status = "Critical" if density > 80 else "High" if density > 65 else "Medium" if density > 45 else "Normal"
                bottlenecks.append({
                    "zone": d["zone_id"],
                    "density": density,
                    "avgWait": f"{wait_min} min",
                    "status": status
                })
    except Exception as e:
        logger.error(f"Error calculating bottlenecks: {e}")

    return {
        "period": period,
        "segmentation": segmentation,
        "common_paths": common_paths,
        "zone_transitions": zone_transitions,
        "hourly_activity_heatmap": hourly_activity_heatmap,
        "rfm_distribution": rfm_distribution,
        "shopping_behavior": shopping_behavior,
        "bottlenecks": bottlenecks
    }


@app.get("/api/v1/dashboards/retail-analyst")
def get_retail_analyst_analytics(period: str = Query("Last 7 Days")):
    scores = attractiveness_engine.compute_sku_scores()
    journey_data = get_behavior_journey_analytics(period)
    return {
        "period": period,
        "segmentation": journey_data["segmentation"],
        "sku_rankings": scores,
    }


@app.get("/api/v1/dashboards/marketing-manager")
def get_marketing_manager_analytics(period: str = Query("Last 7 Days")):
    return {
        "period": period,
        "campaigns": [
            {"name": "Summer Organic Festival",    "reach": 4200, "conversion": "32.4%", "roi": "4.2x"},
            {"name": "Bakery Artisan Promo",       "reach": 2800, "conversion": "28.6%", "roi": "3.8x"},
            {"name": "Beverages Hydration Hub",    "reach": 5100, "conversion": "41.2%", "roi": "5.1x"},
        ],
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
