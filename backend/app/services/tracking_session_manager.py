"""
In-process session manager for /api/tracking/start|stop|status.

This project does not have a live camera feed wired up yet (Milestone 1
cameras are metadata records, not live streams), so a "tracking session"
here represents a logical start/stop window during which a
`CustomerTracker` accumulates results (e.g. driven by repeated calls to
/api/video/process, or by a future live-feed worker). State lives in
memory per API process; swap this for Redis if the app is ever run with
multiple workers.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.ai.tracker import CustomerTracker


@dataclass
class TrackingSession:
    session_id: str
    camera_id: int
    zone_id: int | None
    tracker: CustomerTracker
    status: str = "running"
    frames_processed: int = 0
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class TrackingSessionManager:
    """Process-wide singleton registry of active tracking sessions."""

    _sessions: dict[str, TrackingSession] = {}

    @classmethod
    def start(cls, camera_id: int, zone_id: int | None = None) -> TrackingSession:
        session_id = str(uuid.uuid4())
        session = TrackingSession(
            session_id=session_id,
            camera_id=camera_id,
            zone_id=zone_id,
            tracker=CustomerTracker(),
        )
        cls._sessions[session_id] = session
        return session

    @classmethod
    def get(cls, session_id: str) -> TrackingSession | None:
        return cls._sessions.get(session_id)

    @classmethod
    def stop(cls, session_id: str) -> TrackingSession | None:
        session = cls._sessions.get(session_id)
        if session is None:
            return None
        session.status = "stopped"
        return session

    @classmethod
    def record_frame(cls, session_id: str) -> None:
        session = cls._sessions.get(session_id)
        if session is not None:
            session.frames_processed += 1

    @classmethod
    def all_active(cls) -> list[TrackingSession]:
        return [s for s in cls._sessions.values() if s.status == "running"]
