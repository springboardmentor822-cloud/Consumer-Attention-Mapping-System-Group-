import random
from typing import Dict, List, Any
from .kalman_filter import KalmanTrajectoryFilter
from .segmentation_service import ShopperSegmentationEngine
from .heatmap_engine import HomographyHeatmapEngine
from .attractiveness_service import AttractivenessScoringEngine
from .optimization_engine import MerchandisingOptimizationEngine

class BehaviorService:
    heatmap_engine = HomographyHeatmapEngine()
    segmentation_engine = ShopperSegmentationEngine()

    @classmethod
    def get_product_attractiveness_scores(cls) -> List[Dict[str, Any]]:
        raw_products = [
            {"sku": "SKU-1001", "name": "Organic Berry Energy Can", "category": "Beverages", "shelf": "Shelf A (Promotional)", "shelf_tier": "Promotional Endcap", "raw_attention": 92.5, "raw_interaction": 85.0, "raw_pickup_rate": 0.78, "raw_conversion_rate": 0.65, "raw_repeat_rate": 0.45},
            {"sku": "SKU-1002", "name": "Cold Brew Mocha 330ml", "category": "Beverages", "shelf": "Shelf C (Refrigerated)", "shelf_tier": "Eye Level", "raw_attention": 88.0, "raw_interaction": 82.0, "raw_pickup_rate": 0.74, "raw_conversion_rate": 0.70, "raw_repeat_rate": 0.50},
            {"sku": "SKU-1003", "name": "Artisanal Sea Salt Almonds", "category": "Snacks", "shelf": "Shelf B (Eye Level)", "shelf_tier": "Eye Level", "raw_attention": 81.0, "raw_interaction": 75.0, "raw_pickup_rate": 0.68, "raw_conversion_rate": 0.60, "raw_repeat_rate": 0.40},
            {"sku": "SKU-1004", "name": "Gluten-Free Oats Bar", "category": "Snacks", "shelf": "Shelf B (Eye Level)", "shelf_tier": "Eye Level", "raw_attention": 74.0, "raw_interaction": 69.0, "raw_pickup_rate": 0.60, "raw_conversion_rate": 0.55, "raw_repeat_rate": 0.35},
            {"sku": "SKU-1005", "name": "Sparkling Citrus Water", "category": "Beverages", "shelf": "Shelf A (Bottom)", "shelf_tier": "Bottom Shelf", "raw_attention": 62.0, "raw_interaction": 55.0, "raw_pickup_rate": 0.48, "raw_conversion_rate": 0.42, "raw_repeat_rate": 0.30},
            {"sku": "SKU-1006", "name": "Dark Chocolate Granola", "category": "Cereal", "shelf": "Shelf D (Top)", "shelf_tier": "Top Shelf", "raw_attention": 58.0, "raw_interaction": 50.0, "raw_pickup_rate": 0.42, "raw_conversion_rate": 0.38, "raw_repeat_rate": 0.25},
            {"sku": "SKU-1007", "name": "Zero-Sugar Diet Soda", "category": "Beverages", "shelf": "Shelf C (Bottom)", "shelf_tier": "Bottom Shelf", "raw_attention": 85.0, "raw_interaction": 40.0, "raw_pickup_rate": 0.22, "raw_conversion_rate": 0.20, "raw_repeat_rate": 0.15},
            {"sku": "SKU-1008", "name": "Salted Wheat Pretzels", "category": "Snacks", "shelf": "Shelf B (Bottom)", "shelf_tier": "Bottom Shelf", "raw_attention": 38.0, "raw_interaction": 30.0, "raw_pickup_rate": 0.22, "raw_conversion_rate": 0.18, "raw_repeat_rate": 0.12},
        ]
        return AttractivenessScoringEngine.calculate_category_scores(raw_products)

    @classmethod
    def get_consumer_segments(cls) -> List[Dict[str, Any]]:
        return [
            {
                "segment": "Explorers",
                "share_pct": 35.0,
                "count": 142,
                "avg_dwell_sec": 145,
                "avg_basket_items": 4.2,
                "conversion_rate": "42%",
                "description": "High total path distance, high dwell time across multiple zones, low pickup frequency."
            },
            {
                "segment": "Quick Buyers",
                "share_pct": 25.0,
                "count": 101,
                "avg_dwell_sec": 38,
                "avg_basket_items": 1.8,
                "conversion_rate": "78%",
                "description": "Low dwell time, direct path trajectory to a single zone, immediate product pickup and checkout."
            },
            {
                "segment": "Comparison Shoppers",
                "share_pct": 20.0,
                "count": 81,
                "avg_dwell_sec": 190,
                "avg_basket_items": 3.1,
                "conversion_rate": "55%",
                "description": "Extended dwell time at a single shelf, high product pickup and return events."
            },
            {
                "segment": "Impulse Buyers",
                "share_pct": 12.0,
                "count": 48,
                "avg_dwell_sec": 52,
                "avg_basket_items": 2.5,
                "conversion_rate": "65%",
                "description": "Moderate path length, short view duration followed by immediate pickup."
            },
            {
                "segment": "Brand Loyal Customers",
                "share_pct": 8.0,
                "count": 33,
                "avg_dwell_sec": 45,
                "avg_basket_items": 5.0,
                "conversion_rate": "92%",
                "description": "Targeted navigation to specific brand zones with high purchase conversion."
            }
        ]

    @classmethod
    def get_store_heatmap(cls, store_id: int) -> Dict[str, Any]:
        return cls.heatmap_engine.get_multi_layer_heatmaps(store_id)

    @classmethod
    def get_recommendations(cls) -> List[Dict[str, Any]]:
        scored = cls.get_product_attractiveness_scores()
        return MerchandisingOptimizationEngine.evaluate_product_optimizations(scored)

    @classmethod
    def get_active_alerts(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": "ALT-101",
                "severity": "WARNING",
                "category": "Traffic Bottleneck",
                "title": "Checkout Queue Congestion",
                "message": "4 shoppers currently waiting in checkout queue exceeding optimal dwell limit.",
                "zone": "Checkout Lanes",
                "timestamp": "2 mins ago"
            },
            {
                "id": "ALT-102",
                "severity": "INFO",
                "category": "Shelf Performance",
                "title": "High Product Engagement Hotspot",
                "message": "Organic Energy Can on Shelf A reached 92.5 Attractiveness Score.",
                "zone": "Promotional Bay",
                "timestamp": "12 mins ago"
            },
            {
                "id": "ALT-103",
                "severity": "SUCCESS",
                "category": "Camera Health",
                "title": "All 4 AI Cameras Operational",
                "message": "100% frame ingestion rate across Zone 1, 2, 3 and Checkout.",
                "zone": "Store-wide",
                "timestamp": "Real-time"
            }
        ]
