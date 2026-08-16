"""
A minimal in-process scheduler for periodic background jobs: the
notification checks in notification_service.py (every 60s) and the data
retention purge in retention_service.py (once per day). No external
dependency (Celery/APScheduler) needed for a single-process deployment —
this runs as asyncio background tasks started alongside the FastAPI app.

For a real multi-instance production deployment, replace this with a
proper scheduler (Celery beat, APScheduler with a shared job store, or a
cron-triggered endpoint) so jobs don't run redundantly on every replica —
this implementation is intentionally simple and single-process.
"""
import asyncio
import datetime as dt
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import SessionLocal
from app.models.store import Store
from app.services.notification_service import (
    check_camera_health,
    check_low_product_visibility,
    check_traffic_spike,
)
from app.services.recommendation_service import generate_recommendations_for_store
from app.services.retention_service import purge_expired_tracking_data
from app.services.scoring_service import compute_product_scores

logger = logging.getLogger("scheduler")

NOTIFICATION_CHECK_INTERVAL_SECONDS = 60
RETENTION_PURGE_INTERVAL_SECONDS = 24 * 60 * 60  # once a day
# Milestone 3 spec: "Schedule automated scoring batch tasks every 15-30
# minutes" - scores feed the recommendation engine, so both run together.
SCORING_BATCH_INTERVAL_SECONDS = 30 * 60
SCORING_BATCH_WINDOW_DAYS = 1  # each batch pass scores the trailing 24h


async def run_periodic_checks() -> None:
    """Runs forever, sleeping between passes. Call via
    `asyncio.create_task(run_periodic_checks())` at app startup."""
    while True:
        try:
            _run_all_notification_checks_once()
        except Exception:  # noqa: BLE001
            logger.exception("Periodic notification check failed")
        await asyncio.sleep(NOTIFICATION_CHECK_INTERVAL_SECONDS)


async def run_periodic_retention_purge() -> None:
    """Runs forever, purging expired tracking/attention data once a day."""
    while True:
        try:
            db = SessionLocal()
            try:
                purge_expired_tracking_data(db, retention_days=settings.TRACKING_DATA_RETENTION_DAYS)
            finally:
                db.close()
        except Exception:  # noqa: BLE001
            logger.exception("Periodic retention purge failed")
        await asyncio.sleep(RETENTION_PURGE_INTERVAL_SECONDS)


async def run_periodic_scoring_and_recommendations() -> None:
    """Runs forever: every 30 minutes, recomputes product attractiveness
    scores for the trailing 24h window and regenerates recommendations
    for every store, per the milestone-3 automated batch-processing
    requirement. In a multi-instance deployment this belongs in Celery
    beat instead (see module docstring)."""
    while True:
        try:
            _run_scoring_batch_once()
        except Exception:  # noqa: BLE001
            logger.exception("Periodic scoring/recommendation batch failed")
        await asyncio.sleep(SCORING_BATCH_INTERVAL_SECONDS)


def _run_scoring_batch_once() -> None:
    db: Session = SessionLocal()
    try:
        period_end = dt.datetime.utcnow()
        period_start = period_end - dt.timedelta(days=SCORING_BATCH_WINDOW_DAYS)
        store_ids = [row[0] for row in db.query(Store.id).all()]
        for store_id in store_ids:
            scores = compute_product_scores(db, store_id, period_start, period_end)
            recs = generate_recommendations_for_store(db, store_id)
            logger.info(
                "Store %d: batch-scored %d product(s), generated %d recommendation(s)",
                store_id,
                len(scores),
                len(recs),
            )
    finally:
        db.close()


def _run_all_notification_checks_once() -> None:
    db: Session = SessionLocal()
    try:
        camera_notes = check_camera_health(db)
        if camera_notes:
            logger.info("Camera health check: %d new notification(s)", len(camera_notes))

        store_ids = [row[0] for row in db.query(Store.id).all()]
        for store_id in store_ids:
            low_vis_notes = check_low_product_visibility(db, store_id)
            if low_vis_notes:
                logger.info(
                    "Store %d: %d low-visibility notification(s)", store_id, len(low_vis_notes)
                )
            spike_note = check_traffic_spike(db, store_id)
            if spike_note:
                logger.info("Store %d: traffic spike notification created", store_id)
    finally:
        db.close()
