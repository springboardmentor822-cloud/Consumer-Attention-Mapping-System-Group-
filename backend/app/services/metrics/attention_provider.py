"""
Real attention/dwell-time metric provider. Wraps compute_dwell_time.py's
compute_dwell_time_data() rather than re-implementing the run-isolation
/ x-range logic a second time.

Normalization: dwell time is normalized RELATIVE to the busiest shelf on
this camera in this run (max_seconds -> 1.0, 0 seconds -> 0.0), not
against a fixed absolute threshold. This means a score of 1.0 means
"most-attended shelf on this camera right now," not "objectively high
attention" — reasonable for a demo with limited real traffic, but revisit
if you ever want cross-camera or cross-time comparability.
"""

import uuid

from app.services.compute_dwell_time import compute_dwell_time_data, DwellTimeUnavailable
from app.services.metrics.base import MetricProvider, MetricResult


class RealAttentionProvider(MetricProvider):
    name = "attention"
    is_mock = False

    def get_scores(
        self,
        shelf_ids: list[uuid.UUID],
        camera_id: uuid.UUID,
        store_id: uuid.UUID,
    ) -> dict[uuid.UUID, MetricResult]:
        try:
            dwell_data = compute_dwell_time_data(camera_id)
        except DwellTimeUnavailable:
            dwell_data = []

        by_shelf = {uuid.UUID(d["shelf_id"]): d["total_seconds"] for d in dwell_data}
        max_seconds = max(by_shelf.values(), default=0.0)

        results = {}
        for shelf_id in shelf_ids:
            seconds = by_shelf.get(shelf_id, 0.0)
            normalized = round(seconds / max_seconds, 3) if max_seconds > 0 else 0.0
            results[shelf_id] = MetricResult(value=normalized, is_mock=False, source="dwell_time")
        return results
