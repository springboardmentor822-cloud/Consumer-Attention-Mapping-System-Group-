from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import dashboard_access, resolve_store_scope, write_access
from app.db.session import get_db
from app.models.employee import Employee
from app.models.employee_attendance import EmployeeAttendance
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import Message
from app.schemas.employee import (
    AttendanceHistoryRecord,
    AttendanceRecord,
    AttendanceResponse,
    AttendanceUpdate,
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
)
from app.services import attendance_service
from app.services.crud import CRUDService

router = APIRouter(prefix="/employees", tags=["Employee Monitoring"])
service = CRUDService[Employee, EmployeeCreate, EmployeeUpdate](Employee, "Employee")


def _require_same_store(current_user: User, employee: Employee) -> None:
    """A Store Manager may only see/edit their own store's employees.
    resolve_store_scope() only tells you what store a QUERY should be
    scoped to for the caller's role - it can't validate a specific
    already-known employee, so that check is inline here instead."""
    if current_user.role == UserRole.store_manager.value and current_user.store_id != employee.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employee does not belong to your store")


@router.get("", response_model=list[EmployeeResponse])
def list_employees(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    query = db.query(Employee)
    if effective_store_id is not None:
        query = query.filter(Employee.store_id == effective_store_id)
    return query.order_by(Employee.full_name.asc()).all()


@router.post("", response_model=EmployeeResponse)
def create_employee(payload: EmployeeCreate, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    # Two employees at the same store with the exact same name is almost
    # certainly a duplicate submission (e.g. a double form-click), not two
    # different people - reject it rather than silently creating a second
    # row that would then also collect its own separate attendance.
    duplicate = (
        db.query(Employee)
        .filter(Employee.store_id == payload.store_id, Employee.full_name.ilike(payload.full_name.strip()))
        .first()
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An employee named {payload.full_name!r} already exists at this store",
        )
    return service.create(db, payload, actor=current_user)


@router.put("/{item_id}", response_model=EmployeeResponse)
def update_employee(
    item_id: int, payload: EmployeeUpdate, current_user: User = Depends(write_access), db: Session = Depends(get_db)
):
    return service.update(db, item_id, payload, actor=current_user)


@router.delete("/{item_id}", response_model=Message)
def delete_employee(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    return service.delete(db, item_id, actor=current_user)


@router.post("/{item_id}/check-in", response_model=Message)
def check_in(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    employee = service.get_or_404(db, item_id)
    row = attendance_service.get_or_create_today_row(db, employee.id)
    if row.check_in_time is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{employee.full_name} already checked in today")
    row.check_in_time = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"{employee.full_name} checked in"}


@router.post("/{item_id}/check-out", response_model=Message)
def check_out(item_id: int, current_user: User = Depends(write_access), db: Session = Depends(get_db)):
    employee = service.get_or_404(db, item_id)
    row = attendance_service.get_or_create_today_row(db, employee.id)
    if row.check_in_time is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{employee.full_name} hasn't checked in today")
    if row.check_out_time is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{employee.full_name} already checked out today")
    row.check_out_time = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"{employee.full_name} checked out"}


def _build_attendance_response(db: Session, effective_store_id: int, for_date: date) -> AttendanceResponse:
    employees = db.query(Employee).filter(Employee.store_id == effective_store_id, Employee.is_active.is_(True)).all()
    rows_by_employee = {
        row.employee_id: row
        for row in db.query(EmployeeAttendance).filter(
            EmployeeAttendance.employee_id.in_([e.id for e in employees]), EmployeeAttendance.date == for_date
        )
    }

    now = datetime.now(timezone.utc)
    records: list[AttendanceRecord] = []
    present = late = absent = 0
    for employee in employees:
        row = rows_by_employee.get(employee.id)
        employee_status = attendance_service.effective_status(employee, row, now, for_date)
        if employee_status == "Present":
            present += 1
        elif employee_status == "Late":
            late += 1
        elif employee_status == "Absent":
            absent += 1
        # "Pending" (shift hasn't started + grace period yet) isn't counted
        # in any of the three KPI cards - see effective_status's docstring
        # for why marking someone absent before they're even due in would
        # be dishonest, not just early.

        records.append(
            AttendanceRecord(
                employee_id=employee.id,
                employee_name=employee.full_name,
                role=employee.role,
                date=for_date,
                check_in_time=row.check_in_time if row else None,
                check_out_time=row.check_out_time if row else None,
                first_seen=row.first_seen if row else None,
                last_seen=row.last_seen if row else None,
                is_late=row.is_late if row else False,
                working_duration_seconds=attendance_service.working_duration_seconds(row),
                source=row.source if row else None,
                shift_start=employee.shift_start,
                shift_end=employee.shift_end,
                status=employee_status,
            )
        )

    return AttendanceResponse(
        store_id=effective_store_id,
        date=for_date,
        records=sorted(records, key=lambda r: r.employee_name),
        present_count=present,
        late_count=late,
        absent_count=absent,
    )


@router.get("/attendance", response_model=AttendanceResponse)
def attendance(
    store_id: int | None = Query(default=None),
    for_date: date = Query(default_factory=attendance_service.today),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    effective_store_id = resolve_store_scope(current_user, store_id)
    if effective_store_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="store_id is required")
    return _build_attendance_response(db, effective_store_id, for_date)


@router.get("/attendance/today", response_model=AttendanceResponse)
def attendance_today(
    store_id: int | None = Query(default=None),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    """Same as GET /employees/attendance with no for_date - kept as its own
    named route to match the convention requested for this feature."""
    effective_store_id = resolve_store_scope(current_user, store_id)
    if effective_store_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="store_id is required")
    return _build_attendance_response(db, effective_store_id, attendance_service.today())


@router.get("/{employee_id}/attendance", response_model=list[AttendanceHistoryRecord])
def employee_attendance_history(
    employee_id: int,
    days: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(dashboard_access),
    db: Session = Depends(get_db),
):
    employee = service.get_or_404(db, employee_id)
    _require_same_store(current_user, employee)
    now = datetime.now(timezone.utc)
    rows = (
        db.query(EmployeeAttendance)
        .filter(EmployeeAttendance.employee_id == employee_id)
        .order_by(EmployeeAttendance.date.desc())
        .limit(days)
        .all()
    )
    return [
        AttendanceHistoryRecord(
            id=row.id,
            employee_id=row.employee_id,
            date=row.date,
            check_in_time=row.check_in_time,
            check_out_time=row.check_out_time,
            first_seen=row.first_seen,
            last_seen=row.last_seen,
            is_late=row.is_late,
            source=row.source,
            status=attendance_service.effective_status(employee, row, now, row.date),
            working_duration_seconds=attendance_service.working_duration_seconds(row),
        )
        for row in rows
    ]


@router.patch("/attendance/{attendance_id}", response_model=AttendanceHistoryRecord)
def update_attendance_record(
    attendance_id: int,
    payload: AttendanceUpdate,
    current_user: User = Depends(write_access),
    db: Session = Depends(get_db),
):
    """Manual correction of an attendance row (e.g. fixing a wrong
    auto-detected time). Scoped to the caller's store the same way every
    other write endpoint is."""
    row = db.get(EmployeeAttendance, attendance_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    employee = db.get(Employee, row.employee_id)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee for this attendance record no longer exists")
    _require_same_store(current_user, employee)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)

    now = datetime.now(timezone.utc)
    return AttendanceHistoryRecord(
        id=row.id,
        employee_id=row.employee_id,
        date=row.date,
        check_in_time=row.check_in_time,
        check_out_time=row.check_out_time,
        first_seen=row.first_seen,
        last_seen=row.last_seen,
        is_late=row.is_late,
        source=row.source,
        status=attendance_service.effective_status(employee, row, now, row.date),
        working_duration_seconds=attendance_service.working_duration_seconds(row),
    )
