"""
Dwell time: segmenting raw tracking_data into per-visit sessions and
summarizing them. A "visit" is a maximal run of a customer's points that
stays within the same (camera, zone) and never gaps more than
MAX_VISIT_GAP_SECONDS - see metrics.py for why the gap guard exists.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

from app.analytics.metrics import MAX_VISIT_GAP_SECONDS
from app.models.tracking_data import TrackingData


@dataclass
class Visit:
    customer_id: int
    camera_id: int
    zone_id: int | None
    entry_time: datetime
    exit_time: datetime
    duration_seconds: float
    points: list[TrackingData] = field(repr=False)


@dataclass
class Session:
    """One continuous presence of a tracked id, which may span several zones.

    Distinct from Visit on purpose. A Visit is scoped to a single
    (camera, zone) - the right grain for "how long was someone at THIS shelf".
    A Session splits only on a time gap, so a shopper walking
    Entrance -> Grocery -> Snacks is ONE session that visited three zones -
    the right grain for "how long was this person in the store" and "did they
    browse more than one zone".

    Using Visit for the latter is what made the dashboard claim "0% of
    customers visited more than one zone" while the journey-flow panel right
    above it listed dozens of real zone-to-zone transitions.
    """

    customer_id: int
    camera_id: int
    entry_time: datetime
    exit_time: datetime
    duration_seconds: float
    points: list[TrackingData] = field(repr=False)

    @property
    def zones_visited(self) -> int:
        return len({p.zone_id for p in self.points if p.zone_id is not None})


@dataclass
class DwellSummary:
    total_seconds: float
    average_seconds: float
    max_seconds: float
    min_seconds: float
    visit_count: int


def _finalize_visit(points: list[TrackingData]) -> Visit:
    first, last = points[0], points[-1]
    return Visit(
        customer_id=first.customer_id,
        camera_id=first.camera_id,
        zone_id=first.zone_id,
        entry_time=first.timestamp,
        exit_time=last.timestamp,
        duration_seconds=(last.timestamp - first.timestamp).total_seconds(),
        points=points,
    )


def segment_visits(
    customer_points: list[TrackingData], max_gap_seconds: float = MAX_VISIT_GAP_SECONDS
) -> list[Visit]:
    """customer_points must be time-ordered and belong to a single customer_id."""
    if not customer_points:
        return []

    visits: list[Visit] = []
    current = [customer_points[0]]

    for prev, curr in zip(customer_points, customer_points[1:]):
        gap = (curr.timestamp - prev.timestamp).total_seconds()
        same_scope = curr.camera_id == prev.camera_id and curr.zone_id == prev.zone_id
        if same_scope and gap <= max_gap_seconds:
            current.append(curr)
        else:
            visits.append(_finalize_visit(current))
            current = [curr]
    visits.append(_finalize_visit(current))
    return visits


def segment_all_visits(
    rows: list[TrackingData], max_gap_seconds: float = MAX_VISIT_GAP_SECONDS
) -> list[Visit]:
    """rows can span many customers, cameras, and zones - grouped by customer_id
    and time-ordered internally before segmenting each customer independently."""
    by_customer: dict[int, list[TrackingData]] = {}
    for row in rows:
        by_customer.setdefault(row.customer_id, []).append(row)

    all_visits: list[Visit] = []
    for customer_rows in by_customer.values():
        ordered = sorted(customer_rows, key=lambda r: r.timestamp)
        all_visits.extend(segment_visits(ordered, max_gap_seconds))
    return all_visits


def _finalize_session(points: list[TrackingData]) -> Session:
    first, last = points[0], points[-1]
    return Session(
        customer_id=first.customer_id,
        camera_id=first.camera_id,
        entry_time=first.timestamp,
        exit_time=last.timestamp,
        duration_seconds=(last.timestamp - first.timestamp).total_seconds(),
        points=points,
    )


def segment_all_sessions(
    rows: list[TrackingData], max_gap_seconds: float = MAX_VISIT_GAP_SECONDS
) -> list[Session]:
    """Like segment_all_visits, but splits ONLY on a time gap - zone and
    camera changes stay inside the same session. See the Session docstring for
    why both groupings are needed."""
    by_customer: dict[int, list[TrackingData]] = {}
    for row in rows:
        by_customer.setdefault(row.customer_id, []).append(row)

    sessions: list[Session] = []
    for customer_rows in by_customer.values():
        ordered = sorted(customer_rows, key=lambda r: r.timestamp)
        current = [ordered[0]]
        for prev, curr in zip(ordered, ordered[1:]):
            if (curr.timestamp - prev.timestamp).total_seconds() <= max_gap_seconds:
                current.append(curr)
            else:
                sessions.append(_finalize_session(current))
                current = [curr]
        sessions.append(_finalize_session(current))
    return sessions


def summarize_dwell(visits: list[Visit]) -> DwellSummary:
    if not visits:
        return DwellSummary(total_seconds=0.0, average_seconds=0.0, max_seconds=0.0, min_seconds=0.0, visit_count=0)
    durations = [v.duration_seconds for v in visits]
    return DwellSummary(
        total_seconds=round(sum(durations), 1),
        average_seconds=round(sum(durations) / len(durations), 1),
        max_seconds=round(max(durations), 1),
        min_seconds=round(min(durations), 1),
        visit_count=len(visits),
    )


def group_by_zone(visits: list[Visit]) -> dict[int | None, list[Visit]]:
    grouped: dict[int | None, list[Visit]] = {}
    for visit in visits:
        grouped.setdefault(visit.zone_id, []).append(visit)
    return grouped


def group_by_camera(visits: list[Visit]) -> dict[int, list[Visit]]:
    """Shelf-wise dwell time keys off camera_id, since Shelf.zone is a free-text
    label (not a foreign key to Zone) and Shelf.camera_id is the real link -
    same convention already used by the existing shelf-analysis endpoint."""
    grouped: dict[int, list[Visit]] = {}
    for visit in visits:
        grouped.setdefault(visit.camera_id, []).append(visit)
    return grouped
