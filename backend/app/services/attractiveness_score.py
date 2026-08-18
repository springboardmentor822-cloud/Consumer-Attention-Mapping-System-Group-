"""
Product Attractiveness Score - Milestone 3.

Formula (per Milestone_3.pdf):
  0.35*Attention + 0.25*Interaction + 0.20*Pickup + 0.15*Purchase + 0.05*Repeat

Attention, interaction and repeat now come from persisted/derived tracking data.
Pickup is a shelf-exit candidate from the current detector, not hand-level CV.
Purchase is observed only when PurchaseEvent rows are populated by the POS adapter.

Usage:
    python -m app.services.attractiveness_score <camera_id>
"""

import argparse
import uuid

from sqlmodel import Session, select

from app.core.db import engine
from app.models.camera import Camera
from app.models.product_attractiveness_score import ProductAttractivenessScore
from app.models.shelf_camera_view import ShelfCameraView
from app.models.store import Shelf
from app.services.metrics.attention_provider import RealAttentionProvider
from app.services.metrics.real_interaction_provider import RealInteractionProvider

FORMULA_WEIGHTS = {
    "attention": 0.35,
    "interaction": 0.25,
    "pickup": 0.20,
    "purchase": 0.15,
    "repeat": 0.05,
}


def _build_providers() -> dict:
    # Use observed/derived providers wherever the current event schema can
    # support them. Pickup remains explicitly a candidate signal (not
    # hand/keypoint detection), and purchase is only observed when POS rows
    # exist. The scoring/API layer preserves those provenance flags.
    return {
        "attention": RealAttentionProvider(),
        "interaction": RealInteractionProvider("interaction"),
        "pickup": RealInteractionProvider("pickup"),
        "purchase": RealInteractionProvider("purchase"),
        "repeat": RealInteractionProvider("repeat"),
    }


class AttractivenessScoringUnavailable(Exception):
    """Raised when there's nothing to score - no camera, or no
    ShelfCameraView rows configured for it yet."""


def compute_attractiveness_scores(camera_id: uuid.UUID, persist: bool = True) -> list[dict]:
    with Session(engine) as session:
        camera = session.get(Camera, camera_id)
        if not camera:
            raise AttractivenessScoringUnavailable(f"No Camera found with id {camera_id}")
        store_id = camera.store_id

        views = session.exec(
            select(ShelfCameraView).where(ShelfCameraView.camera_id == camera_id)
        ).all()
        if not views:
            raise AttractivenessScoringUnavailable(f"No ShelfCameraView rows for camera {camera.name}")

        shelf_ids = list({v.shelf_id for v in views})
        shelves = session.exec(select(Shelf).where(Shelf.id.in_(shelf_ids))).all()
        shelf_names = {s.id: s.shelf_name for s in shelves}

    providers = _build_providers()
    metric_results = {
        name: provider.get_scores(shelf_ids, camera_id, store_id)
        for name, provider in providers.items()
    }

    results = []
    for shelf_id in shelf_ids:
        components = {name: metric_results[name][shelf_id] for name in FORMULA_WEIGHTS}
        final_score = sum(FORMULA_WEIGHTS[name] * components[name].value for name in FORMULA_WEIGHTS)
        mock_metrics = [name for name, c in components.items() if c.is_mock]

        record = {
            "shelf_id": str(shelf_id),
            "shelf_name": shelf_names.get(shelf_id, str(shelf_id)),
            "camera_id": str(camera_id),
            "store_id": str(store_id),
            "final_score": round(final_score, 3),
            "attention_score": components["attention"].value,
            "interaction_score": components["interaction"].value,
            "pickup_score": components["pickup"].value,
            "purchase_score": components["purchase"].value,
            "repeat_score": components["repeat"].value,
            "mock_metrics": mock_metrics,  # which of the above are placeholders, not real
        }
        results.append(record)

        if persist:
            with Session(engine) as session:
                session.add(ProductAttractivenessScore(
                    store_id=store_id,
                    shelf_id=shelf_id,
                    camera_id=camera_id,
                    final_score=record["final_score"],
                    attention_score=record["attention_score"],
                    interaction_score=record["interaction_score"],
                    pickup_score=record["pickup_score"],
                    purchase_score=record["purchase_score"],
                    repeat_score=record["repeat_score"],
                    mock_metrics=",".join(mock_metrics),
                ))
                session.commit()

    return results


def get_attractiveness_history(camera_id: uuid.UUID) -> list[dict]:
    """
    Full stored history for a camera, oldest -> newest, bounded by
    whatever the scheduler's RETENTION_DAYS (recommendation_scheduler.py)
    has pruned down to. Only meaningful as a TREND now that the scheduler
    has actually run more than once - a single snapshot isn't a trend,
    it's just the same one point compute_attractiveness_scores() already
    returns.
    """
    with Session(engine) as session:
        rows = session.exec(
            select(ProductAttractivenessScore)
            .where(ProductAttractivenessScore.camera_id == camera_id)
            .order_by(ProductAttractivenessScore.computed_at.asc())
        ).all()

        shelf_ids = {r.shelf_id for r in rows}
        shelves = session.exec(select(Shelf).where(Shelf.id.in_(shelf_ids))).all() if shelf_ids else []
        shelf_names = {s.id: s.shelf_name for s in shelves}

    return [
        {
            "shelf_id": str(r.shelf_id),
            "shelf_name": shelf_names.get(r.shelf_id, str(r.shelf_id)),
            "computed_at": r.computed_at.isoformat(),
            "final_score": r.final_score,
        }
        for r in rows
    ]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("camera_id", type=str)
    args = parser.parse_args()
    camera_id = uuid.UUID(args.camera_id)
    try:
        results = compute_attractiveness_scores(camera_id)
    except AttractivenessScoringUnavailable as e:
        print(str(e))
        return

    print(f"\n--- Attractiveness scores for camera {camera_id} ---")
    for r in results:
        mock_note = f" (mocked: {', '.join(r['mock_metrics'])})" if r["mock_metrics"] else ""
        print(f"{r['shelf_name']}: {r['final_score']:.3f}{mock_note}")


if __name__ == "__main__":
    main()
