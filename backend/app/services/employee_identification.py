"""
Employee Identification - deliberately separate from person detection.

The existing YOLO pipeline (app/ai/detector.py's detect_people +
app/ai/tracker.py's CustomerTracker/ByteTrack) detects and tracks the
generic COCO "person" class. It has no facial recognition, no person
re-identification embeddings, and no badge/ID-badge reading - a ByteTrack
track_id is only stable within one continuous camera run, never across
cameras, restarts, or days, and carries no identity information at all.
So "a person was detected" and "this specific employee was detected" are
two genuinely different claims. This module exists to keep that boundary
explicit instead of quietly pretending person detection can identify who
someone is.

EmployeeIdentifier is the pluggable interface every identification method
implements. get_identifier() returns:
- NullEmployeeIdentifier (default, production-safe): always returns None,
  i.e. "no real identification mechanism is connected yet" - the honest
  behavior, not a guess. Automatic attendance simply never fires; person
  counting/tracking elsewhere in the app is completely unaffected.
- DemoEmployeeIdentifier, only when settings.DEMO_ATTENDANCE is true: lets
  the attendance pipeline (get-or-create today's row, first/last seen,
  late detection, dashboard counters, live UI updates) be exercised
  end-to-end without a real face-recognition/badge system connected. See
  its own docstring for exactly what it does and does not simulate.

To connect a real identification system later (face recognition, badge
scan, BLE/RFID presence, etc.), implement `identify()` against this same
interface and return that instance from get_identifier() - nothing in the
attendance service or the camera worker needs to change.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.employee import Employee


class EmployeeIdentifier(ABC):
    @abstractmethod
    def identify(self, db: Session, store_id: int, camera_id: int, track_id: int) -> int | None:
        """Return the employee_id this tracked person corresponds to, or
        None if it can't be (or isn't) identified as a registered employee.
        Must never raise for "no match" - only for a genuine failure."""
        raise NotImplementedError


class NullEmployeeIdentifier(EmployeeIdentifier):
    """No employee-identification mechanism is connected. Always returns
    None. This is the default and the only mode that's honest to run in
    production until a real identification system exists."""

    def identify(self, db: Session, store_id: int, camera_id: int, track_id: int) -> int | None:
        return None


class DemoEmployeeIdentifier(EmployeeIdentifier):
    """DEMO_ATTENDANCE=true only - never used unless explicitly enabled.

    Deterministically maps each (camera_id, track_id) pair to one of the
    store's real registered, active employees, for as long as that track
    exists, so repeated ticks keep "recognizing" the same simulated
    employee rather than flickering between people. This is NOT a real
    identification mechanism: it never looks at pixels, faces, or badges -
    it only assigns a tracked person to an employee row by a stable hash of
    the track id, purely so the rest of the automatic-attendance pipeline
    (first/last seen, late detection, duplicate prevention, live dashboard
    counters) can be demonstrated end-to-end before a real system exists.
    """

    def __init__(self) -> None:
        self._assignments: dict[tuple[int, int], int] = {}

    def identify(self, db: Session, store_id: int, camera_id: int, track_id: int) -> int | None:
        key = (camera_id, track_id)
        cached = self._assignments.get(key)
        if cached is not None:
            return cached

        employees = (
            db.query(Employee.id)
            .filter(Employee.store_id == store_id, Employee.is_active.is_(True))
            .order_by(Employee.id)
            .all()
        )
        if not employees:
            return None

        chosen_id = employees[track_id % len(employees)][0]
        self._assignments[key] = chosen_id
        return chosen_id


_identifier: EmployeeIdentifier | None = None


def get_identifier() -> EmployeeIdentifier:
    """Lazily builds the single process-wide identifier, chosen by
    settings.DEMO_ATTENDANCE at first use (not at import time, so tests/
    tooling that construct Settings differently still get the right one)."""
    global _identifier
    if _identifier is None:
        _identifier = DemoEmployeeIdentifier() if settings.DEMO_ATTENDANCE else NullEmployeeIdentifier()
    return _identifier
