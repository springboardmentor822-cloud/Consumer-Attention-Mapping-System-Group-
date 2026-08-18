"""
Rule-Based Optimization & Recommendation Engine - Milestone 3, Step 4.

Implements the 4 rules from Milestone_3.pdf's "Diagnostic Rules":
  1. High Attention + Low Pickup       -> pricing/packaging check
  2. High Pickup + Low Purchase Conv.  -> quality/pricing inspection
  3. Cold Zone (low traffic/dwell)     -> suggest anchor product placement
  4. Eye-Level Optimization            -> relocate high-score bottom-shelf items

Three real caveats, not glossed over:
  - Rules 1 and 2 read pickup_score/purchase_score, which are still fully
    mocked (see attractiveness_score.py / mock_providers.py). Until real
    pickup/purchase detection exists, any recommendation from these two
    rules is driven by mock noise, not a real signal - it's correct code
    running on placeholder data, not a real finding yet.
  - expected_conversion_uplift_pct is an illustrative heuristic (gap-size
    scaled to a plausible-looking percentage), not a fitted prediction -
    Milestone_3.pdf names this field but gives no formula, and there's no
    historical conversion-lift data to model it from. is_estimate=True on
    every row for this reason.
  - Rule 3 (cold zone) only ever recommends the SINGLE coldest zone
    store-wide, never multiple zones at once, and always the single
    highest-scoring shelf as the anchor. An earlier version flagged every
    zone under COLD_ZONE_RATIO and recommended the same shelf to each one
    simultaneously - not physically sensible (one shelf, multiple
    zones). Fixed; see the comment at the Rule 3 block below.

HIGH/LOW thresholds (0.6 / 0.4 on the existing 0-1 normalized scale) are
an assumption - the doc never specifies numbers. Tune HIGH_THRESHOLD /
LOW_THRESHOLD below if these don't match what your mentor expects.

Usage:
    python -m app.services.recommendation_engine <store_id>
"""

import argparse
import uuid
from collections import defaultdict

from sqlmodel import Session, select

from app.core.db import engine
from app.core.timescale_db import timescale_engine
from app.models.camera import Camera
from app.models.product_attractiveness_score import ProductAttractivenessScore
from app.models.recommendation import Recommendation
from app.models.store import Shelf
from app.models.zone import Zone
from app.services.shelf_placement import MockShelfPlacementProvider

HIGH_THRESHOLD = 0.6
LOW_THRESHOLD = 0.4

# Cold zone: a zone's total distinct-visitor count is "cold" if it falls
# below this fraction of the busiest zone's count. Relative, not an
# absolute number, since "busy" varies store to store.
COLD_ZONE_RATIO = 0.25


def _latest_scores_per_shelf(store_id: uuid.UUID, session: Session) -> dict:
    """One ProductAttractivenessScore row per shelf_id - the most recent
    computed_at only, since compute_attractiveness_scores() can be run
    repeatedly and leaves every past row in place (see attractiveness_score.py)."""
    rows = session.exec(
        select(ProductAttractivenessScore)
        .where(ProductAttractivenessScore.store_id == store_id)
        .order_by(ProductAttractivenessScore.computed_at.desc())
    ).all()
    latest = {}
    for row in rows:
        if row.shelf_id not in latest:
            latest[row.shelf_id] = row
    return latest


def _distinct_track_count(camera_id: uuid.UUID) -> int:
    """Distinct track_ids in a camera's most recent run (person events
    only). Mirrors the already-verified zone-comparison chart's method:
    sum PER-CAMERA distinct counts across a zone rather than pooling
    track_ids together, since track_id isn't unique across cameras/runs
    (float ids like 1.0 can collide between separate video files)."""
    with timescale_engine.connect() as conn:
        import pandas as pd
        df = pd.read_sql(
            """
            SELECT track_id, frame_index, event_time FROM tracking_events
            WHERE camera_id = %(camera_id)s AND class_name IS NULL
            ORDER BY event_time
            """,
            conn,
            params={"camera_id": str(camera_id)},
        )
    if df.empty:
        return 0
    reset_points = df.index[df["frame_index"] == 0].tolist()
    last_run_start = reset_points[-1] if reset_points else 0
    df = df.iloc[last_run_start:]
    return df["track_id"].nunique()


