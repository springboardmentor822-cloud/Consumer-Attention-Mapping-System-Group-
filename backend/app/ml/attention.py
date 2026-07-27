"""Head-pose/gaze geometry and a deterministic dwell-event state machine."""

from __future__ import annotations

import math
from dataclasses import dataclass
from enum import Enum

from app.ml.errors import MLConfigurationError

Vector3 = tuple[float, float, float]


def _add(left: Vector3, right: Vector3) -> Vector3:
    return tuple(a + b for a, b in zip(left, right, strict=True))  # type: ignore[return-value]


def _subtract(left: Vector3, right: Vector3) -> Vector3:
    return tuple(a - b for a, b in zip(left, right, strict=True))  # type: ignore[return-value]


def _scale(vector: Vector3, scalar: float) -> Vector3:
    return tuple(value * scalar for value in vector)  # type: ignore[return-value]


def dot(left: Vector3, right: Vector3) -> float:
    return sum(a * b for a, b in zip(left, right, strict=True))


def cross(left: Vector3, right: Vector3) -> Vector3:
    ax, ay, az = left
    bx, by, bz = right
    return ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx


def norm(vector: Vector3) -> float:
    return math.sqrt(dot(vector, vector))


def normalize(vector: Vector3) -> Vector3:
    magnitude = norm(vector)
    if magnitude <= 1e-12:
        raise MLConfigurationError("Cannot normalize a zero-length vector.")
    return _scale(vector, 1.0 / magnitude)


def gaze_vector_from_head_pose(
    yaw: float,
    pitch: float,
    roll: float = 0.0,
    *,
    degrees: bool = True,
    gaze_yaw_offset: float = 0.0,
    gaze_pitch_offset: float = 0.0,
) -> Vector3:
    """Convert pose angles into a unit gaze ray in camera coordinates.

    Convention: +x is camera-right, +y is down, +z is forward; positive yaw
    looks right and positive pitch looks down. Roll does not alter the head's
    forward axis, but is accepted so pose-estimator outputs can be passed intact.
    Eye-gaze offsets can refine the head-pose proxy when an eye model is present.
    """

    del roll
    if degrees:
        yaw = math.radians(yaw + gaze_yaw_offset)
        pitch = math.radians(pitch + gaze_pitch_offset)
    else:
        yaw += gaze_yaw_offset
        pitch += gaze_pitch_offset
    cosine_pitch = math.cos(pitch)
    return normalize(
        (
            math.sin(yaw) * cosine_pitch,
            math.sin(pitch),
            math.cos(yaw) * cosine_pitch,
        )
    )


def ray_plane_intersection(
    ray_origin: Vector3,
    ray_direction: Vector3,
    plane_point: Vector3,
    plane_normal: Vector3,
    *,
    epsilon: float = 1e-9,
) -> tuple[Vector3, float] | None:
    """Return the forward ray/plane hit and distance, or ``None``."""

    direction = normalize(ray_direction)
    normal = normalize(plane_normal)
    denominator = dot(direction, normal)
    if abs(denominator) <= epsilon:
        return None
    distance = dot(_subtract(plane_point, ray_origin), normal) / denominator
    if distance <= epsilon:
        return None
    return _add(ray_origin, _scale(direction, distance)), distance


@dataclass(frozen=True)
class ShelfPlane:
    shelf_id: str
    center: Vector3
    normal: Vector3
    up: Vector3
    width: float
    height: float
    product_id: str | None = None

    def __post_init__(self) -> None:
        if not self.shelf_id:
            raise MLConfigurationError("ShelfPlane requires a shelf_id.")
        if self.width <= 0 or self.height <= 0:
            raise MLConfigurationError("ShelfPlane width and height must be positive.")
        normal = normalize(self.normal)
        projected_up = _subtract(self.up, _scale(normal, dot(self.up, normal)))
        normalize(projected_up)

    def axes(self) -> tuple[Vector3, Vector3, Vector3]:
        normal = normalize(self.normal)
        up = normalize(_subtract(self.up, _scale(normal, dot(self.up, normal))))
        right = normalize(cross(up, normal))
        return right, up, normal


