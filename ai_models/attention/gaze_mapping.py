"""
Turns head pose (yaw) + a person's floor position into "which shelf are
they most likely looking at, if any" — and tracks sustained attention
over multiple frames so brief head turns don't register as a real
attention event (matching the spec's "Attention Duration" / "Dwell
Time" / "Repeat Attention" requirements).

Coordinate convention: all angles are in the store's floor-plane
coordinate system (0 degrees = facing along +x, increasing counter-
clockwise toward +y) - the same system Camera/Shelf floor coordinates
use. A camera's raw head-pose yaw is relative to *that camera's* optical
axis, not the store's coordinate system, so it has to be combined with
the camera's own known mounting angle (see `yaw_to_facing_angle`) before
it's comparable to shelf positions.

This is deliberately conservative about what it claims: gaze-to-shelf
mapping from head pose alone is an approximation (it's really "which way
is this person's head pointed", not true eye-tracking). It's a
reasonable, industry-standard proxy - full eye-gaze estimation needs a
much closer camera than a typical overhead store camera provides.
"""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class ShelfTarget:
    shelf_id: int
    floor_x: float
    floor_y: float


@dataclass
class GazeEstimate:
    shelf_id: int
    angle_deviation_degrees: float
    distance_m: float


def yaw_to_facing_angle(head_yaw_degrees: float, camera_mount_angle_degrees: float) -> float:
    """
    Combines a camera-relative head yaw with the camera's own mounting
    angle (its optical axis direction in the store's floor coordinate
    system) to get an absolute facing direction. Both angles use the
    same convention (degrees, counter-clockwise from +x).
    """
    return (head_yaw_degrees + camera_mount_angle_degrees) % 360


def _angle_to_point(from_x: float, from_y: float, to_x: float, to_y: float) -> float:
    return math.degrees(math.atan2(to_y - from_y, to_x - from_x)) % 360


def _angle_diff(a: float, b: float) -> float:
    """Smallest difference between two angles, in [0, 180]."""
    diff = abs(a - b) % 360
    return min(diff, 360 - diff)


def estimate_gaze_target(
    person_floor_x: float,
    person_floor_y: float,
    facing_angle_degrees: float,
    candidate_shelves: list[ShelfTarget],
    max_angle_deviation: float = 30.0,
    max_distance_m: float = 6.0,
) -> GazeEstimate | None:
    """
    Returns the shelf the person is most likely looking at (smallest
    angular deviation between their facing direction and the direction
    to the shelf, among shelves within range), or None if nothing
    qualifies.
    """
    best: GazeEstimate | None = None
    for shelf in candidate_shelves:
        distance = math.hypot(shelf.floor_x - person_floor_x, shelf.floor_y - person_floor_y)
        if distance > max_distance_m or distance == 0:
            continue

        angle_to_shelf = _angle_to_point(person_floor_x, person_floor_y, shelf.floor_x, shelf.floor_y)
        deviation = _angle_diff(facing_angle_degrees, angle_to_shelf)
        if deviation > max_angle_deviation:
            continue

        if best is None or deviation < best.angle_deviation_degrees:
            best = GazeEstimate(shelf_id=shelf.shelf_id, angle_deviation_degrees=deviation, distance_m=distance)

    return best


@dataclass
class _ActiveAttention:
    shelf_id: int
    start_timestamp: float
    last_timestamp: float
    look_count: int = 1  # how many separate times this session has looked at this shelf


@dataclass
class AttentionEmit:
    shelf_id: int
    start_timestamp: float
    end_timestamp: float
    duration_seconds: float
    is_repeat: bool


class SustainedAttentionTracker:
    """
    Per-session state machine: only emits an AttentionEvent once a gaze
    target has been held continuously for `min_duration_seconds`, and
    merges brief target loss (<= `gap_tolerance_seconds`, e.g. a single
    dropped frame) rather than splitting it into two events. Also counts
    "repeat attention" - how many separate times in this session the
    person has looked back at the same shelf.
    """

    def __init__(self, min_duration_seconds: float = 1.0, gap_tolerance_seconds: float = 1.5):
        self.min_duration_seconds = min_duration_seconds
        self.gap_tolerance_seconds = gap_tolerance_seconds
        self._active: dict[str, _ActiveAttention] = {}  # keyed by session_id
        self._shelf_visit_counts: dict[str, dict[int, int]] = {}

    def update(
        self, session_key: str, timestamp: float, gaze: GazeEstimate | None
    ) -> AttentionEmit | None:
        active = self._active.get(session_key)
        emitted: AttentionEmit | None = None

        if gaze is None:
            if active is not None and timestamp - active.last_timestamp > self.gap_tolerance_seconds:
                emitted = self._finalize(active)
                self._active.pop(session_key, None)
            return emitted

        if active is None or active.shelf_id != gaze.shelf_id:
            if active is not None:
                gap = timestamp - active.last_timestamp
                if gap <= self.gap_tolerance_seconds and active.shelf_id == gaze.shelf_id:
                    active.last_timestamp = timestamp
                    return None
                emitted = self._finalize(active)
            visits = self._shelf_visit_counts.setdefault(session_key, {})
            visits[gaze.shelf_id] = visits.get(gaze.shelf_id, 0) + 1
            self._active[session_key] = _ActiveAttention(
                shelf_id=gaze.shelf_id,
                start_timestamp=timestamp,
                last_timestamp=timestamp,
                look_count=visits[gaze.shelf_id],
            )
            return emitted

        active.last_timestamp = timestamp
        return None

    def _finalize(self, active: _ActiveAttention) -> AttentionEmit | None:
        duration = active.last_timestamp - active.start_timestamp
        if duration < self.min_duration_seconds:
            return None
        return AttentionEmit(
            shelf_id=active.shelf_id,
            start_timestamp=active.start_timestamp,
            end_timestamp=active.last_timestamp,
            duration_seconds=duration,
            is_repeat=active.look_count > 1,
        )

    def flush(self, session_key: str) -> AttentionEmit | None:
        """Call when a session ends, to finalize any still-active attention."""
        active = self._active.pop(session_key, None)
        if active is None:
            return None
        return self._finalize(active)
