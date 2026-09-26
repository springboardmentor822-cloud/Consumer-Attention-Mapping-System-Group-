from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from database import Base


class StoreZoneDB(Base):
    __tablename__ = "store_layout_zones"

    id = Column(String, primary_key=True, index=True)
    label = Column(String)
    x = Column(Float)
    y = Column(Float)
    w = Column(Float)
    h = Column(Float)
    category = Column(String)
    camera_assigned = Column(Integer)

class ProductAttractiveness(Base):
    __tablename__ = "product_attractiveness_scores"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, index=True)
    category = Column(String)
    attention_duration = Column(Float)      # Metric A
    interaction_frequency = Column(Float)   # Metric I
    pickup_rate = Column(Float)             # Metric P
    purchase_conversion = Column(Float)     # Metric C
    repeat_engagement = Column(Float)       # Metric R
    final_score = Column(Float)             # Weighted 0-100 Score
    updated_at = Column(DateTime, default=datetime.utcnow)

class ShopperSession(Base):
    __tablename__ = "shopper_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    total_path_distance = Column(Float)
    zone_dwell_time = Column(Float)
    movement_velocity = Column(Float)
    assigned_segment = Column(String)  # Explorers, Quick Buyers, Comparison Shoppers, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "diagnostic_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    priority = Column(String)
    sku = Column(String)
    action = Column(String)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ShopperProfile(Base):
    """Long-term record of each cross-camera global shopper identity, written
    by main.py's background_reid_processor() the first time a new global_id
    is minted. feature_vector_json stores the Re-ID embedding (from
    deep_reid.py — OSNet/MobileNet/HSV-histogram, whichever tier was active)
    as a JSON-encoded list, since a raw numpy array isn't a SQL column type."""
    __tablename__ = "shopper_profiles"

    id = Column(Integer, primary_key=True, index=True)
    global_id = Column(Integer, unique=True, index=True)
    feature_vector_json = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class SystemSettings(Base):
    """
    Single-row config table (id is always 1) backing the System Settings
    screen. Previously every field on that screen was a client-only
    <input defaultValue=...> with no persistence at all — clicking "Save
    Changes" just showed an alert saying so. Only fields that are BOTH
    saved here AND actually read/applied elsewhere in the app are exposed
    on the settings endpoint — detection_confidence_threshold is read live
    by stream_camera_frames()'s YOLO call; store_id is used to label
    exports/reports. data_retention_days is persisted but not yet enforced
    by any purge job — the settings endpoint says so explicitly rather than
    implying it does something it doesn't.
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, default=1)
    store_id = Column(String, default="STR-001-ALPHA")
    data_retention_days = Column(Integer, default=90)
    detection_confidence_threshold = Column(Float, default=0.25)
    # Real Slack Incoming Webhook URL, user-supplied — see
    # send_slack_notification() in main.py. Not a hardcoded secret; stored
    # here (not an env var) because it's meant to be settable from the
    # Notifications screen without a backend restart, same as
    # detection_confidence_threshold above.
    slack_webhook_url = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class AuditLogEntry(Base):
    """
    Real, persisted audit trail — previously the Logs tab showed 4
    hardcoded sample rows with no backing table at all. Written by
    write_audit_log() (main.py) from real events: login success/failure,
    signup, layout publish, settings changes, manual score recalculation,
    and backup/restore actions.
    """
    __tablename__ = "audit_log_entries"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    level = Column(String)       # INFO / WARN / ERROR
    source = Column(String)      # user email, or a system component name
    event_type = Column(String)  # e.g. "auth", "layout", "settings", "backup"
    message = Column(String)
    ip_address = Column(String, nullable=True)


class BackupRecord(Base):
    """Metadata for each real SQLite backup file written to the backups/
    folder by POST /api/v1/admin/backup — the file itself lives on disk,
    this row just makes it listable/orderable without a directory scan on
    every request."""
    __tablename__ = "backup_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True)
    size_bytes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=True)


class FailedLoginRecord(Base):
    """
    Real per-IP failed-login tracking backing the Security Monitoring tab —
    previously that screen was 100% placeholder with an explicit banner
    saying no such tracking existed. See check_and_record_failed_login() /
    FAILED_LOGIN_THRESHOLD / FAILED_LOGIN_WINDOW_MINUTES in main.py for the
    actual blocking logic; this table is the persisted log of every failure,
    not the in-memory block-state itself (that's process-local by design —
    a restart clearing active blocks is an acceptable, honestly-documented
    tradeoff for a single-process deployment like this one).
    """
    __tablename__ = "failed_login_records"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, index=True)
    email_attempted = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

