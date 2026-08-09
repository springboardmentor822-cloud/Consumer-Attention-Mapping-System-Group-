"""
One-time startup reconciliation: backfills Camera.last_processed_video_filename
for cameras that were genuinely processed before this column existed, so
they come back as LIVE immediately after this upgrade instead of needing a
manual reprocess.

Only touches a camera when there's real evidence it was already processed
(an annotated output file exists for it) AND a real video file on disk
plausibly matches it by name - never invents an association. Runs once at
app startup; a camera it can't confidently match just stays REPLAY/offline
until reprocessed, which is the honest fallback.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.ai.inference import latest_video_url
from app.models.camera import Camera
from app.services.video_service import SUPPORTED_VIDEO_EXTENSIONS, UPLOAD_DIR

logger = logging.getLogger(__name__)


def _best_matching_video_filename(camera_name: str) -> str | None:
    """A video file whose stem (case-insensitive) is a substring of the
    camera's name - handles both an exact match ("Beverage Section" ->
    "Beverage Section.mp4") and a real-world naming mismatch ("Exit Camera"
    -> "Exit.mp4"). Picks the longest matching stem so a more specific name
    wins over a shorter, coincidentally-matching one."""
    if not UPLOAD_DIR.exists():
        return None
    name_lower = camera_name.strip().lower()
    best: tuple[int, str] | None = None
    for path in UPLOAD_DIR.iterdir():
        if path.suffix.lower() not in SUPPORTED_VIDEO_EXTENSIONS:
            continue
        stem_lower = path.stem.strip().lower()
        if stem_lower and stem_lower in name_lower:
            if best is None or len(stem_lower) > best[0]:
                best = (len(stem_lower), path.name)
    return best[1] if best else None


def backfill_camera_video_registrations(db: Session) -> int:
    cameras = db.query(Camera).filter(Camera.last_processed_video_filename.is_(None)).all()
    backfilled = 0
    for camera in cameras:
        if latest_video_url(camera.id) is None:
            continue  # never actually processed - nothing to backfill
        match = _best_matching_video_filename(camera.camera_name)
        if match is None:
            continue
        camera.last_processed_video_filename = match
        backfilled += 1
        logger.info("Backfilled live source for camera_id=%s (%s) -> %s", camera.id, camera.camera_name, match)

    if backfilled:
        db.commit()
    return backfilled
