from datetime import date, datetime, time

from pydantic import BaseModel


class EmployeeBase(BaseModel):
    store_id: int
    full_name: str
    role: str
    phone: str | None = None
    email: str | None = None
    shift_start: time
    shift_end: time
    is_active: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    store_id: int | None = None
    full_name: str | None = None
    role: str | None = None
    phone: str | None = None
    email: str | None = None
    shift_start: time | None = None
    shift_end: time | None = None
    is_active: bool | None = None


class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceRecord(BaseModel):
    employee_id: int
    employee_name: str
    role: str
    date: date
    check_in_time: datetime | None
    check_out_time: datetime | None
    # Automatic-detection counterparts of check_in_time/check_out_time -
    # null until a connected EmployeeIdentifier (or DEMO_ATTENDANCE) has
    # actually recorded a sighting. See app/services/attendance_service.py.
    first_seen: datetime | None = None
    last_seen: datetime | None = None
    is_late: bool = False
    working_duration_seconds: int | None = None
    # "auto" | "demo" | null (manual-only / no data yet) - which mechanism
    # produced first_seen/last_seen, so the UI/an admin can tell a real
    # detection apart from a demo one.
    source: str | None = None
    shift_start: time
    shift_end: time
    status: str


class AttendanceResponse(BaseModel):
    store_id: int
    date: date
    records: list[AttendanceRecord]
    present_count: int
    late_count: int
    absent_count: int


class AttendanceUpdate(BaseModel):
    """Manual correction of an attendance row - e.g. a manager fixing a
    wrong auto-detected time, or backfilling a manual entry. All fields
    optional; only provided fields are changed."""

    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    first_seen: datetime | None = None
    last_seen: datetime | None = None


class AttendanceHistoryRecord(BaseModel):
    id: int
    employee_id: int
    date: date
    check_in_time: datetime | None
    check_out_time: datetime | None
    first_seen: datetime | None
    last_seen: datetime | None
    is_late: bool
    source: str | None
    status: str
    working_duration_seconds: int | None

    model_config = {"from_attributes": True}
