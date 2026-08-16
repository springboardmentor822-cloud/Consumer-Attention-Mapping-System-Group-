"""
Product Attractiveness Score

    score = 0.35 * attention_duration
          + 0.25 * interaction_frequency
          + 0.20 * pickup_rate
          + 0.15 * conversion_rate
          + 0.05 * repeat_engagement

Each component is normalized to a 0-100 scale relative to the other
products active in the same store/period before weighting, so the score
is comparable across a catalog rather than an arbitrary raw number.
"""
import datetime as dt

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.analytics import ProductAttractivenessScore
from app.models.attention import AttentionEvent
from app.models.interaction import ProductInteraction
from app.models.enums import InteractionTypeEnum
from app.models.product import Product

WEIGHTS = {
    "attention_duration": 0.35,
    "interaction_frequency": 0.25,
    "pickup_rate": 0.20,
    "conversion_rate": 0.15,
    "repeat_engagement": 0.05,
}


def _normalize(value: float, max_value: float) -> float:
    if max_value <= 0:
        return 0.0
    return max(0.0, min(100.0, (value / max_value) * 100.0))


def compute_product_scores(
    db: Session, store_id: int, period_start: dt.datetime, period_end: dt.datetime
) -> list[ProductAttractivenessScore]:
    products = (
        db.query(Product)
        .join(Product.shelf)
        .filter(Product.shelf.has(store_id=store_id))
        .all()
    )
    if not products:
        return []

    raw_metrics: dict[int, dict[str, float]] = {}

    for product in products:
        attention_seconds = (
            db.query(func.coalesce(func.sum(AttentionEvent.duration_seconds), 0.0))
            .filter(
                AttentionEvent.product_id == product.id,
                AttentionEvent.start_time >= period_start,
                AttentionEvent.start_time <= period_end,
            )
            .scalar()
        )

        interaction_count = (
            db.query(func.count(ProductInteraction.id))
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.timestamp >= period_start,
                ProductInteraction.timestamp <= period_end,
            )
            .scalar()
        )

        picked_up = (
            db.query(func.count(ProductInteraction.id))
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.interaction_type == InteractionTypeEnum.PICKED_UP,
                ProductInteraction.timestamp >= period_start,
                ProductInteraction.timestamp <= period_end,
            )
            .scalar()
        )

        purchased = (
            db.query(func.count(ProductInteraction.id))
            .filter(
                ProductInteraction.product_id == product.id,
                ProductInteraction.interaction_type == InteractionTypeEnum.PURCHASED,
                ProductInteraction.timestamp >= period_start,
                ProductInteraction.timestamp <= period_end,
            )
            .scalar()
        )

        repeat_attention = (
            db.query(func.coalesce(func.sum(AttentionEvent.is_repeat_attention), 0))
            .filter(
                AttentionEvent.product_id == product.id,
                AttentionEvent.start_time >= period_start,
                AttentionEvent.start_time <= period_end,
            )
            .scalar()
        )

        pickup_rate = (picked_up / interaction_count) if interaction_count else 0.0
        conversion_rate = (purchased / picked_up) if picked_up else 0.0

        raw_metrics[product.id] = {
            "attention_seconds": float(attention_seconds or 0.0),
            "interaction_count": float(interaction_count or 0),
            "pickup_rate": float(pickup_rate),
            "conversion_rate": float(conversion_rate),
            "repeat_attention": float(repeat_attention or 0),
        }

    max_attention = max(m["attention_seconds"] for m in raw_metrics.values()) or 1.0
    max_interactions = max(m["interaction_count"] for m in raw_metrics.values()) or 1.0
    max_repeat = max(m["repeat_attention"] for m in raw_metrics.values()) or 1.0

    results = []
    for product in products:
        m = raw_metrics[product.id]

        attention_score = _normalize(m["attention_seconds"], max_attention)
        interaction_score = _normalize(m["interaction_count"], max_interactions)
        pickup_score = m["pickup_rate"] * 100.0
        conversion_score = m["conversion_rate"] * 100.0
        repeat_score = _normalize(m["repeat_attention"], max_repeat)

        total = (
            WEIGHTS["attention_duration"] * attention_score
            + WEIGHTS["interaction_frequency"] * interaction_score
            + WEIGHTS["pickup_rate"] * pickup_score
            + WEIGHTS["conversion_rate"] * conversion_score
            + WEIGHTS["repeat_engagement"] * repeat_score
        )

        score_row = ProductAttractivenessScore(
            product_id=product.id,
            period_start=period_start,
            period_end=period_end,
            attention_duration_score=round(attention_score, 2),
            interaction_frequency_score=round(interaction_score, 2),
            pickup_rate_score=round(pickup_score, 2),
            conversion_rate_score=round(conversion_score, 2),
            repeat_engagement_score=round(repeat_score, 2),
            total_score=round(total, 2),
        )
        db.add(score_row)
        results.append(score_row)

    db.commit()
    for r in results:
        db.refresh(r)
    return results
