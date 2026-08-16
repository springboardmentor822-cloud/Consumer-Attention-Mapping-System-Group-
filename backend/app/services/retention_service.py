"""
Data retention for privacy-sensitive tracking data.

TrackingData (raw bounding-box positions) and AttentionEvent (gaze/shelf
attention) are the two tables that most directly encode "where a specific
person was and what they looked at." Storing these indefinitely is a
real privacy liability, not just a theoretical one - GDPR-style storage
limitation principles and various US biometric-privacy statutes expect a
defined retention period, not indefinite retention.

This module deletes rows older than a configurable cutoff. It does NOT
delete ShopperSession, ProductInteraction, ProductAttractivenessScore, or
Report rows, since those are aggregate/business-outcome records (a
purchase count, a computed score) rather than raw positional/biometric
data - the distinction that matters for privacy purposes is "can this be
used to reconstruct where a specific person was and what they looked
at", and only the raw tracking/attention rows can.

Wire this into the scheduler (see core/scheduler.py) to run automatically,
or call `purge_expired_tracking_data()` from a cron job / management
command in a real deployment.
"""
import datetime as dt
import logging

from sqlalchemy.orm import Session

from app.models.attention import AttentionEvent
from app.models.tracking import TrackingData

logger = logging.getLogger("retention_service")

DEFAULT_RETENTION_DAYS = 30


def purge_expired_tracking_data(db: Session, retention_days: int = DEFAULT_RETENTION_DAYS) -> dict:
    """
    Deletes TrackingData and AttentionEvent rows older than
    `retention_days`. Returns a summary dict of how many rows were
    removed from each table, for logging/auditing.
    """
    cutoff = dt.datetime.utcnow() - dt.timedelta(days=retention_days)

    tracking_deleted = (
        db.query(TrackingData).filter(TrackingData.timestamp < cutoff).delete(synchronize_session=False)
    )
    attention_deleted = (
        db.query(AttentionEvent)
        .filter(AttentionEvent.start_time < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()

    summary = {
        "cutoff": cutoff.isoformat(),
        "retention_days": retention_days,
        "tracking_data_deleted": tracking_deleted,
        "attention_events_deleted": attention_deleted,
    }
    if tracking_deleted or attention_deleted:
        logger.info(
            "Retention purge: deleted %d tracking_data row(s) and %d attention_event row(s) older than %s",
            tracking_deleted,
            attention_deleted,
            cutoff.isoformat(),
        )
    return summary
