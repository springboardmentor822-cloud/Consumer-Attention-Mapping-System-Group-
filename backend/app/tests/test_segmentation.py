from app.models.enums import CustomerSegmentEnum
from app.services.segmentation_service import SessionFeatures, classify_session_features


def test_quick_buyer():
    f = SessionFeatures(
        duration_seconds=90,
        zones_visited=1,
        total_interactions=2,
        distinct_products_interacted=1,
        purchase_count=1,
        compared_count=0,
        purchased_brands={"BrandX"},
    )
    assert classify_session_features(f) == CustomerSegmentEnum.QUICK_BUYER


def test_impulse_buyer():
    f = SessionFeatures(
        duration_seconds=400,  # long session overall, but...
        zones_visited=2,
        total_interactions=5,
        distinct_products_interacted=1,  # ...only interacted with 1 product
        purchase_count=1,
        compared_count=0,  # never compared alternatives
        purchased_brands={"BrandX"},
    )
    assert classify_session_features(f) == CustomerSegmentEnum.IMPULSE_BUYER


def test_brand_loyal():
    f = SessionFeatures(
        duration_seconds=300,
        zones_visited=2,
        total_interactions=6,
        distinct_products_interacted=4,
        purchase_count=2,
        compared_count=0,
        purchased_brands={"BrandX"},  # both purchases same brand
    )
    assert classify_session_features(f) == CustomerSegmentEnum.BRAND_LOYAL


def test_comparison_shopper_via_compared_interactions():
    f = SessionFeatures(
        duration_seconds=250,
        zones_visited=2,
        total_interactions=6,
        distinct_products_interacted=3,
        purchase_count=0,
        compared_count=2,
        purchased_brands=set(),
    )
    assert classify_session_features(f) == CustomerSegmentEnum.COMPARISON_SHOPPER


def test_comparison_shopper_via_many_distinct_products():
    f = SessionFeatures(
        duration_seconds=250,
        zones_visited=2,
        total_interactions=6,
        distinct_products_interacted=4,  # >= COMPARISON_MIN_DISTINCT_PRODUCTS
        purchase_count=0,
        compared_count=0,
        purchased_brands=set(),
    )
    assert classify_session_features(f) == CustomerSegmentEnum.COMPARISON_SHOPPER


def test_explorer():
    f = SessionFeatures(
        duration_seconds=600,
        zones_visited=5,
        total_interactions=1,
        distinct_products_interacted=1,
        purchase_count=0,
        compared_count=0,
        purchased_brands=set(),
    )
    assert classify_session_features(f) == CustomerSegmentEnum.EXPLORER


def test_quick_buyer_via_high_velocity_direct_path():
    """Corroborating signal path: doesn't hit the tight time/interaction
    window, but moves fast and stays in one zone before buying."""
    f = SessionFeatures(
        duration_seconds=250,
        zones_visited=1,
        total_interactions=4,
        distinct_products_interacted=2,
        purchase_count=1,
        compared_count=0,
        purchased_brands={"BrandX"},
        pickup_count=1,
        avg_velocity_mps=0.7,
    )
    assert classify_session_features(f) == CustomerSegmentEnum.QUICK_BUYER


def test_explorer_via_total_distance():
    """High ground covered over a long session reads as Explorer even
    when the zone-count threshold isn't independently met."""
    f = SessionFeatures(
        duration_seconds=400,
        zones_visited=2,
        total_interactions=2,
        distinct_products_interacted=2,
        purchase_count=0,
        compared_count=0,
        purchased_brands=set(),
        pickup_count=0,
        total_distance_m=55.0,
        avg_velocity_mps=0.14,
    )
    assert classify_session_features(f) == CustomerSegmentEnum.EXPLORER


def test_explorer_with_high_pickup_rate_is_not_explorer():
    """Spec: Explorers have *low* pickup frequency. High zones/duration
    but a high pickup rate shouldn't earn the Explorer label via the
    zone-count path. distinct_products_interacted is kept below the
    comparison-shopper threshold so that rule doesn't intercept first."""
    f = SessionFeatures(
        duration_seconds=400,
        zones_visited=4,
        total_interactions=4,
        distinct_products_interacted=2,
        purchase_count=0,
        compared_count=0,
        purchased_brands=set(),
        pickup_count=4,  # 100% pickup rate - not "low pickup frequency"
    )
    assert classify_session_features(f) != CustomerSegmentEnum.EXPLORER


def test_unclassified_when_no_signal():
    f = SessionFeatures(
        duration_seconds=30,
        zones_visited=1,
        total_interactions=0,
        distinct_products_interacted=0,
        purchase_count=0,
        compared_count=0,
        purchased_brands=set(),
    )
    assert classify_session_features(f) == CustomerSegmentEnum.UNCLASSIFIED


def test_quick_buyer_takes_priority_over_impulse_buyer():
    # matches both quick-buyer and impulse-buyer criteria -> quick buyer wins (priority order)
    f = SessionFeatures(
        duration_seconds=60,
        zones_visited=1,
        total_interactions=1,
        distinct_products_interacted=1,
        purchase_count=1,
        compared_count=0,
        purchased_brands={"BrandX"},
    )
    assert classify_session_features(f) == CustomerSegmentEnum.QUICK_BUYER
