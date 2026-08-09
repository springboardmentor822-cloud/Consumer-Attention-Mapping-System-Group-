"""
Persistence + orchestration layer for automatic alert generation.

record_alert_if_new is dedup-aware: without it, reprocessing the same clip
(a normal occurrence in this project, videos get reprocessed often during
testing) would insert a fresh duplicate alert every single run. An
auto-generated alert type only creates a new row if there's no existing
*unresolved* alert for the same (store, type, camera, zone) - once a
manager resolves it, the same condition on a later run is free to raise a
new one.

generate_alerts_for_video_processing is the entry point called from
app/api/routers/video.py via FastAPI BackgroundTasks, so it runs after the
video-processing HTTP response has already been sent and can never slow
that response down. It opens its own DB session (the request's session is
gone by the time a background task runs) and never lets an exception
escape - a failure here is logged and swallowed, not raised, so a bug in
alert generation can never break video processing.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.camera import Camera
from app.models.zone import Zone
from app.services import alert_rules
from app.services.audit import record_audit_event
from app.services.tracking_repository import TrackingRepository

logger = logging.getLogger("cams.alerts")

# Same defaults already used by the Store Manager dashboard's live-computed
# alerts (app/api/routers/store_manager.py) - imported there too so both
# stay in sync rather than drifting apart as two separately-tuned numbers.
OCCUPANCY_ALERT_THRESHOLD = 40
QUEUE_BUSY_THRESHOLD = 5
LIVE_WINDOW_SECONDS = 5 * 60


def record_alert_if_new(db: Session, store_id: int, draft: alert_rules.AlertDraft) -> Alert | None:
    existing = (
        db.query(Alert)
        .filter(
            Alert.store_id == store_id,
            Alert.alert_type == draft.alert_type,
            Alert.camera_id == draft.camera_id,
            Alert.zone_id == draft.zone_id,
            Alert.is_resolved.is_(False),
        )
        .first()
    )
    if existing is not None:
        logger.info(
            "Alert suppressed (duplicate of open alert #%s): type=%s camera_id=%s zone_id=%s",
            existing.id, draft.alert_type, draft.camera_id, draft.zone_id,
        )
        return None

    alert = Alert(
        store_id=store_id,
        camera_id=draft.camera_id,
        zone_id=draft.zone_id,
        alert_type=draft.alert_type,
        severity=draft.severity,
        message=draft.message,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    logger.info(
        "Alert generated + saved: id=%s type=%s severity=%s camera_id=%s zone_id=%s message=%r",
        alert.id, alert.alert_type, alert.severity, alert.camera_id, alert.zone_id, alert.message,
    )
    record_audit_event(
        db, action="alert_auto_generated", message=alert.message,
        resource="alert", resource_id=alert.id, severity=alert.severity,
    )
    return alert


def generate_alerts_for_video_processing(
    store_id: int,
    camera_id: int,
    zone_id: int | None,
    coordinates: list[dict],
) -> None:
    frame_numbers = [r["frame"] for r in coordinates if "frame" in r]
    logger.info(
        "Alert generation started: camera_id=%s zone_id=%s frames=%s..%s detections=%d",
        camera_id, zone_id,
        min(frame_numbers) if frame_numbers else "-",
        max(frame_numbers) if frame_numbers else "-",
        len(coordinates),
    )

    db = SessionLocal()
    try:
        camera = db.get(Camera, camera_id)
        zone = db.get(Zone, zone_id) if zone_id is not None else None
        camera_name = camera.camera_name if camera else f"Camera {camera_id}"
        zone_name = zone.zone_name if zone else f"Zone {zone_id}"
        distinct_customers = len({r["customer_id"] for r in coordinates if "customer_id" in r})

        drafts: list[alert_rules.AlertDraft] = []

        repo = TrackingRepository(db)
        occupancy = repo.unique_customers_for_cameras([camera_id])
        occ_draft = alert_rules.check_occupancy(camera_id, camera_name, occupancy, OCCUPANCY_ALERT_THRESHOLD)
        if occ_draft:
            drafts.append(occ_draft)

        if zone is not None and "checkout" in zone.zone_name.lower():
            queue_draft = alert_rules.check_queue(zone.id, zone.zone_name, distinct_customers, QUEUE_BUSY_THRESHOLD)
            if queue_draft:
                drafts.append(queue_draft)

        if zone is not None:
            restricted_draft = alert_rules.check_restricted_zone_entry(
                camera_id, zone.id, zone.zone_name, zone.is_restricted, distinct_customers
            )
            if restricted_draft:
                drafts.append(restricted_draft)

            loitering_draft = alert_rules.check_loitering(coordinates, camera_id, zone.id, zone.zone_name)
            if loitering_draft:
                drafts.append(loitering_draft)

        for draft in drafts:
            record_alert_if_new(db, store_id, draft)

        logger.info("Alert generation finished: camera_id=%s zone_id=%s alerts_evaluated=%d", camera_id, zone_id, len(drafts))
    except Exception:
        logger.exception("Alert generation failed for camera_id=%s zone_id=%s - video processing already completed and is unaffected", camera_id, zone_id)
    finally:
        db.close()
