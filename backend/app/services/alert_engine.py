"""
Redis Streams alert engine for Milestone 4.

Evaluates real signals from the existing system and publishes alert events
onto the Redis `alerts` stream. It deliberately does not fabricate SKU-level
metrics: product visibility is represented by the real attention score from
ProductAttractivenessScore, while shelf performance uses the real final score.

Run the evaluator through alert_worker.py rather than importing this module
as a FastAPI startup task. Keeping it as a separate process avoids duplicate
workers when uvicorn --reload is used.
"""

import json
import time
import uuid
from datetime import datetime, timedelta
from statistics import mean

from sqlmodel import Session, select

from app.core.db import engine
from app.core.redis_client import redis_client
from app.models.camera import Camera
from app.models.product_attractiveness_score import ProductAttractivenessScore
from app.services.traffic_analytics_service import compute_traffic_over_time

ALERT_STREAM_KEY = "alerts"

# Camera health: same timeout used by the Admin Camera Health endpoint.
CAMERA_HEARTBEAT_TIMEOUT_SECONDS = 60

# Alert cooldown prevents a continuously bad condition from filling Redis
# with duplicate messages every evaluator cycle.
ALERT_COOLDOWN_SECONDS = 15 * 60

# Thresholds are explicit engineering assumptions, not measurements from
# the project PDFs.
SHELF_PERFORMANCE_THRESHOLD = 0.40
PRODUCT_VISIBILITY_THRESHOLD = 0.35
TRAFFIC_ANOMALY_MULTIPLIER = 1.80
TRAFFIC_MIN_BASELINE_BUCKETS = 3
TRAFFIC_MIN_EVENT_COUNT = 5



def _state_key(alert_type: str, target_id: str) -> str:
    return f"alert_state:{alert_type}:{target_id}"



def _publish_once(alert_type: str, target_id: str, payload: dict) -> bool:
    """Publish an alert if its cooldown has expired."""
    key = _state_key(alert_type, target_id)
    now = time.time()
    previous = redis_client.get(key)

    if previous:
        try:
            previous_time = float(previous)
            if now - previous_time < ALERT_COOLDOWN_SECONDS:
                return False
        except ValueError:
            pass

    fields = {
        "alert_type": alert_type,
        "target_id": target_id,
        "created_at": datetime.utcnow().isoformat(),
        "payload": json.dumps(payload, default=str),
    }

    redis_client.xadd(ALERT_STREAM_KEY, fields)
    redis_client.set(key, str(now), ex=ALERT_COOLDOWN_SECONDS)
    return True



def evaluate_camera_health() -> int:
    """Publish alerts for cameras that stopped sending heartbeats."""
    now = datetime.utcnow()
    published = 0

    with Session(engine) as session:
        cameras = session.exec(select(Camera)).all()

    for camera in cameras:
        # Cameras that have never sent a heartbeat are not treated as
        # offline alerts. They simply have no health signal yet.
        if not camera.last_seen_at:
            continue

        last_seen = camera.last_seen_at
        if last_seen.tzinfo is not None:
            last_seen = last_seen.replace(tzinfo=None)

        age = (now - last_seen).total_seconds()
        if age > CAMERA_HEARTBEAT_TIMEOUT_SECONDS:
            if _publish_once(
                "camera_health",
                str(camera.id),
                {
                    "camera_id": str(camera.id),
                    "camera_name": camera.name,
                    "status": "offline",
                    "last_seen_at": camera.last_seen_at.isoformat(),
                    "seconds_since_last_seen": round(age, 1),
                },
            ):
                published += 1

    return published



