from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class EmployeeAttendance(Base):
    """One row per employee per day (enforced by the unique constraint below
    - this is what "duplicate prevention" is: a repeated detection or
    check-in for the same employee/day always UPDATEs this same row, never
    inserts a second one). Status (Present/Late/Pending/Absent) is derived
    at read time (see app.services.attendance_service.effective_status) from
    these timestamps vs. the employee's scheduled shift_start, not stored -
    avoids a stored value silently drifting out of sync with the actual
    times.

    Two independent pairs of timestamps, deliberately not merged:
    - check_in_time/check_out_time: set only by a deliberate manual action
      (the Check-in/Check-out buttons in Employee Monitoring, or a manager
      calling the API directly).
    - first_seen/last_seen: set only by the automatic camera-detection path
      (see app.services.employee_identification + attendance_service), first
      time an EmployeeIdentifier confirms a match today, and refreshed on
      every subsequent confirmed sighting.
    Keeping them separate means a false negative in detection can never
    silently erase a manager's manual check-in, and vice versa - status/
    duration derivation reads whichever pair actually has data.
    """

    __tablename__ = "employee_attendance"
    __table_args__ = (UniqueConstraint("employee_id", "date", name="uq_employee_attendance_employee_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), index=True, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_in_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_late: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Where first_seen/last_seen came from: "auto" (a real connected
    # EmployeeIdentifier), "demo" (DEMO_ATTENDANCE=true simulation), or null
    # for rows that only ever got a manual check-in. Lets the UI/an admin
    # tell a genuine detection apart from a demo one instead of the two
    # looking identical - see the "don't falsely claim" requirement this
    # column exists to satisfy.
    source: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="attendance")
