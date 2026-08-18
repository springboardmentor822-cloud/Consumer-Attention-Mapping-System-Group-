"""
Recommendation/scoring scheduler - Milestone 3 Step 3's "Automated Batch
Processing" requirement (Celery or APScheduler, every 15-30 min).

Runs as a fully separate standalone process, same pattern as
app/workers/timescale_writer.py - not a FastAPI in-process background
task. Needs its own terminal window, same as the other workers; add it
to start_pipeline.bat yourself if you want it auto-started (not touched
here - I don't have that file's current content and don't want to
overwrite it blind after the file-drift issues earlier this session).

Each cycle: for every Store -> every Camera with at least one
ShelfCameraView configured, run compute_attractiveness_scores(); then,
once per store (after all its cameras are scored), run
compute_and_persist_recommendations(). Cameras with no ShelfCameraView
rows (e.g. Camera 1, the entrance) are skipped silently - same behavior
as running attractiveness_score.py against them manually.

A failure on one camera/store (e.g. no tracking data yet) is logged and
skipped, not allowed to kill the whole cycle - one bad camera shouldn't
stop every other store's scoring from running.

RETENTION: every cycle also prunes ProductAttractivenessScore and
Recommendation rows older than RETENTION_DAYS. This is TIME-BASED, not
"keep only the latest row" - Milestone_3.pdf's Step 3 endpoint spec
explicitly asks for the attractiveness endpoint to return "historical
trends per product and shelf placement," so pruning down to latest-only
would directly break that stated requirement. 7 days is an assumption,
not a number from the doc - change RETENTION_DAYS if you want more/less
history kept. Without this, both tables grow by one row per shelf/rule
every 15 minutes, forever, with nothing bounding it.

Usage:
    python -m app.workers.recommendation_scheduler
"""

import logging
from datetime import datetime, timedelta, UTC

from apscheduler.schedulers.blocking import BlockingScheduler
from sqlalchemy import delete as sa_delete
from sqlmodel import Session, select

from app.core.db import engine
from app.models.camera import Camera
from app.models.product_attractiveness_score import ProductAttractivenessScore
from app.models.recommendation import Recommendation
from app.models.shelf_camera_view import ShelfCameraView
from app.models.store import Store
from app.services.attractiveness_score import (
    compute_attractiveness_scores,
    AttractivenessScoringUnavailable,
)
from app.services.recommendation_engine import (
    compute_and_persist_recommendations,
    RecommendationEngineUnavailable,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("recommendation_scheduler")

INTERVAL_MINUTES = 15  # per Milestone_3.pdf's "every 15-30 minutes" - using the lower bound
RETENTION_DAYS = 7      # see module docstring - time-based, preserves history for trend queries


def _prune_old_rows():
    cutoff = datetime.now(UTC) - timedelta(days=RETENTION_DAYS)
    with Session(engine) as session:
        score_result = session.execute(
            sa_delete(ProductAttractivenessScore).where(ProductAttractivenessScore.computed_at < cutoff)
        )
        rec_result = session.execute(
            sa_delete(Recommendation).where(Recommendation.computed_at < cutoff)
        )
        session.commit()
    scores_deleted = score_result.rowcount if score_result.rowcount is not None else 0
    recs_deleted = rec_result.rowcount if rec_result.rowcount is not None else 0
    if scores_deleted or recs_deleted:
        logger.info(
            f"Pruned {scores_deleted} attractiveness score row(s) and {recs_deleted} recommendation "
            f"row(s) older than {RETENTION_DAYS} days."
        )


def _cameras_with_shelf_views(store_id, session: Session) -> list:
    camera_ids_with_views = set(
        session.exec(
            select(ShelfCameraView.camera_id)
            .join(Camera, Camera.id == ShelfCameraView.camera_id)
            .where(Camera.store_id == store_id)
        ).all()
    )
    if not camera_ids_with_views:
        return []
    return session.exec(
        select(Camera).where(Camera.id.in_(camera_ids_with_views))
    ).all()


def run_scoring_and_recommendations_cycle():
    logger.info("Starting scoring + recommendations cycle")
    _prune_old_rows()

    with Session(engine) as session:
        stores = session.exec(select(Store)).all()

    for store in stores:
        with Session(engine) as session:
            cameras = _cameras_with_shelf_views(store.id, session)

        if not cameras:
            logger.info(f"Store '{store.name}': no cameras with ShelfCameraView rows, skipping.")
            continue

        scored_any = False
        for camera in cameras:
            try:
                compute_attractiveness_scores(camera.id)
                scored_any = True
                logger.info(f"Store '{store.name}': scored camera '{camera.name}'.")
            except AttractivenessScoringUnavailable as e:
                logger.warning(f"Store '{store.name}', camera '{camera.name}': skipped - {e}")
            except Exception:
                logger.exception(f"Store '{store.name}', camera '{camera.name}': scoring failed unexpectedly.")

        if not scored_any:
            logger.info(f"Store '{store.name}': no cameras scored successfully, skipping recommendations.")
            continue

        try:
            recs = compute_and_persist_recommendations(store.id)
            logger.info(f"Store '{store.name}': {len(recs)} recommendation(s) generated.")
        except RecommendationEngineUnavailable as e:
            logger.warning(f"Store '{store.name}': recommendations skipped - {e}")
        except Exception:
            logger.exception(f"Store '{store.name}': recommendation engine failed unexpectedly.")

    logger.info("Cycle complete.")


def main():
    # Run once immediately on startup, don't wait a full interval for the
    # first data to show up in the DB/dashboard.
    run_scoring_and_recommendations_cycle()

    scheduler = BlockingScheduler()
    scheduler.add_job(
        run_scoring_and_recommendations_cycle,
        "interval",
        minutes=INTERVAL_MINUTES,
        id="scoring_and_recommendations",
    )
    logger.info(f"Scheduler started - running every {INTERVAL_MINUTES} minutes. Ctrl+C to stop.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    main()
