"""
test_m3_pipeline.py
-------------------
Automated verification script for Milestone 3 backend algorithms and endpoints.
"""

import sys
import json
import math
from app.core.database import Base, engine, SessionLocal
from app.models.store import Store, Zone, Shelf, Product, ShopperSession, ShopperTrajectory, ProductMetric, Recommendation, MarketingCampaign
from app.ai.behavior_engine import (
    classify_shopper,
    get_segmentation_distribution,
    compute_journey_analytics,
    generate_heatmaps,
    calculate_product_attractiveness,
    generate_recommendations,
)

def run_m3_tests():
    print("==================================================")
    print("RUNNING MILESTONE 3 BACKEND & ALGORITHM VERIFICATION")
    print("==================================================")

    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    # Run main seeding logic if tables empty
    import app.main
    
    db = SessionLocal()
    try:
        # 1. Verify DB Seeding
        stores_cnt = db.query(Store).count()
        zones_cnt = db.query(Zone).count()
        products_cnt = db.query(Product).count()
        sessions_cnt = db.query(ShopperSession).count()
        trajectories_cnt = db.query(ShopperTrajectory).count()
        metrics_cnt = db.query(ProductMetric).count()
        campaigns_cnt = db.query(MarketingCampaign).count()

        print(f"[✓] DB Stores: {stores_cnt}")
        print(f"[✓] DB Zones: {zones_cnt}")
        print(f"[✓] DB Products: {products_cnt}")
        print(f"[✓] DB Shopper Sessions: {sessions_cnt}")
        print(f"[✓] DB Shopper Trajectories: {trajectories_cnt}")
        print(f"[✓] DB Product Metrics: {metrics_cnt}")
        print(f"[✓] DB Marketing Campaigns: {campaigns_cnt}")

        assert sessions_cnt > 0, "Error: ShopperSession table is empty!"
        assert metrics_cnt > 0, "Error: ProductMetric table is empty!"

        # 2. Test Shopper Classifier
        test_session_explorer = {"total_dwell": 35.0, "visited_zones": ["Entrance", "Bakery"], "product_pickups": 0, "purchases": 0}
        test_session_quick = {"total_dwell": 12.0, "visited_zones": ["Beverages"], "product_pickups": 1, "purchases": 1}
        
        seg1 = classify_shopper(test_session_explorer)
        seg2 = classify_shopper(test_session_quick)

        print(f"[✓] Classifier Test Explorer: {seg1}")
        print(f"[✓] Classifier Test Quick Buyer: {seg2}")

        assert seg1 == "Explorer", f"Expected Explorer, got {seg1}"
        assert seg2 == "Quick Buyer", f"Expected Quick Buyer, got {seg2}"

        # 3. Test Segmentation Distribution
        seg_dist = get_segmentation_distribution(db, store_id=1)
        print(f"[✓] Segmentation Distribution:\n{json.dumps(seg_dist, indent=2)}")
        
        assert len(seg_dist) == 5, f"Expected 5 exact shopper segments, got {len(seg_dist)}"
        total_pct = sum(item["percentage"] for item in seg_dist)
        print(f"[✓] Total Segmentation Percentage: {total_pct:.2f}%")
        assert 99.0 <= total_pct <= 101.0, f"Percentages should sum to ~100%, got {total_pct}"

        # 4. Test Journey Analytics
        journey = compute_journey_analytics(db, store_id=1)
        print(f"[✓] Journey Analytics Transitions: {len(journey['transition_probabilities'])} transitions calculated")

        # 5. Test Heatmaps (4 types)
        for h_type in ["traffic", "shelf", "product_attention", "hotspots"]:
            hm = generate_heatmaps(db, store_id=1, heatmap_type=h_type)
            print(f"[✓] Heatmap '{h_type}': {hm['total_points']} points, {len(hm['hot_zones'])} hot zones, {len(hm['cold_zones'])} cold zones")

        # 6. Test Product Attractiveness Scoring Formula
        product_scores = calculate_product_attractiveness(db, store_id=1)
        print(f"[✓] Calculated Attractiveness Scores for {len(product_scores)} products:")
        for ps in product_scores:
            print(f"    - Rank {ps['rank']}: {ps['product_name']} | Score: {ps['attractiveness_score']} | Attn: {ps['attention_duration']}s | Inter: {ps['interaction_frequency']} | Pickup: {ps['pickup_rate']}% | Conv: {ps['conversion_rate']}% | Repeat: {ps['repeat_engagement']}%")

            # Verify exact formula calculation:
            # 0.35 * Attn + 0.25 * Inter + 0.20 * Pickup + 0.15 * Conv + 0.05 * Repeat
            expected_score = round(
                0.35 * ps['attention_duration'] +
                0.25 * ps['interaction_frequency'] +
                0.20 * ps['pickup_rate'] +
                0.15 * ps['conversion_rate'] +
                0.05 * ps['repeat_engagement'],
                2
            )
            assert math.isclose(ps['attractiveness_score'], expected_score, abs_tol=0.05), (
                f"Formula calculation error! Expected {expected_score}, got {ps['attractiveness_score']}"
            )

        # 7. Test Recommendation Engine
        recs = generate_recommendations(db, store_id=1)
        print(f"[✓] Generated {len(recs)} Recommendations:")
        for r in recs:
            print(f"    - Category: {r['category']} | Target: {r['product_or_zone']} | Rec: {r['recommendation']}")

        print("\n==================================================")
        print("ALL MILESTONE 3 BACKEND & ALGORITHM TESTS PASSED!")
        print("==================================================")

    except Exception as e:
        print(f"[X] VERIFICATION ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close()

if __name__ == "__main__":
    run_m3_tests()