def evaluate_shelf_performance() -> int:
    """Publish alerts for low real attractiveness/shelf-performance scores."""
    published = 0

    with Session(engine) as session:
        rows = session.exec(
            select(ProductAttractivenessScore).order_by(
                ProductAttractivenessScore.computed_at.desc()
            )
        ).all()

    # Keep only the newest score per shelf.
    latest_by_shelf: dict[uuid.UUID, ProductAttractivenessScore] = {}
    for row in rows:
        if row.shelf_id not in latest_by_shelf:
            latest_by_shelf[row.shelf_id] = row

    for row in latest_by_shelf.values():
        if row.final_score < SHELF_PERFORMANCE_THRESHOLD:
            if _publish_once(
                "shelf_performance",
                str(row.shelf_id),
                {
                    "store_id": str(row.store_id),
                    "shelf_id": str(row.shelf_id),
                    "camera_id": str(row.camera_id),
                    "final_score": row.final_score,
                    "attention_score": row.attention_score,
                    "mock_metrics": row.mock_metrics,
                    "threshold": SHELF_PERFORMANCE_THRESHOLD,
                },
            ):
                published += 1

    return published



def evaluate_product_visibility() -> int:
    """Publish alerts when real attention/visibility proxy is low.

    This is intentionally shelf-level. The current system does not have
    reliable SKU identity or pickup/comparison CV, so this must not be
    presented as a SKU-level visibility measurement.
    """
    published = 0

    with Session(engine) as session:
        rows = session.exec(
            select(ProductAttractivenessScore).order_by(
                ProductAttractivenessScore.computed_at.desc()
            )
        ).all()

    latest_by_shelf: dict[uuid.UUID, ProductAttractivenessScore] = {}
    for row in rows:
        if row.shelf_id not in latest_by_shelf:
            latest_by_shelf[row.shelf_id] = row

    for row in latest_by_shelf.values():
        if row.attention_score < PRODUCT_VISIBILITY_THRESHOLD:
            if _publish_once(
                "product_visibility",
                str(row.shelf_id),
                {
                    "store_id": str(row.store_id),
                    "shelf_id": str(row.shelf_id),
                    "camera_id": str(row.camera_id),
                    "visibility_proxy": "attention_score",
                    "attention_score": row.attention_score,
                    "threshold": PRODUCT_VISIBILITY_THRESHOLD,
                    "mock_metrics": row.mock_metrics,
                },
            ):
                published += 1

    return published



def evaluate_traffic_anomaly() -> int:
    """Detect unusually high traffic in the latest video-time bucket.

    The existing analytics operate on the most recent tracking run, not a
    live wall-clock stream. Therefore this is a run-relative traffic anomaly,
    not a claim about real-world live occupancy.
    """
    published = 0

    with Session(engine) as session:
        cameras = session.exec(select(Camera)).all()

    for camera in cameras:
        try:
            buckets = compute_traffic_over_time(camera.id)
        except Exception as exc:
            print(
                f"WARNING: traffic anomaly evaluation failed for "
                f"{camera.name} ({camera.id}): {exc}"
            )
            continue

        if len(buckets) < TRAFFIC_MIN_BASELINE_BUCKETS + 1:
            continue

        baseline_values = [
            float(bucket["event_count"])
            for bucket in buckets[:-1]
        ]
        latest_value = float(buckets[-1]["event_count"])
        baseline = mean(baseline_values)

        if (
            latest_value >= TRAFFIC_MIN_EVENT_COUNT
            and baseline > 0
            and latest_value >= baseline * TRAFFIC_ANOMALY_MULTIPLIER
        ):
            if _publish_once(
                "traffic_anomaly",
                str(camera.id),
                {
                    "camera_id": str(camera.id),
                    "camera_name": camera.name,
                    "status": "high_traffic",
                    "latest_event_count": int(latest_value),
                    "baseline_event_count": round(baseline, 2),
                    "multiplier": round(latest_value / baseline, 2),
                    "threshold_multiplier": TRAFFIC_ANOMALY_MULTIPLIER,
                    "interpretation": "run-relative tracking-event anomaly",
                },
            ):
                published += 1

    return published



def evaluate_all_alerts() -> dict[str, int]:
    """Run every alert evaluator once and return publish counts."""
    counts = {
        "camera_health": evaluate_camera_health(),
        "shelf_performance": evaluate_shelf_performance(),
        "product_visibility": evaluate_product_visibility(),
        "traffic_anomaly": evaluate_traffic_anomaly(),
    }

    total = sum(counts.values())
    if total:
        print(f"Published {total} alert(s): {counts}")
    else:
        print("Alert evaluation complete - no new alerts.")

    return counts
