"""
Mock shelf-placement provider — Eye-Level Optimization rule (M3 Step 4)
needs each shelf's vertical position (bottom / mid / eye-level), which
doesn't exist anywhere in the schema yet (no real-world height detection
built). This mocks it the same way mock_providers.py mocks the missing
attractiveness metrics: deterministic per shelf (hashed, not random), so
demo output is stable across refreshes, and clearly labeled is_mock=True
everywhere it's used.

When real shelf-height/placement detection exists (e.g. derived from
camera calibration or a manual store planogram), replace
MockShelfPlacementProvider with a real implementation of the same
get_placement() signature — nothing in recommendation_engine.py needs to
change, same modularity contract as the MetricProvider interface.
"""

import hashlib
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass

PLACEMENTS = ["bottom", "mid", "eye_level"]


@dataclass
class PlacementResult:
    placement: str  # one of PLACEMENTS
    is_mock: bool


class ShelfPlacementProvider(ABC):
    @abstractmethod
    def get_placement(self, shelf_id: uuid.UUID) -> PlacementResult:
        raise NotImplementedError


class MockShelfPlacementProvider(ShelfPlacementProvider):
    def get_placement(self, shelf_id: uuid.UUID) -> PlacementResult:
        digest = hashlib.md5(f"{shelf_id}-placement".encode()).hexdigest()
        idx = int(digest, 16) % len(PLACEMENTS)
        return PlacementResult(placement=PLACEMENTS[idx], is_mock=True)