@dataclass(frozen=True)
class GazeHit:
    shelf_id: str
    product_id: str | None
    point: Vector3
    distance: float
    incidence: float
    horizontal_offset: float
    vertical_offset: float


def map_gaze_to_shelf(
    ray_origin: Vector3,
    ray_direction: Vector3,
    shelves: list[ShelfPlane] | tuple[ShelfPlane, ...],
    *,
    margin: float = 0.0,
    max_distance: float | None = None,
) -> GazeHit | None:
    """Intersect a calibrated 3-D gaze ray with shelf rectangles.

    If several planes overlap in the ray direction, the nearest valid hit wins.
    ``margin`` expands each rectangle in the same units as its 3-D dimensions.
    """

    if margin < 0:
        raise MLConfigurationError("Shelf hit margin cannot be negative.")
    if max_distance is not None and max_distance <= 0:
        raise MLConfigurationError("max_distance must be positive when supplied.")
    direction = normalize(ray_direction)
    candidates: list[GazeHit] = []
    for shelf in shelves:
        right, up, normal = shelf.axes()
        intersection = ray_plane_intersection(ray_origin, direction, shelf.center, normal)
        if intersection is None:
            continue
        point, distance = intersection
        if max_distance is not None and distance > max_distance:
            continue
        offset = _subtract(point, shelf.center)
        horizontal = dot(offset, right)
        vertical = dot(offset, up)
        if abs(horizontal) > shelf.width / 2 + margin or abs(vertical) > shelf.height / 2 + margin:
            continue
        candidates.append(
            GazeHit(
                shelf_id=shelf.shelf_id,
                product_id=shelf.product_id,
                point=point,
                distance=distance,
                incidence=abs(dot(direction, normal)),
                horizontal_offset=horizontal,
                vertical_offset=vertical,
            )
        )
    return min(candidates, key=lambda hit: hit.distance) if candidates else None


class DwellEventKind(str, Enum):
    started = "dwell_started"
    ended = "dwell_ended"


@dataclass(frozen=True)
class DwellObservation:
    shopper_id: str
    timestamp: float
    shelf_id: str | None
    confidence: float
    product_id: str | None = None

    def __post_init__(self) -> None:
        if not self.shopper_id:
            raise MLConfigurationError("Dwell observations require a shopper_id.")
        if not math.isfinite(self.timestamp):
            raise MLConfigurationError("Observation timestamps must be finite.")
        if not 0.0 <= self.confidence <= 1.0:
            raise MLConfigurationError("Observation confidence must be in [0, 1].")


@dataclass(frozen=True)
class DwellEvent:
    kind: DwellEventKind
    shopper_id: str
    shelf_id: str
    product_id: str | None
    started_at: float
    ended_at: float | None
    dwell_seconds: float
    average_confidence: float
    sample_count: int


@dataclass
class _DwellState:
    shelf_id: str
    product_id: str | None
    started_at: float
    last_seen_at: float
    confidence_sum: float
    sample_count: int
    active: bool = False

    @property
    def average_confidence(self) -> float:
        return self.confidence_sum / self.sample_count


