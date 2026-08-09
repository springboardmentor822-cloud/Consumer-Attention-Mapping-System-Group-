"""
Rule-based optimization recommendations for shelves/zones, built entirely on
real signals this system already computes: traffic (unique visitors),
dwell time, and stock levels. There is no sales/conversion or historical
baseline data in this schema, so these rules are deliberately relative
(this shelf vs. the other shelves in the same query) rather than tied to
fixed absolute thresholds that would imply a precision this data doesn't
have.

Three rules, each mirroring a common retail-analytics heuristic:

  1. High traffic + low dwell   -> people pass but don't stop.
     Action: improve visual merchandising / signage.
  2. High dwell + real stockouts on that shelf -> people stop, but there's
     less to buy. This is intentionally framed around *stock*, not "sales",
     since no sales/conversion data exists here - claiming a sales-conversion
     read on stock data alone would be fabricating a metric.
  3. Low traffic ("dead zone") -> action: reposition a high-demand product
     there to draw traffic.

"High" / "low" are the top/bottom third of the shelves actually passed in.
Ranking a shelf as "high" or "low" traffic needs something to be relative
to, so this refuses to generate traffic-based rules with fewer than
MIN_SHELVES_FOR_RANKING shelves - with only one or two shelves "top third"
is meaningless, and the honest answer is no recommendation rather than a
guess dressed up as an insight.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.attractiveness import AttractivenessInput

MIN_SHELVES_FOR_RANKING = 3


@dataclass
class Recommendation:
    severity: str  # "info" | "notable" | "critical"
    shelf_id: int
    shelf_name: str
    zone: str
    issue: str
    action: str


def _tertile_bounds(values: list[float]) -> tuple[float, float]:
    """Returns (low_cutoff, high_cutoff) splitting `values` into thirds."""
    ordered = sorted(values)
    n = len(ordered)
    low_idx = max(0, n // 3 - 1)
    high_idx = min(n - 1, (2 * n) // 3)
    return ordered[low_idx], ordered[high_idx]


def generate_recommendations(inputs: list[AttractivenessInput]) -> list[Recommendation]:
    with_data = [i for i in inputs if i.has_behavior_data]
    if len(with_data) < MIN_SHELVES_FOR_RANKING:
        return []

    traffic_low, traffic_high = _tertile_bounds([i.traffic for i in with_data])
    dwell_low, dwell_high = _tertile_bounds([i.dwell_seconds for i in with_data])

    recommendations: list[Recommendation] = []
    for item in with_data:
        is_high_traffic = item.traffic >= traffic_high and traffic_high > traffic_low
        is_low_traffic = item.traffic <= traffic_low and traffic_high > traffic_low
        is_high_dwell = item.dwell_seconds >= dwell_high and dwell_high > dwell_low
        is_low_dwell = item.dwell_seconds <= dwell_low and dwell_high > dwell_low

        if is_high_traffic and is_low_dwell:
            recommendations.append(
                Recommendation(
                    severity="notable",
                    shelf_id=item.shelf_id,
                    shelf_name=item.shelf_name,
                    zone=item.zone,
                    issue=(
                        f"'{item.shelf_name}' gets some of the highest foot traffic in this store "
                        "but one of the shortest average stops - people pass without stopping."
                    ),
                    action="Improve visual merchandising or add clearer pricing/promo signage at this shelf.",
                )
            )

        if is_high_dwell and item.stockout_ratio > 0:
            recommendations.append(
                Recommendation(
                    severity="notable",
                    shelf_id=item.shelf_id,
                    shelf_name=item.shelf_name,
                    zone=item.zone,
                    issue=(
                        f"'{item.shelf_name}' has one of the longest average dwell times in this store, "
                        f"but {round(item.stockout_ratio * 100)}% of its products are low or out of stock."
                    ),
                    action="Prioritize restocking this shelf - real shopper interest may be going unmet.",
                )
            )

        if is_low_traffic:
            recommendations.append(
                Recommendation(
                    severity="info",
                    shelf_id=item.shelf_id,
                    shelf_name=item.shelf_name,
                    zone=item.zone,
                    issue=f"'{item.zone}' has one of the lowest foot traffic zones in this store.",
                    action="Consider repositioning a high-demand product here to help draw traffic.",
                )
            )

    return recommendations