def _zone_visitor_counts(store_id: uuid.UUID, session: Session) -> dict:
    """zone_id -> summed distinct-visitor count across that zone's cameras."""
    zones = session.exec(select(Zone).where(Zone.store_id == store_id)).all()
    cameras = session.exec(select(Camera).where(Camera.store_id == store_id)).all()

    counts = defaultdict(int)
    for zone in zones:
        zone_cameras = [c for c in cameras if c.zone_id == zone.id]
        counts[zone.id] = sum(_distinct_track_count(c.id) for c in zone_cameras)
    return dict(counts)


class RecommendationEngineUnavailable(Exception):
    """Raised when there's nothing to evaluate - no attractiveness scores
    computed yet for this store."""


def compute_and_persist_recommendations(store_id: uuid.UUID, persist: bool = True) -> list[dict]:
    with Session(engine) as session:
        latest_scores = _latest_scores_per_shelf(store_id, session)
        if not latest_scores:
            raise RecommendationEngineUnavailable(
                f"No attractiveness scores found for store {store_id} - "
                "run attractiveness_score.py against this store's cameras first."
            )

        shelves = {s.id: s for s in session.exec(
            select(Shelf).where(Shelf.id.in_(latest_scores.keys()))
        ).all()}
        cameras = {c.id: c for c in session.exec(select(Camera).where(Camera.store_id == store_id)).all()}
        zones = {z.id: z for z in session.exec(select(Zone).where(Zone.store_id == store_id)).all()}

    placement_provider = MockShelfPlacementProvider()
    recommendations = []

    # ---- Rules 1 & 2: per-shelf attention/pickup/purchase checks ----
    for shelf_id, score in latest_scores.items():
        shelf = shelves.get(shelf_id)
        shelf_name = shelf.shelf_name if shelf else str(shelf_id)
        camera = cameras.get(score.camera_id)
        zone_id = camera.zone_id if camera else None

        # Rule 1: High Attention + Low Pickup -> packaging/pricing check
        if score.attention_score >= HIGH_THRESHOLD and score.pickup_score <= LOW_THRESHOLD:
            gap = score.attention_score - score.pickup_score
            recommendations.append(dict(
                store_id=store_id, shelf_id=shelf_id, zone_id=zone_id, camera_id=score.camera_id,
                rule_type="high_attention_low_pickup", priority="high",
                action_item=f"Review packaging/pricing for '{shelf_name}' - high shopper attention but low pickup rate.",
                target_description=shelf_name,
                expected_conversion_uplift_pct=round(gap * 15, 1),  # illustrative, see module docstring
                based_on_mock=["pickup_score"],  # attention is real; pickup is still mocked
            ))

        # Rule 2: High Pickup + Low Purchase Conversion -> quality/pricing inspection
        if score.pickup_score >= HIGH_THRESHOLD and score.purchase_score <= LOW_THRESHOLD:
            gap = score.pickup_score - score.purchase_score
            recommendations.append(dict(
                store_id=store_id, shelf_id=shelf_id, zone_id=zone_id, camera_id=score.camera_id,
                rule_type="high_pickup_low_purchase", priority="high",
                action_item=f"Inspect product quality/pricing for '{shelf_name}' - shoppers pick it up but don't buy.",
                target_description=shelf_name,
                expected_conversion_uplift_pct=round(gap * 15, 1),
                based_on_mock=["pickup_score", "purchase_score"],  # both mocked - low confidence
            ))

        # Rule 4: Eye-Level Optimization
        placement = placement_provider.get_placement(shelf_id)
        if score.final_score >= HIGH_THRESHOLD and placement.placement != "eye_level":
            recommendations.append(dict(
                store_id=store_id, shelf_id=shelf_id, zone_id=zone_id, camera_id=score.camera_id,
                rule_type="eye_level_relocation", priority="medium",
                action_item=f"Relocate '{shelf_name}' (currently {placement.placement} shelf) to eye level - "
                            f"high attractiveness score ({score.final_score}) isn't at optimal placement.",
                target_description=shelf_name,
                expected_conversion_uplift_pct=round(score.final_score * 10, 1),
                based_on_mock=["shelf_placement"],  # placement is fully mocked
            ))

    # ---- Rule 3: Cold Zone detection (store-wide, not per-shelf) ----
    with Session(engine) as session:
        zone_counts = _zone_visitor_counts(store_id, session)

    if zone_counts:
        max_count = max(zone_counts.values(), default=0)
        best_shelf_id = max(latest_scores, key=lambda sid: latest_scores[sid].final_score, default=None)
        best_shelf_name = shelves.get(best_shelf_id).shelf_name if best_shelf_id and shelves.get(best_shelf_id) else None

        # Only the SINGLE coldest zone store-wide gets a recommendation, not
        # every zone under COLD_ZONE_RATIO. Milestone_3.pdf's own rule text
        # doesn't address what happens with multiple cold zones at once -
        # the earlier version flagged every zone under the ratio and
        # recommended the SAME anchor shelf to each of them simultaneously,
        # which isn't physically sensible (one shelf can't be relocated to
        # two zones at the same time). Restricting to the single coldest
        # zone keeps the output actionable; extending to multiple zones
        # later would need a ranked list of DIFFERENT anchor candidates per
        # zone, not just the single best shelf reused.
        coldest_zone_id = min(zone_counts, key=lambda zid: zone_counts[zid], default=None)
        coldest_count = zone_counts.get(coldest_zone_id, 0)

        if (
            max_count > 0
            and best_shelf_name
            and coldest_zone_id is not None
            and coldest_count <= max_count * COLD_ZONE_RATIO
        ):
            zone = zones.get(coldest_zone_id)
            zone_name = zone.name if zone else str(coldest_zone_id)
            recommendations.append(dict(
                store_id=store_id, shelf_id=None, zone_id=coldest_zone_id, camera_id=None,
                rule_type="cold_zone", priority="medium",
                action_item=f"Low traffic in '{zone_name}' ({coldest_count} visitors vs {max_count} in the "
                            f"busiest zone) - consider placing '{best_shelf_name}' (highest-scoring "
                            f"shelf, {latest_scores[best_shelf_id].final_score}) here to increase flow.",
                target_description=f"Zone: {zone_name}",
                expected_conversion_uplift_pct=round((1 - coldest_count / max_count) * 8, 1),
                based_on_mock=[],  # zone traffic is real data
            ))

    if persist:
        with Session(engine) as session:
            for rec in recommendations:
                session.add(Recommendation(
                    store_id=rec["store_id"],
                    shelf_id=rec["shelf_id"],
                    zone_id=rec["zone_id"],
                    camera_id=rec["camera_id"],
                    rule_type=rec["rule_type"],
                    priority=rec["priority"],
                    action_item=rec["action_item"],
                    target_description=rec["target_description"],
                    expected_conversion_uplift_pct=rec["expected_conversion_uplift_pct"],
                    is_estimate=True,
                    based_on_mock=",".join(rec["based_on_mock"]),
                ))
            session.commit()

    # JSON-friendly output shape
    return [
        {
            "shelf_id": str(r["shelf_id"]) if r["shelf_id"] else None,
            "zone_id": str(r["zone_id"]) if r["zone_id"] else None,
            "camera_id": str(r["camera_id"]) if r["camera_id"] else None,
            "rule_type": r["rule_type"],
            "priority": r["priority"],
            "action_item": r["action_item"],
            "target_description": r["target_description"],
            "expected_conversion_uplift_pct": r["expected_conversion_uplift_pct"],
            "is_estimate": True,
            "based_on_mock": r["based_on_mock"],
        }
        for r in recommendations
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("store_id", type=str)
    args = parser.parse_args()
    store_id = uuid.UUID(args.store_id)

    try:
        results = compute_and_persist_recommendations(store_id)
    except RecommendationEngineUnavailable as e:
        print(str(e))
        return

    if not results:
        print("No rules triggered - nothing to recommend right now.")
        return

    print(f"\n--- {len(results)} recommendation(s) for store {store_id} ---")
    for r in results:
        mock_note = f" [mock-based: {', '.join(r['based_on_mock'])}]" if r["based_on_mock"] else ""
        print(f"[{r['priority'].upper()}] {r['rule_type']}: {r['action_item']}{mock_note}")


if __name__ == "__main__":
    main()