class DwellEventStateMachine:
    """Turn noisy per-frame gaze hits into non-duplicated dwell transitions."""

    def __init__(
        self,
        *,
        minimum_dwell_seconds: float = 1.5,
        exit_grace_seconds: float = 0.5,
        minimum_confidence: float = 0.5,
    ):
        if minimum_dwell_seconds < 0:
            raise MLConfigurationError("minimum_dwell_seconds cannot be negative.")
        if exit_grace_seconds < 0:
            raise MLConfigurationError("exit_grace_seconds cannot be negative.")
        if not 0 <= minimum_confidence <= 1:
            raise MLConfigurationError("minimum_confidence must be in [0, 1].")
        self.minimum_dwell_seconds = minimum_dwell_seconds
        self.exit_grace_seconds = exit_grace_seconds
        self.minimum_confidence = minimum_confidence
        self._states: dict[str, _DwellState] = {}
        self._latest_timestamps: dict[str, float] = {}

    def update(self, observation: DwellObservation) -> tuple[DwellEvent, ...]:
        self._check_timestamp(observation.shopper_id, observation.timestamp)
        self._latest_timestamps[observation.shopper_id] = observation.timestamp
        state = self._states.get(observation.shopper_id)
        valid_shelf = observation.shelf_id if observation.confidence >= self.minimum_confidence else None
        emitted: list[DwellEvent] = []

        if state is not None and observation.timestamp - state.last_seen_at > self.exit_grace_seconds:
            emitted.extend(self._close(observation.shopper_id))
            state = None

        if valid_shelf is None:
            return tuple(emitted)

        if state is not None and state.shelf_id != valid_shelf:
            emitted.extend(self._close(observation.shopper_id))
            state = None

        if state is None:
            state = _DwellState(
                shelf_id=valid_shelf,
                product_id=observation.product_id,
                started_at=observation.timestamp,
                last_seen_at=observation.timestamp,
                confidence_sum=observation.confidence,
                sample_count=1,
            )
            self._states[observation.shopper_id] = state
        else:
            state.last_seen_at = observation.timestamp
            state.confidence_sum += observation.confidence
            state.sample_count += 1
            if observation.product_id is not None:
                state.product_id = observation.product_id

        duration = state.last_seen_at - state.started_at
        if not state.active and duration >= self.minimum_dwell_seconds:
            state.active = True
            emitted.append(self._event(DwellEventKind.started, observation.shopper_id, state, ended_at=None))
        return tuple(emitted)

    def tick(self, timestamp: float) -> tuple[DwellEvent, ...]:
        """Close active/candidate states whose last hit is beyond the grace window."""

        if not math.isfinite(timestamp):
            raise MLConfigurationError("Tick timestamps must be finite.")
        emitted: list[DwellEvent] = []
        for shopper_id, state in list(self._states.items()):
            latest = self._latest_timestamps.get(shopper_id, state.last_seen_at)
            if timestamp < latest:
                raise MLConfigurationError(
                    f"Tick timestamp {timestamp} precedes the latest observation for {shopper_id}: {latest}."
                )
            if timestamp - state.last_seen_at > self.exit_grace_seconds:
                emitted.extend(self._close(shopper_id))
        return tuple(emitted)

    def flush(self) -> tuple[DwellEvent, ...]:
        """End every qualifying dwell at its final observed gaze hit."""

        emitted: list[DwellEvent] = []
        for shopper_id in list(self._states):
            emitted.extend(self._close(shopper_id))
        return tuple(emitted)

    def snapshot(self) -> dict[str, dict[str, float | str | bool | None]]:
        return {
            shopper_id: {
                "shelf_id": state.shelf_id,
                "product_id": state.product_id,
                "started_at": state.started_at,
                "last_seen_at": state.last_seen_at,
                "dwell_seconds": state.last_seen_at - state.started_at,
                "average_confidence": state.average_confidence,
                "active": state.active,
            }
            for shopper_id, state in self._states.items()
        }

    def _check_timestamp(self, shopper_id: str, timestamp: float) -> None:
        previous = self._latest_timestamps.get(shopper_id)
        if previous is not None and timestamp < previous:
            raise MLConfigurationError(
                f"Out-of-order observation for {shopper_id}: {timestamp} is earlier than {previous}."
            )

    def _close(self, shopper_id: str) -> list[DwellEvent]:
        state = self._states.pop(shopper_id, None)
        if state is None or not state.active:
            return []
        return [self._event(DwellEventKind.ended, shopper_id, state, ended_at=state.last_seen_at)]

    @staticmethod
    def _event(kind: DwellEventKind, shopper_id: str, state: _DwellState, ended_at: float | None) -> DwellEvent:
        return DwellEvent(
            kind=kind,
            shopper_id=shopper_id,
            shelf_id=state.shelf_id,
            product_id=state.product_id,
            started_at=state.started_at,
            ended_at=ended_at,
            dwell_seconds=state.last_seen_at - state.started_at,
            average_confidence=state.average_confidence,
            sample_count=state.sample_count,
        )
