"""
Engagement scoring for a single dwell visit (see dwell_time.py). There is no
gaze/attention sensor in this system - only positional tracking - so every
signal here is derived from movement speed and time, documented as a proxy
rather than presented as literal attention measurement.

  - Standing time:     cumulative time below the "walking" speed floor.
  - Interaction time:  the subset of standing time that forms a single
                        sustained pause of at least MIN_INTERACTION_SECONDS
                        (a momentary slow-down while walking isn't an
                        interaction; stopping for a while is).
  - Viewing time:      the full visit duration - a customer is within tracked
                        proximity of this zone/shelf for the whole visit,
                        regardless of whether they were moving or standing.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.analytics.dwell_time import Visit
from app.analytics.metrics import (
    MIN_INTERACTION_SECONDS,
    compute_motion_sequence,
    is_standing,
    normalize,
)

# Weights for the three engagement components - configurable, sum to 1.0.
# Interaction (a real, sustained pause) counts for the most; viewing (mere
# proximity) counts for the least, since it happens passively for every visit.
STANDING_WEIGHT = 0.3
INTERACTION_WEIGHT = 0.5
VIEWING_WEIGHT = 0.2

# A visit at or beyond this duration is treated as "fully engaged" for the
# viewing-time component of the score, mirroring the existing
# "Highly Engaged (10min+)" bucket in analytics_dashboard.py's segmentation.
FULLY_ENGAGED_DURATION_SECONDS = 600.0


@dataclass
class EngagementResult:
    customer_id: int
    camera_id: int
    zone_id: int | None
    standing_time_seconds: float
    interaction_time_seconds: float
    viewing_time_seconds: float
    engagement_score: float


def compute_engagement_for_visit(visit: Visit) -> EngagementResult:
    motions = compute_motion_sequence(visit.points)

    standing_time = 0.0
    interaction_time = 0.0
    run_duration = 0.0
    for motion in motions:
        if is_standing(motion):
            standing_time += motion.duration_seconds
            run_duration += motion.duration_seconds
        else:
            if run_duration >= MIN_INTERACTION_SECONDS:
                interaction_time += run_duration
            run_duration = 0.0
    if run_duration >= MIN_INTERACTION_SECONDS:
        interaction_time += run_duration

    viewing_time = visit.duration_seconds

    standing_ratio = standing_time / viewing_time if viewing_time > 0 else 0.0
    interaction_ratio = interaction_time / viewing_time if viewing_time > 0 else 0.0
    duration_factor = normalize(viewing_time, 0.0, FULLY_ENGAGED_DURATION_SECONDS)

    score = round(
        100
        * (
            STANDING_WEIGHT * standing_ratio
            + INTERACTION_WEIGHT * interaction_ratio
            + VIEWING_WEIGHT * duration_factor
        ),
        1,
    )

    return EngagementResult(
        customer_id=visit.customer_id,
        camera_id=visit.camera_id,
        zone_id=visit.zone_id,
        standing_time_seconds=round(standing_time, 1),
        interaction_time_seconds=round(interaction_time, 1),
        viewing_time_seconds=round(viewing_time, 1),
        engagement_score=score,
    )


def compute_engagement_for_visits(visits: list[Visit]) -> list[EngagementResult]:
    return [compute_engagement_for_visit(v) for v in visits]


@dataclass
class EngagementSummary:
    average_score: float
    average_standing_seconds: float
    average_interaction_seconds: float
    average_viewing_seconds: float
    sample_size: int


def summarize_engagement(results: list[EngagementResult]) -> EngagementSummary:
    if not results:
        return EngagementSummary(0.0, 0.0, 0.0, 0.0, 0)
    n = len(results)
    return EngagementSummary(
        average_score=round(sum(r.engagement_score for r in results) / n, 1),
        average_standing_seconds=round(sum(r.standing_time_seconds for r in results) / n, 1),
        average_interaction_seconds=round(sum(r.interaction_time_seconds for r in results) / n, 1),
        average_viewing_seconds=round(sum(r.viewing_time_seconds for r in results) / n, 1),
        sample_size=n,
    )
