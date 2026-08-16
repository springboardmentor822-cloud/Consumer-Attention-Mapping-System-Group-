import datetime as dt

from app.models.analytics import ProductAttractivenessScore
from app.models.enums import RecommendationTypeEnum, ShelfLevelEnum
from app.models.product import Product
from app.models.shelf import Shelf
from app.services.recommendation_service import generate_recommendations_for_store


def _make_shelf(db_session, store_id=1, level=ShelfLevelEnum.MIDDLE, name="Shelf"):
    shelf = Shelf(store_id=store_id, name=name, shelf_level=level)
    db_session.add(shelf)
    db_session.commit()
    db_session.refresh(shelf)
    return shelf


def _make_product(db_session, shelf_id, name="Product", sku=None):
    product = Product(sku=sku or f"SKU-{name}", name=name, shelf_id=shelf_id)
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def _make_score(db_session, product_id, **overrides):
    now = dt.datetime(2026, 1, 1)
    defaults = dict(
        attention_duration_score=50.0,
        interaction_frequency_score=50.0,
        pickup_rate_score=50.0,
        conversion_rate_score=50.0,
        repeat_engagement_score=50.0,
        total_score=50.0,
    )
    defaults.update(overrides)
    score = ProductAttractivenessScore(
        product_id=product_id, period_start=now, period_end=now, **defaults
    )
    db_session.add(score)
    db_session.commit()
    return score


def test_low_score_triggers_product_visibility_recommendation(db_session):
    shelf = _make_shelf(db_session)
    product = _make_product(db_session, shelf.id, "Low Scorer")
    _make_score(db_session, product.id, total_score=10.0)

    recs = generate_recommendations_for_store(db_session, store_id=1)

    types = {r.recommendation_type for r in recs}
    assert RecommendationTypeEnum.PRODUCT_VISIBILITY in types


def test_high_attention_low_pickup_triggers_product_placement(db_session):
    shelf = _make_shelf(db_session)
    product = _make_product(db_session, shelf.id, "Gazed Not Grabbed")
    _make_score(
        db_session,
        product.id,
        attention_duration_score=80.0,
        pickup_rate_score=5.0,
        total_score=45.0,
    )

    recs = generate_recommendations_for_store(db_session, store_id=1)

    types = {r.recommendation_type for r in recs}
    assert RecommendationTypeEnum.PRODUCT_PLACEMENT in types


def test_high_pickup_low_conversion_triggers_quality_pricing_review(db_session):
    shelf = _make_shelf(db_session)
    product = _make_product(db_session, shelf.id, "Picked Then Returned")
    _make_score(
        db_session,
        product.id,
        pickup_rate_score=70.0,
        conversion_rate_score=5.0,
        total_score=45.0,
    )

    recs = generate_recommendations_for_store(db_session, store_id=1)

    matching = [r for r in recs if r.recommendation_type == RecommendationTypeEnum.QUALITY_PRICING_REVIEW]
    assert len(matching) == 1
    assert matching[0].product_id == product.id


def test_high_score_triggers_promotional_placement(db_session):
    shelf = _make_shelf(db_session)
    product = _make_product(db_session, shelf.id, "Star", sku="STAR-1")
    _make_score(db_session, product.id, total_score=90.0)

    recs = generate_recommendations_for_store(db_session, store_id=1)

    types = {r.recommendation_type for r in recs}
    assert RecommendationTypeEnum.PROMOTIONAL_PLACEMENT in types


def test_high_score_on_bottom_shelf_triggers_eye_level_relocation(db_session):
    bottom_shelf = _make_shelf(db_session, level=ShelfLevelEnum.BOTTOM, name="Bottom Shelf")
    product = _make_product(db_session, bottom_shelf.id, "Buried Star", sku="STAR-2")
    _make_score(db_session, product.id, total_score=85.0)

    recs = generate_recommendations_for_store(db_session, store_id=1)

    matching = [r for r in recs if r.recommendation_type == RecommendationTypeEnum.EYE_LEVEL_RELOCATION]
    assert len(matching) == 1
    assert matching[0].product_id == product.id


def test_high_score_on_eye_level_shelf_does_not_trigger_relocation(db_session):
    eye_shelf = _make_shelf(db_session, level=ShelfLevelEnum.EYE_LEVEL, name="Eye Level Shelf")
    product = _make_product(db_session, eye_shelf.id, "Already Prime", sku="STAR-3")
    _make_score(db_session, product.id, total_score=85.0)

    recs = generate_recommendations_for_store(db_session, store_id=1)

    types = {r.recommendation_type for r in recs}
    assert RecommendationTypeEnum.EYE_LEVEL_RELOCATION not in types


def test_cold_shelf_gets_anchor_recommendation(db_session):
    cold_shelf = _make_shelf(db_session, name="Cold Corner")
    hot_shelf = _make_shelf(db_session, name="Hot Aisle")

    cold_product = _make_product(db_session, cold_shelf.id, "Ignored Item", sku="COLD-1")
    anchor_product = _make_product(db_session, hot_shelf.id, "Best Seller", sku="HOT-1")

    _make_score(db_session, cold_product.id, attention_duration_score=2.0, total_score=5.0)
    _make_score(db_session, anchor_product.id, attention_duration_score=95.0, total_score=95.0)

    recs = generate_recommendations_for_store(db_session, store_id=1)

    cold_zone_recs = [r for r in recs if r.recommendation_type == RecommendationTypeEnum.COLD_ZONE_ANCHOR]
    assert len(cold_zone_recs) == 1
    assert cold_zone_recs[0].shelf_id == cold_shelf.id
    assert cold_zone_recs[0].product_id == anchor_product.id


def test_warm_shelf_does_not_get_cold_zone_recommendation(db_session):
    shelf = _make_shelf(db_session, name="Busy Aisle")
    product = _make_product(db_session, shelf.id, "Popular Item", sku="WARM-1")
    _make_score(db_session, product.id, attention_duration_score=60.0, total_score=60.0)

    recs = generate_recommendations_for_store(db_session, store_id=1)

    types = {r.recommendation_type for r in recs}
    assert RecommendationTypeEnum.COLD_ZONE_ANCHOR not in types


def test_generate_recommendations_is_idempotent_in_shape(db_session):
    shelf = _make_shelf(db_session)
    product = _make_product(db_session, shelf.id, "Repeatable", sku="REPEAT-1")
    _make_score(db_session, product.id, total_score=90.0)

    first_pass = generate_recommendations_for_store(db_session, store_id=1)
    second_pass = generate_recommendations_for_store(db_session, store_id=1)

    assert len(first_pass) > 0
    assert len(second_pass) > 0
