import pytest
import numpy as np
from app.ml.behavior_engine import (
    SimpleKalmanFilter2D,
    smooth_trajectory,
    calculate_trajectory_metrics,
    classify_shopper_segment,
)
from app.ml.heatmap_engine import (
    compute_planogram_homography,
    transform_coordinates_homography,
    generate_gaussian_kde_heatmap,
    render_heatmap_layers,
)
from app.services.attractiveness_engine import calculate_product_attractiveness_score
from app.services.recommendation_engine import evaluate_diagnostic_rules


def test_kalman_filter_and_trajectory_smoothing():
    raw_points = [(10.0, 10.0), (12.0, 11.0), (15.0, 13.0), (20.0, 18.0)]
    smoothed = smooth_trajectory(raw_points)

    assert len(smoothed) == len(raw_points)
    assert isinstance(smoothed[0][0], float)
    assert isinstance(smoothed[0][1], float)


def test_trajectory_metrics_calculation():
    raw_points = [(0.0, 0.0), (3.0, 4.0), (6.0, 8.0)]  # Distance: 5 + 5 = 10
    timestamps = [0.0, 1.0, 2.0]

    metrics = calculate_trajectory_metrics(raw_points, timestamps)

    assert metrics["total_path_distance"] > 0
    assert metrics["avg_movement_velocity"] > 0
    assert metrics["total_dwell_seconds"] == 2.0
    assert "smoothed_points" in metrics


def test_shopper_segmentation_classification():
    # Brand Loyal
    assert classify_shopper_segment(50.0, 60.0, 1, 1, 1) == "brand_loyal"
    # Quick Buyer
    assert classify_shopper_segment(40.0, 50.0, 1, 1, 2) == "quick_buyers"
    # Comparison Shopper
    assert classify_shopper_segment(80.0, 180.0, 4, 0, 1) == "comparison_shoppers"
    # Explorer
    assert classify_shopper_segment(200.0, 250.0, 1, 0, 4) == "explorers"
    # Impulse Buyer
    assert classify_shopper_segment(60.0, 100.0, 1, 0, 1) == "impulse_buyers"


def test_homography_and_kde_heatmaps():
    src_pts = [(0.0, 0.0), (100.0, 0.0), (100.0, 100.0), (0.0, 100.0)]
    dst_pts = [(10.0, 10.0), (90.0, 10.0), (90.0, 90.0), (10.0, 90.0)]

    H = compute_planogram_homography(src_pts, dst_pts)
    assert H is not None
    assert H.shape == (3, 3)

    transformed = transform_coordinates_homography([(50.0, 50.0)], H)
    assert len(transformed) == 1

    # KDE heatmap generation
    points = [(10.0, 20.0), (30.0, 40.0), (50.0, 60.0)]
    kde = generate_gaussian_kde_heatmap(points, grid_width=20, grid_height=20)
    assert kde.shape == (20, 20)

    layers = render_heatmap_layers(points, points, points, points, grid_size=(20, 20))
    assert "store_traffic_layer" in layers
    assert "zone_activity_layer" in layers
    assert "product_gaze_layer" in layers
    assert "shelf_hotspot_layer" in layers


def test_attractiveness_weighted_formula():
    scores = calculate_product_attractiveness_score(
        attention_duration_seconds=30.0,  # 50% max -> norm_A = 50
        interaction_count=10,             # 50% max -> norm_I = 50
        pickup_rate=0.5,                  # 50% max -> norm_P = 50
        purchase_conversion_rate=0.5,     # 50% max -> norm_C = 50
        repeat_engagement_rate=0.5,       # 50% max -> norm_R = 50
    )

    # 0.35(50) + 0.25(50) + 0.20(50) + 0.15(50) + 0.05(50) = 50.0
    assert scores["attractiveness_score"] == 50.0
    assert scores["normalized_attention"] == 50.0


def test_diagnostic_recommendation_rules():
    items = [
        # High attention, low pickup
        {
            "product_sku": "SKU-01",
            "product_name": "Test Product 1",
            "attractiveness_score": 65.0,
            "normalized_attention": 75.0,
            "normalized_pickup": 20.0,
            "normalized_conversion": 15.0,
            "shelf_location": "Shelf A",
        },
        # High score on bottom shelf
        {
            "product_sku": "SKU-02",
            "product_name": "Test Product 2",
            "attractiveness_score": 80.0,
            "normalized_attention": 85.0,
            "normalized_pickup": 75.0,
            "normalized_conversion": 60.0,
            "shelf_location": "Shelf E (Bottom)",
        },
    ]

    recs = evaluate_diagnostic_rules(items)
    assert len(recs) >= 2

    rules_triggered = [r["rule_type"] for r in recs]
    assert "high_attention_low_pickup" in rules_triggered
    assert "eye_level_relocation" in rules_triggered
