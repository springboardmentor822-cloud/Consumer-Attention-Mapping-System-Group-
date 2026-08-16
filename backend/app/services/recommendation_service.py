"""
Rule-based recommendation engine. Generates actionable suggestions from
product attractiveness scores and shelf attention aggregates.

Implements the milestone-3 diagnostic rule set:
  - High attention + low pickup -> packaging/pricing check.
  - High pickup + low purchase conversion -> quality/pricing review.
  - Cold shelf zones -> anchor a top performer nearby to pull traffic.
  - Eye-level optimization -> relocate high scorers off bottom shelves.
  - High overall score -> promotional/cross-sell placement.

This is deliberately simple and transparent (rules, not a black-box
model) so retail teams can trust and audit *why* a recommendation was
made. It can be swapped for a learned ranking model later without
changing the API contract.
"""
from sqlalchemy.orm import Session

from app.models.analytics import ProductAttractivenessScore, Recommendation
from app.models.enums import RecommendationTypeEnum, ShelfLevelEnum
from app.models.product import Product
from app.models.shelf import Shelf

LOW_SCORE_THRESHOLD = 30.0
HIGH_SCORE_THRESHOLD = 75.0
LOW_PICKUP_THRESHOLD = 15.0

# High pickup but shoppers keep returning it / never converting.
HIGH_PICKUP_THRESHOLD = 50.0
LOW_CONVERSION_THRESHOLD = 15.0

# A shelf whose products average below this attention score across the
# measured period is "cold" - not enough foot traffic/dwell reaching it.
COLD_SHELF_AVG_ATTENTION_THRESHOLD = 20.0
# Only worth flagging as an anchor candidate if it's a genuinely strong performer.
ANCHOR_CANDIDATE_MIN_SCORE = 70.0


def _cold_shelf_recommendations(
    db: Session, store_id: int, scores: list[ProductAttractivenessScore]
) -> list[Recommendation]:
    """Cold Shelf Zones: shelves whose products average low attention
    across the measured period get flagged, and the store's strongest
    performer (if not already there) is suggested as an anchor to pull
    traffic toward them."""
    by_shelf: dict[int, list[float]] = {}
    for score in scores:
        product = db.query(Product).filter(Product.id == score.product_id).first()
        if not product or product.shelf_id is None:
            continue
        by_shelf.setdefault(product.shelf_id, []).append(score.attention_duration_score)

    if not by_shelf:
        return []

    best_score = max(scores, key=lambda s: s.total_score, default=None)
    anchor_product = (
        db.query(Product).filter(Product.id == best_score.product_id).first() if best_score else None
    )

    recs: list[Recommendation] = []
    for shelf_id, attention_scores in by_shelf.items():
        avg_attention = sum(attention_scores) / len(attention_scores)
        if avg_attention >= COLD_SHELF_AVG_ATTENTION_THRESHOLD:
            continue
        if not anchor_product or best_score.total_score < ANCHOR_CANDIDATE_MIN_SCORE:
            continue
        if anchor_product.shelf_id == shelf_id:
            continue  # already there

        shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
        shelf_name = shelf.name if shelf else f"shelf {shelf_id}"
        rec = Recommendation(
            store_id=store_id,
            shelf_id=shelf_id,
            product_id=anchor_product.id,
            recommendation_type=RecommendationTypeEnum.COLD_ZONE_ANCHOR,
            title=f"Warm up '{shelf_name}' with an anchor product",
            description=(
                f"'{shelf_name}' is averaging just {round(avg_attention, 1)}/100 attention across "
                f"tracked products - a cold zone. '{anchor_product.name}' is the store's strongest "
                f"performer ({best_score.total_score}/100); placing it (or a similar high-performing "
                f"item) nearby tends to pull foot traffic through under-visited aisles."
            ),
            confidence_score=round(min(1.0, (COLD_SHELF_AVG_ATTENTION_THRESHOLD - avg_attention) / COLD_SHELF_AVG_ATTENTION_THRESHOLD), 2),
        )
        db.add(rec)
        recs.append(rec)

    return recs


