"""
Attendance persistence + status derivation, shared by:
- the manual check-in/check-out endpoints (app/api/routers/employees.py)
- the automatic detection-driven path (record_employee_seen, called from
  the live camera worker once an EmployeeIdentifier confirms a match - see
  app/ai/live_stream.py and app/services/employee_identification.py)

Both paths write to the SAME employee_attendance row (one per employee per
day - see the unique constraint on the model) so "Present today" always
reflects one true combined picture, never two disagreeing counts. The
manual path uses check_in_time/check_out_time (a deliberate action); the
automatic path uses first_seen/last_seen (an observed presence window) -
kept as separate columns so a false negative in detection can never
silently overwrite a manager's manual check-in, and vice versa. Status and
duration are derived by preferring whichever pair actually has data.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.models.employee_attendance import EmployeeAttendance

logger = logging.getLogger("cams.attendance")

# Used both to decide Present-vs-Late (a first sighting more than this many
# minutes after shift_start counts as Late) and, in effective_status, how
# long to withhold "Absent" after a shift starts - one constant, not two
# independently-tuned numbers that could silently drift apart.
LATE_GRACE_MINUTES = 15


def today() -> date:
    return datetime.now(timezone.utc).date()


def get_or_create_today_row(db: Session, employee_id: int, for_date: date | None = None) -> EmployeeAttendance:
    """One row per employee per day - this IS the duplicate-prevention
    mechanism (backed by the table's unique constraint). Safe under a rare
    race (two near-simultaneous first sightings from different cameras):
    if the insert loses a unique-constraint race, re-fetch the row the
    other writer just created instead of raising."""
    for_date = for_date or today()
    row = (
        db.query(EmployeeAttendance)
        .filter(EmployeeAttendance.employee_id == employee_id, EmployeeAttendance.date == for_date)
        .first()
    )
    if row is not None:
        return row

    row = EmployeeAttendance(employee_id=employee_id, date=for_date)
    db.add(row)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        row = (
            db.query(EmployeeAttendance)
            .filter(EmployeeAttendance.employee_id == employee_id, EmployeeAttendance.date == for_date)
            .first()
        )
        if row is None:
            raise
    return row


def record_employee_seen(
    db: Session, employee_id: int, seen_at: datetime, source: str = "auto"
) -> EmployeeAttendance | None:
    """Upsert today's attendance row for one confirmed employee sighting.
    Idempotent and safe to call on every detection tick - the unique
    (employee_id, date) constraint plus get-or-create guarantees exactly
    one row per employee per day no matter how many times this runs; every
    call after the first sighting of the day only advances last_seen."""
    employee = db.get(Employee, employee_id)
    if employee is None:
        logger.warning("Attendance: employee_id=%s not found - skipping (stale mapping or deleted employee)", employee_id)
        return None

    row = get_or_create_today_row(db, employee.id, seen_at.date())

    if row.first_seen is None:
        row.first_seen = seen_at
        shift_start_dt = datetime.combine(seen_at.date(), employee.shift_start, tzinfo=timezone.utc)
        row.is_late = seen_at > shift_start_dt + timedelta(minutes=LATE_GRACE_MINUTES)
        row.source = source
        logger.info(
            "Attendance: first sighting today - employee_id=%s name=%r at=%s late=%s source=%s",
            employee.id, employee.full_name, seen_at.isoformat(), row.is_late, source,
        )

    if row.last_seen is None or seen_at > row.last_seen:
        row.last_seen = seen_at

    db.commit()
    db.refresh(row)
    return row


def effective_status(employee: Employee, row: EmployeeAttendance | None, now: datetime, for_date: date) -> str:
    """Present / Late / Pending / Absent, computed identically regardless
    of whether the day's data came from a manual check-in or an automatic
    detection. "Pending" (not "Absent") is returned before an employee's
    shift + grace period has even started - an employee whose shift hasn't
    begun yet isn't absent, just not due in yet."""
    check_in = (row.check_in_time if row else None) or (row.first_seen if row else None)
    shift_start_dt = datetime.combine(for_date, employee.shift_start, tzinfo=timezone.utc)
    cutoff = shift_start_dt + timedelta(minutes=LATE_GRACE_MINUTES)

    if check_in is not None:
        return "Late" if check_in > cutoff else "Present"
    return "Pending" if now < cutoff else "Absent"


def working_duration_seconds(row: EmployeeAttendance | None) -> int | None:
    """Prefers the automatic first_seen/last_seen window; falls back to the
    manual check_in_time/check_out_time pair. None means "not enough data
    yet" (e.g. checked in but no check-out/last-seen), not zero."""
    if row is None:
        return None
    start = row.first_seen or row.check_in_time
    end = row.last_seen or row.check_out_time
    if start is None or end is None or end < start:
        return None
    return int((end - start).total_seconds())
