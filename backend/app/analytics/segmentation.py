"""
Shopper behavioural segmentation (Milestone 3).

RULE-BASED, NOT MACHINE-LEARNED. There is no labelled ground truth in this
project - nobody has ever tagged a real shopper as an "Explorer" - so there
is nothing to train or validate a classifier against, and any accuracy or
confidence figure quoted for one would be invented. This module therefore
implements the five requested segments as transparent, inspectable rules
over metrics the tracking pipeline genuinely produces, and every response is
labelled `method="rule_based"` so no consumer of the API can mistake it for
a learned model. Each result also carries the exact measurements that
triggered it, so a human can check the reasoning rather than trust a number.

The five segments, and what each can honestly be derived from here:

  Explorer            many zones, high total dwell, few sustained pauses -
                      wandering broadly without settling on anything.
  Quick Buyer         few zones, short visit, went more or less straight to
                      one place. "Purchase conversion" is NOT part of the
                      test: the video pipeline cannot observe a payment, so
                      including it would be fabricated (see below).
  Comparison Shopper  repeatedly re-enters the same small set of zones and
                      pauses often - the switching-back-and-forth pattern.
  Impulse Buyer       dwell concentrated in a promotional/end-cap zone with
                      little prior wandering.
  Brand Loyal         goes to the same one or two zones with almost no
                      exploration, and settles quickly.

KNOWN LIMITS, stated rather than papered over:

  * "Product pickup" is not measurable. This system has person detection and
    positional tracking only - no pick/touch detection model and no shelf
    sensors - so "interactions" here means sustained pauses near a zone's
    shelves, which is a proximity proxy, not observed handling.
  * "Purchase conversion" cannot be tied to a tracked person. Purchases
    belong to a registered customer; an anonymous track has no payment
    evidence at all. Segments therefore never use conversion as an input.
  * Segment assignment applies to one *visit session*, not to a person over
    time, because ByteTrack ids restart every processing run (see
    app/models/customer.py). A person is not tracked across days.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.analytics.dwell_time import Session
from app.analytics.metrics import MIN_INTERACTION_SECONDS, compute_motion_sequence, is_standing

# Method label returned with every response. Anything reading this API can
# branch on it, and the dashboards render it verbatim.
METHOD = "rule_based"

# --- thresholds -------------------------------------------------------------
# Deliberately module-level and named so they are easy to find and tune once
# real observations justify different values. They are defensible defaults,
# NOT fitted constants - nothing here was learned from labelled data.

# A session shorter than this, or built from a single tracked point, carries
# no behaviour to read. Without this guard such sessions trivially satisfied
# "few zones + short visit" and were labelled Quick Buyer - which is how an
# early run produced 523 Quick Buyers averaging 0.9 zones and 14s, most of
# them zero-duration fragments. They are now reported as insufficient data
# rather than given a confident label they don't support.
MIN_CLASSIFIABLE_SECONDS = 5.0
MIN_CLASSIFIABLE_POINTS = 2

# At least this many distinct zones to count as broad exploration.
EXPLORER_MIN_ZONES = 3
# "Low immediate interaction" has to be judged RELATIVE to how much ground
# was covered: someone crossing five zones naturally accumulates more pauses
# than someone standing in one, so an absolute cap on total pauses wrongly
# excluded genuine wanderers (the 66 visits averaging 3.55 zones / 681s that
# an early run left Unclassified). Pauses per zone is the honest test.
EXPLORER_MAX_INTERACTIONS_PER_ZONE = 2.0
# A visit at or below this many zones is "focused" rather than exploratory.
FOCUSED_MAX_ZONES = 2
# Visits shorter than this are treated as direct/purposeful movement.
QUICK_VISIT_MAX_SECONDS = 120.0
# Sustained pauses (>= MIN_INTERACTION_SECONDS) needed to look deliberate.
HIGH_INTERACTION_MIN_COUNT = 3
# Re-entering zones this many times signals comparing/switching.
COMPARISON_MIN_REVISITS = 2
# Share of a visit's dwell inside promotional zones to read as impulse.
IMPULSE_MIN_PROMO_SHARE = 0.5
# Zone-name keywords that mark a promotional / end-cap area. Matched against
# the store's real zone names - no zone is invented.
PROMO_ZONE_KEYWORDS = ("promo", "offer", "end-cap", "endcap", "display")

SEGMENTS = (
    "Explorer",
    "Quick Buyer",
    "Comparison Shopper",
    "Impulse Buyer",
    "Brand Loyal",
    "Unclassified",
)


@dataclass
class VisitBehaviour:
    """The measurements a segment decision is made from - all real, all
    derived from tracking_data via the existing analytics primitives."""

    tracking_id: str
    camera_id: int
    distinct_zones: int
    zone_revisits: int
    total_seconds: float
    interaction_count: int
    promo_dwell_share: float
    dominant_zone: str | None
    point_count: int = 0

    @property
    def is_classifiable(self) -> bool:
        """Whether this session holds enough signal to label at all."""
        return (
            self.total_seconds >= MIN_CLASSIFIABLE_SECONDS
            and self.point_count >= MIN_CLASSIFIABLE_POINTS
        )

    @property
    def interactions_per_zone(self) -> float:
        return self.interaction_count / max(self.distinct_zones, 1)


@dataclass
class SegmentAssignment:
    tracking_id: str
    segment: str
    reason: str
    behaviour: VisitBehaviour
    method: str = METHOD


@dataclass
class SegmentSummary:
    segment: str
    count: int
    share: float  # 0..1 of classified visits
    average_dwell_seconds: float
    average_zones: float
    examples: list[str] = field(default_factory=list)


def _zone_sequence(session: Session) -> list[int]:
    """Zones in the order they were entered, collapsing consecutive repeats.

    Collapsing matters: raw points emit the same zone dozens of times in a
    row while someone stands still, which would otherwise read as dozens of
    'revisits' when the shopper never actually left.
    """
    sequence: list[int] = []
    for point in sorted(session.points, key=lambda p: p.timestamp):
        if point.zone_id is None:
            continue
        if not sequence or sequence[-1] != point.zone_id:
            sequence.append(point.zone_id)
    return sequence


def describe_visit(session: Session, zone_names: dict[int, str]) -> VisitBehaviour:
    """Reduce one visit session to the behavioural measurements above."""
    sequence = _zone_sequence(session)
    distinct = set(sequence)
    # A revisit is any re-entry beyond the first entry of each zone.
    revisits = max(0, len(sequence) - len(distinct))

    # Sustained pauses, reusing the same motion primitives every other
    # analytics module uses rather than a second definition of "interaction".
    interaction_count = sum(
        1
        for motion in compute_motion_sequence(sorted(session.points, key=lambda p: p.timestamp))
        if is_standing(motion) and motion.duration_seconds >= MIN_INTERACTION_SECONDS
    )

    # Time per zone, so promotional share is a real fraction of this visit.
    seconds_by_zone: dict[int, float] = {}
    ordered = sorted(session.points, key=lambda p: p.timestamp)
    for prev, curr in zip(ordered, ordered[1:]):
        if prev.zone_id is None:
            continue
        seconds_by_zone[prev.zone_id] = seconds_by_zone.get(prev.zone_id, 0.0) + (
            curr.timestamp - prev.timestamp
        ).total_seconds()

    total_zone_seconds = sum(seconds_by_zone.values())
    promo_seconds = sum(
        seconds
        for zone_id, seconds in seconds_by_zone.items()
        if any(keyword in (zone_names.get(zone_id, "")).lower() for keyword in PROMO_ZONE_KEYWORDS)
    )
    promo_share = (promo_seconds / total_zone_seconds) if total_zone_seconds > 0 else 0.0

    dominant_zone_id = max(seconds_by_zone, key=seconds_by_zone.get) if seconds_by_zone else None

    return VisitBehaviour(
        tracking_id=f"customer_{session.customer_id:03d}",
        camera_id=session.camera_id,
        distinct_zones=len(distinct),
        zone_revisits=revisits,
        total_seconds=round(session.duration_seconds, 2),
        interaction_count=interaction_count,
        promo_dwell_share=round(promo_share, 4),
        dominant_zone=zone_names.get(dominant_zone_id) if dominant_zone_id is not None else None,
        point_count=len(session.points),
    )


def classify(behaviour: VisitBehaviour) -> SegmentAssignment:
    """Assign one segment, most specific rule first.

    Order matters and is deliberate: Impulse and Comparison describe distinct
    *patterns* that would otherwise be swallowed by the broader zone-count
    rules, so they are tested before Explorer/Brand Loyal. A visit matching
    nothing is returned as "Unclassified" rather than being forced into the
    nearest bucket - a wrong label is worse than an honest absence.
    """
    b = behaviour

    if not b.is_classifiable:
        return SegmentAssignment(
            b.tracking_id,
            "Unclassified",
            f"only {b.total_seconds:.0f}s across {b.point_count} tracked point(s) - too short to "
            f"read behaviour from",
            b,
        )

    if b.promo_dwell_share >= IMPULSE_MIN_PROMO_SHARE and b.distinct_zones <= FOCUSED_MAX_ZONES:
        return SegmentAssignment(
            b.tracking_id,
            "Impulse Buyer",
            f"{b.promo_dwell_share:.0%} of dwell in a promotional zone across only "
            f"{b.distinct_zones} zone(s) - engagement with a promotional display "
            f"without prior browsing",
            b,
        )

    if b.zone_revisits >= COMPARISON_MIN_REVISITS and b.interaction_count >= HIGH_INTERACTION_MIN_COUNT:
        return SegmentAssignment(
            b.tracking_id,
            "Comparison Shopper",
            f"re-entered zones {b.zone_revisits} time(s) with {b.interaction_count} sustained "
            f"pause(s) - switching back and forth between nearby products",
            b,
        )

    if (
        b.distinct_zones >= EXPLORER_MIN_ZONES
        and b.interactions_per_zone < EXPLORER_MAX_INTERACTIONS_PER_ZONE
    ):
        return SegmentAssignment(
            b.tracking_id,
            "Explorer",
            f"covered {b.distinct_zones} zones over {b.total_seconds:.0f}s at "
            f"{b.interactions_per_zone:.1f} pause(s) per zone - broad browsing, low commitment "
            f"per area",
            b,
        )

    if b.distinct_zones <= FOCUSED_MAX_ZONES and b.total_seconds <= QUICK_VISIT_MAX_SECONDS:
        # Note: purchase conversion is intentionally NOT part of this test -
        # the pipeline cannot observe a payment (see module docstring).
        return SegmentAssignment(
            b.tracking_id,
            "Quick Buyer",
            f"{b.distinct_zones} zone(s) in {b.total_seconds:.0f}s - direct movement to a "
            f"target area (purchase not observable from video)",
            b,
        )

    if b.distinct_zones <= FOCUSED_MAX_ZONES and b.interaction_count >= 1:
        return SegmentAssignment(
            b.tracking_id,
            "Brand Loyal",
            f"settled in {b.dominant_zone or 'one zone'} across only {b.distinct_zones} zone(s) "
            f"with {b.interaction_count} pause(s) - repeat direct approach to the same section",
            b,
        )

    return SegmentAssignment(
        b.tracking_id,
        "Unclassified",
        f"{b.distinct_zones} zone(s), {b.total_seconds:.0f}s, {b.interaction_count} pause(s) - "
        f"no segment rule matched",
        b,
    )


def summarize(assignments: list[SegmentAssignment]) -> list[SegmentSummary]:
    """Per-segment counts and averages, for the distribution chart."""
    classified = [a for a in assignments if a.segment != "Unclassified"]
    denominator = len(classified) or 1

    summaries: list[SegmentSummary] = []
    for segment in SEGMENTS:
        members = [a for a in assignments if a.segment == segment]
        if not members and segment == "Unclassified":
            continue
        total_dwell = sum(a.behaviour.total_seconds for a in members)
        total_zones = sum(a.behaviour.distinct_zones for a in members)
        summaries.append(
            SegmentSummary(
                segment=segment,
                count=len(members),
                # Unclassified is reported but excluded from the share base so
                # the five real segments' shares still sum to 100%.
                share=round(len(members) / denominator, 4) if segment != "Unclassified" else 0.0,
                average_dwell_seconds=round(total_dwell / len(members), 2) if members else 0.0,
                average_zones=round(total_zones / len(members), 2) if members else 0.0,
                examples=[a.tracking_id for a in members[:5]],
            )
        )
    return summaries