def generate_recommendations_for_store(db: Session, store_id: int) -> list[Recommendation]:
    scores = (
        db.query(ProductAttractivenessScore)
        .join(Product)
        .filter(Product.shelf.has(store_id=store_id))
        .order_by(ProductAttractivenessScore.computed_at.desc())
        .all()
    )

    recommendations = []
    seen_products: set[int] = set()

    for score in scores:
        if score.product_id in seen_products:
            continue
        seen_products.add(score.product_id)

        product = db.query(Product).filter(Product.id == score.product_id).first()
        if not product:
            continue

        if score.total_score < LOW_SCORE_THRESHOLD:
            rec = Recommendation(
                store_id=store_id,
                shelf_id=product.shelf_id,
                product_id=product.id,
                recommendation_type=RecommendationTypeEnum.PRODUCT_VISIBILITY,
                title=f"Improve visibility for '{product.name}'",
                description=(
                    f"'{product.name}' scored {score.total_score}/100 in attractiveness for "
                    f"the last measured period. Consider moving it to eye-level shelf space, "
                    f"adding signage, or bundling with a higher-performing product nearby."
                ),
                confidence_score=round(min(1.0, (LOW_SCORE_THRESHOLD - score.total_score) / 30), 2),
            )
            db.add(rec)
            recommendations.append(rec)

        if score.pickup_rate_score < LOW_PICKUP_THRESHOLD and score.attention_duration_score > 50:
            rec = Recommendation(
                store_id=store_id,
                shelf_id=product.shelf_id,
                product_id=product.id,
                recommendation_type=RecommendationTypeEnum.PRODUCT_PLACEMENT,
                title=f"High attention, low pickup for '{product.name}'",
                description=(
                    f"Shoppers are looking at '{product.name}' but rarely picking it up "
                    f"(pickup score {score.pickup_rate_score}/100 vs attention score "
                    f"{score.attention_duration_score}/100). This gap often indicates unclear "
                    f"pricing, packaging, or accessibility issues worth investigating in-store."
                ),
                confidence_score=0.6,
            )
            db.add(rec)
            recommendations.append(rec)

        if score.pickup_rate_score >= HIGH_PICKUP_THRESHOLD and score.conversion_rate_score < LOW_CONVERSION_THRESHOLD:
            rec = Recommendation(
                store_id=store_id,
                shelf_id=product.shelf_id,
                product_id=product.id,
                recommendation_type=RecommendationTypeEnum.QUALITY_PRICING_REVIEW,
                title=f"Picked up often, rarely bought: '{product.name}'",
                description=(
                    f"'{product.name}' has a strong pickup score ({score.pickup_rate_score}/100) "
                    f"but a weak purchase-conversion score ({score.conversion_rate_score}/100) - "
                    f"shoppers pick it up, read the label or price tag, then put it back. Worth "
                    f"a quality, pricing, or packaging-clarity review."
                ),
                confidence_score=round(min(1.0, (score.pickup_rate_score - score.conversion_rate_score) / 100), 2),
            )
            db.add(rec)
            recommendations.append(rec)

        if score.total_score > HIGH_SCORE_THRESHOLD:
            rec = Recommendation(
                store_id=store_id,
                shelf_id=product.shelf_id,
                product_id=product.id,
                recommendation_type=RecommendationTypeEnum.PROMOTIONAL_PLACEMENT,
                title=f"Leverage strong performance of '{product.name}'",
                description=(
                    f"'{product.name}' is a top performer ({score.total_score}/100). Consider "
                    f"using its shelf position as an anchor for cross-promotions with "
                    f"lower-performing complementary products."
                ),
                confidence_score=round(min(1.0, score.total_score / 100), 2),
            )
            db.add(rec)
            recommendations.append(rec)

        if (
            score.total_score >= ANCHOR_CANDIDATE_MIN_SCORE
            and product.shelf is not None
            and product.shelf.shelf_level == ShelfLevelEnum.BOTTOM
        ):
            rec = Recommendation(
                store_id=store_id,
                shelf_id=product.shelf_id,
                product_id=product.id,
                recommendation_type=RecommendationTypeEnum.EYE_LEVEL_RELOCATION,
                title=f"Move '{product.name}' up to eye level",
                description=(
                    f"'{product.name}' scores {score.total_score}/100 in attractiveness but sits "
                    f"on a bottom shelf, where gaze density is lowest. Relocating it to eye-level "
                    f"space would let a proven performer capture the traffic that placement "
                    f"naturally draws."
                ),
                confidence_score=round(min(1.0, score.total_score / 100), 2),
            )
            db.add(rec)
            recommendations.append(rec)

    recommendations.extend(_cold_shelf_recommendations(db, store_id, scores))

    db.commit()
    for r in recommendations:
        db.refresh(r)
    return recommendations
