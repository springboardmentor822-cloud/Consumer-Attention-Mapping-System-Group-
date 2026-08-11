"""
Product Attractiveness Score - the exact Milestone 3 weighted formula.

    Score = 0.35 x Attention Duration
          + 0.25 x Interaction Frequency
          + 0.20 x Pickup Rate
          + 0.15 x Purchase Conversion Rate
          + 0.05 x Repeat Engagement Rate

Every component is min-max normalized to 0..1 across the product set being
scored BEFORE the weights are applied, so the weighted sum is on a
consistent 0..1 scale and is reported as 0..100.

This lives alongside (not instead of) app/analytics/attractiveness.py, which
scores SHELVES on a different four-signal formula and is already wired into
the analyst dashboard. Replacing that one would have silently changed
numbers people are already reading; this module is the product-level M3
formula, and both are kept explicitly separate.

=========================================================================
WHAT IS REALLY MEASURED, AND WHAT IS NOT
=========================================================================
Two of the five components cannot be measured by this system. They are
computed from a documented fallback and every response carries a
per-component availability flag so the dashboard can label them - none of
them is silently invented:

  measured    Attention Duration      real dwell seconds near the product's
                                      zone, from tracking_data.
  measured    Interaction Frequency   count of sustained pauses near the
                                      product's zone (CustomerInteraction).
  PROXY       Pickup Rate             there is no pick/touch detection model
                                      and no shelf weight sensor. Falls back
                                      to interactions-per-visit, which is a
                                      proximity proxy for handling, NOT
                                      observed pickups.
  PARTIAL     Purchase Conversion     purchases exist only for registered
                                      customers (an anonymous track has no
                                      payment evidence), and in this database
                                      they are demo records. Computed from
                                      real purchase_items rows where present;
                                      reported as 0 with available=False when
                                      a product has no transactions at all.
  measured    Repeat Engagement       share of this product's interactions
                                      coming from visits that touched its
                                      zone more than once.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.metrics import normalize

# The Milestone 3 weights, verbatim. Sum to exactly 1.0.
W_ATTENTION = 0.35
W_INTERACTION = 0.25
W_PICKUP = 0.20
W_CONVERSION = 0.15
W_REPEAT = 0.05

WEIGHTS = {
    "attention_duration": W_ATTENTION,
    "interaction_frequency": W_INTERACTION,
    "pickup_rate": W_PICKUP,
    "purchase_conversion": W_CONVERSION,
    "repeat_engagement": W_REPEAT,
}

# Availability of each component, surfaced to the UI so a proxy is never
# presented as a direct measurement.
COMPONENT_AVAILABILITY = {
    "attention_duration": "measured",
    "interaction_frequency": "measured",
    "pickup_rate": "proxy",  # no pick-detection model exists
    "purchase_conversion": "partial",  # only for registered customers
    "repeat_engagement": "measured",
}


@dataclass
class ProductSignals:
    """Raw, un-normalized per-product measurements."""

    product_id: int
    product_name: str
    category: str
    zone_name: str | None
    attention_seconds: float
    interaction_count: int
    visit_count: int
    purchase_quantity: int
    repeat_interaction_count: int
    has_any_purchase: bool


@dataclass
class ComponentScore:
    name: str
    raw: float
    normalized: float  # 0..1
    weight: float
    contribution: float  # normalized * weight
    availability: str  # measured | proxy | partial


@dataclass
class ProductAttractiveness:
    product_id: int
    product_name: str
    category: str
    zone_name: str | None
    score: float  # 0..100
    components: list[ComponentScore]
    # Convenience roll-ups the dashboard displays directly.
    shelf_visibility_score: float
    product_engagement_score: float
    conversion_potential_score: float
    marketing_effectiveness_score: float
    data_complete: bool


def _raw_components(signal: ProductSignals) -> dict[str, float]:
    """Per-product raw values, before cross-product normalization."""
    visits = max(signal.visit_count, 1)
    return {
        # Total seconds of attention near this product's zone.
        "attention_duration": signal.attention_seconds,
        # Interactions per visit rather than a raw count, so a product in a
        # busy zone isn't rewarded purely for footfall.
        "interaction_frequency": signal.interaction_count / visits,
        # PROXY: interactions per visit stands in for handling, because no
        # pick detection exists. Same raw input as above by necessity - the
        # honest consequence of the missing sensor, not a modelling choice.
        "pickup_rate": signal.interaction_count / visits,
        # Units sold per visit that could have bought it.
        "purchase_conversion": signal.purchase_quantity / visits,
        # Share of interactions from repeat visits to the zone.
        "repeat_engagement": (
            signal.repeat_interaction_count / signal.interaction_count if signal.interaction_count else 0.0
        ),
    }


def score_products(signals: list[ProductSignals]) -> list[ProductAttractiveness]:
    """Apply the M3 formula across a product set.

    Normalization is min-max WITHIN this set, so a score is a product's
    standing relative to the others scored in the same call - not an absolute
    rating that can be compared across different stores or date ranges. That
    is a real property of the formula as specified, and is stated in the API
    response rather than hidden.
    """
    if not signals:
        return []

    raw_by_product = {s.product_id: _raw_components(s) for s in signals}
    bounds = {
        component: (
            min(raw[component] for raw in raw_by_product.values()),
            max(raw[component] for raw in raw_by_product.values()),
        )
        for component in WEIGHTS
    }

    results: list[ProductAttractiveness] = []
    for signal in signals:
        raw = raw_by_product[signal.product_id]
        components: list[ComponentScore] = []
        weighted_total = 0.0

        for name, weight in WEIGHTS.items():
            low, high = bounds[name]
            normalized = normalize(raw[name], low, high)
            contribution = normalized * weight
            weighted_total += contribution
            availability = COMPONENT_AVAILABILITY[name]
            # A product with no transactions at all has no conversion
            # evidence - mark it unavailable rather than implying a real zero.
            if name == "purchase_conversion" and not signal.has_any_purchase:
                availability = "unavailable"
            components.append(
                ComponentScore(
                    name=name,
                    raw=round(raw[name], 4),
                    normalized=round(normalized, 4),
                    weight=weight,
                    contribution=round(contribution, 4),
                    availability=availability,
                )
            )

        by_name = {c.name: c.normalized for c in components}
        results.append(
            ProductAttractiveness(
                product_id=signal.product_id,
                product_name=signal.product_name,
                category=signal.category,
                zone_name=signal.zone_name,
                score=round(weighted_total * 100, 2),
                components=components,
                # Visibility: how much attention the product's position earns.
                shelf_visibility_score=round(by_name["attention_duration"] * 100, 2),
                # Engagement: deliberate interaction rather than passive passing.
                product_engagement_score=round(
                    (by_name["interaction_frequency"] * 0.6 + by_name["repeat_engagement"] * 0.4) * 100, 2
                ),
                # Conversion potential: interest that has not yet converted.
                conversion_potential_score=round(
                    max(0.0, by_name["interaction_frequency"] - by_name["purchase_conversion"]) * 100, 2
                ),
                # Marketing effectiveness: attention actually turning into sales.
                marketing_effectiveness_score=round(
                    (by_name["purchase_conversion"] * 0.7 + by_name["attention_duration"] * 0.3) * 100, 2
                ),
                data_complete=signal.has_any_purchase,
            )
        )

    return sorted(results, key=lambda r: r.score, reverse=True)
