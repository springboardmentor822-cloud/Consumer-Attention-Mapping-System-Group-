"""
Recommendation - one row per triggered rule from the M3 Step 4
Rule-Based Optimization Engine.

Deviates from Milestone_3.pdf's literal spec in two documented ways:
  1. "target SKU" -> target is shelf_id/shelf_name. This system has never
     tracked individual SKUs (Steps 1-3 are all shelf-level), so SKU-level
     targeting isn't available - inherited scope, not new here.
  2. expected_conversion_uplift_pct is an ILLUSTRATIVE heuristic, not a
     fitted prediction - the doc names this field but gives no formula,
     and there's no historical conversion-lift data to model it from.
     is_estimate stays True on every row for this reason - don't let a
     dashboard present this number as a real forecast.

based_on_mock lists which upstream inputs (pickup_score, purchase_score,
shelf_placement, etc.) fed this specific recommendation and are still
mocked - same transparency contract as ProductAttractivenessScore's
mock_metrics field. A rule fired entirely from mock inputs is a
different thing than one fired from real data, and this column is how a
later query can tell them apart.
"""

import uuid
from datetime import datetime, UTC

from sqlmodel import SQLModel, Field


class Recommendation(SQLModel, table=True):
    __tablename__ = "recommendations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    store_id: uuid.UUID = Field(foreign_key="store.id")
    shelf_id: uuid.UUID | None = Field(default=None, foreign_key="shelf.id")
    zone_id: uuid.UUID | None = Field(default=None, foreign_key="zone.id")
    camera_id: uuid.UUID | None = Field(default=None, foreign_key="camera.id")
    computed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    rule_type: str  # "high_attention_low_pickup" | "high_pickup_low_purchase" |
                     # "cold_zone" | "eye_level_relocation"
    priority: str    # "high" | "medium" | "low"
    action_item: str  # human-readable recommendation text
    target_description: str  # e.g. shelf name, or "Aisle zone: <name>"

    expected_conversion_uplift_pct: float
    is_estimate: bool = True  # always True right now - see module docstring

    based_on_mock: str  # comma-separated list of mocked inputs behind this row, "" if none
