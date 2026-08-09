"""
Product/shelf Attractiveness Score: a composite ranking built from four real
signals already computed elsewhere in this package - nothing here is a new
measurement, it's a weighted combination of existing ones:

  - Passing traffic:  unique visitors on the shelf's camera (repo.unique_
                       customers_for_cameras).
  - Dwell time:        avg visit duration on that camera (repo.
                       shelf_behavior_metrics).
  - Interaction:       avg engagement score on that camera - itself a proxy
                       built from standing/pause time, see engagement.py.
  - Stockout penalty:  fraction of the shelf's products below
                       LOW_STOCK_THRESHOLD (real Product.stock_quantity).

There is no real sales/conversion data in this schema, so this deliberately
does NOT claim to measure "attractiveness to buyers" in a sales sense - it
measures attention and interaction, which is what the tracked data can
actually support. The weights below are a defensible default, not a fitted
or authoritative constant - they're kept as module-level names specifically
so they're easy to find and tune later.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.metrics import normalize

# Sum to 1.0 (before the stockout penalty, which subtracts rather than adds).
# Interaction is weighted highest because it's the most deliberate signal
# (a sustained pause), traffic and dwell next as passive-but-real signals,
# and stockout as a penalty rather than a positive weight since "shelf is
# bare" should pull a score down regardless of how the other three land.
TRAFFIC_WEIGHT = 0.30
DWELL_WEIGHT = 0.25
INTERACTION_WEIGHT = 0.30
STOCKOUT_PENALTY_WEIGHT = 0.15


@dataclass
class AttractivenessInput:
    shelf_id: int
    shelf_name: str
    store_name: str
    zone: str
    traffic: int
    dwell_seconds: float
    engagement_score: float
    stockout_ratio: float  # 0.0 (fully stocked) .. 1.0 (every product low/out)
    has_behavior_data: bool  # False if the camera has never produced tracking data


@dataclass
class AttractivenessResult:
    shelf_id: int
    shelf_name: str
    store_name: str
    zone: str
    score: float  # 0-100
    traffic_score: float  # 0-1, normalized within this call's shelf set
    dwell_score: float  # 0-1
    interaction_score: float  # 0-1
    stockout_penalty: float  # 0-1
    rank: int
    has_behavior_data: bool


def score_shelves(inputs: list[AttractivenessInput]) -> list[AttractivenessResult]:
    """Min-max normalizes each signal across the given shelves (so a score is
    always relative to the other shelves in scope, not an absolute unit) and
    combines them into one 0-100 composite.

    Shelves with has_behavior_data=False (camera never processed) are scored
    using only the stockout signal - traffic/dwell/interaction default to the
    lowest end of the normalized range for them rather than a fabricated
    number, since there is genuinely no behavior data to normalize against.
    """
    if not inputs:
        return []

    with_data = [i for i in inputs if i.has_behavior_data]
    traffic_vals = [i.traffic for i in with_data] or [0]
    dwell_vals = [i.dwell_seconds for i in with_data] or [0]
    engagement_vals = [i.engagement_score for i in with_data] or [0]

    traffic_lo, traffic_hi = min(traffic_vals), max(traffic_vals)
    dwell_lo, dwell_hi = min(dwell_vals), max(dwell_vals)
    engagement_lo, engagement_hi = min(engagement_vals), max(engagement_vals)

    results: list[AttractivenessResult] = []
    for item in inputs:
        if item.has_behavior_data:
            traffic_score = normalize(item.traffic, traffic_lo, traffic_hi)
            dwell_score = normalize(item.dwell_seconds, dwell_lo, dwell_hi)
            interaction_score = normalize(item.engagement_score, engagement_lo, engagement_hi)
        else:
            traffic_score = dwell_score = interaction_score = 0.0

        stockout_penalty = max(0.0, min(1.0, item.stockout_ratio))

        composite = (
            TRAFFIC_WEIGHT * traffic_score
            + DWELL_WEIGHT * dwell_score
            + INTERACTION_WEIGHT * interaction_score
            - STOCKOUT_PENALTY_WEIGHT * stockout_penalty
        )
        # The subtraction can push composite slightly below 0 (e.g. a fully
        # stocked-out shelf with otherwise-zero signals) - clamp for display.
        score = round(max(0.0, composite) * 100, 1)

        results.append(
            AttractivenessResult(
                shelf_id=item.shelf_id,
                shelf_name=item.shelf_name,
                store_name=item.store_name,
                zone=item.zone,
                score=score,
                traffic_score=round(traffic_score, 2),
                dwell_score=round(dwell_score, 2),
                interaction_score=round(interaction_score, 2),
                stockout_penalty=round(stockout_penalty, 2),
                rank=0,
                has_behavior_data=item.has_behavior_data,
            )
        )

    results.sort(key=lambda r: r.score, reverse=True)
    for i, r in enumerate(results, start=1):
        r.rank = i
    return results
