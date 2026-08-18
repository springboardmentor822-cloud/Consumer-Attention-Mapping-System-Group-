"""
Mock metric providers for Interaction Frequency, Pickup Rate, Purchase
Conversion, and Repeat Engagement — none of these have a real detection
source yet (no touch/pickup detection, no POS integration, no shopper
re-ID across sessions).

Values are DETERMINISTIC per shelf (hashed from shelf_id + metric name),
not re-randomized on every call, so the dashboard doesn't visibly jitter
between refreshes and demos look stable. `overrides` lets you hand-set a
specific shelf's mock value if you need a particular shelf to look good
in a demo — pass it explicitly, never silently.

Every MetricResult from this class carries is_mock=True — the scoring
service and API response both surface this per-metric, so nothing here
is presented to a viewer as real without a label.
"""

import hashlib
import uuid

from app.services.metrics.base import MetricProvider, MetricResult


def _deterministic_mock(shelf_id: uuid.UUID, salt: str, low: float, high: float) -> float:
    digest = hashlib.md5(f"{shelf_id}-{salt}".encode()).hexdigest()
    frac = (int(digest, 16) % 10_000) / 10_000
    return round(low + frac * (high - low), 3)


class MockMetricProvider(MetricProvider):
    is_mock = True

    def __init__(
        self,
        name: str,
        low: float = 0.2,
        high: float = 0.8,
        overrides: dict[uuid.UUID, float] | None = None,
    ):
        self.name = name
        self.low = low
        self.high = high
        self.overrides = overrides or {}

    def get_scores(
        self,
        shelf_ids: list[uuid.UUID],
        camera_id: uuid.UUID,
        store_id: uuid.UUID,
    ) -> dict[uuid.UUID, MetricResult]:
        results = {}
        for shelf_id in shelf_ids:
            value = self.overrides.get(shelf_id) or _deterministic_mock(
                shelf_id, self.name, self.low, self.high
            )
            results[shelf_id] = MetricResult(value=value, is_mock=True, source="mock")
        return results
