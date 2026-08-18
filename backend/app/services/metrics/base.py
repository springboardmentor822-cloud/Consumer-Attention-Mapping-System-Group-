"""
MetricProvider interface for attractiveness scoring.

Every input to the Product Attractiveness Score (attention, interaction,
pickup, purchase, repeat) goes through this same interface. Right now
only "attention" has a real implementation (RealAttentionProvider, wraps
compute_dwell_time.py); the other four are MockMetricProvider instances.

This is the modularity boundary: when real pickup/purchase/interaction/
repeat detection exists, write a new class implementing get_scores() with
is_mock=False and swap it into the `providers` dict in
attractiveness_score.py. Nothing in the scoring formula or the DB model
needs to change.
"""

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class MetricResult:
    value: float       # normalized 0.0-1.0
    is_mock: bool       # False only for real, measured data
    source: str          # human-readable origin, e.g. "dwell_time" or "mock"


class MetricProvider(ABC):
    name: str
    is_mock: bool

    @abstractmethod
    def get_scores(
        self,
        shelf_ids: list[uuid.UUID],
        camera_id: uuid.UUID,
        store_id: uuid.UUID,
    ) -> dict[uuid.UUID, MetricResult]:
        """Returns one MetricResult per shelf_id. Must return an entry
        for every shelf_id passed in, even if the value is 0.0 — missing
        entries are a bug, not 'no data'."""
        raise NotImplementedError
