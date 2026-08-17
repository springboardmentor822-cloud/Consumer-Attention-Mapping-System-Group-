import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing DB connection...")
    from database import execute_query
    res = execute_query("SELECT COUNT(*) FROM products;")
    print(f"Products in DB: {res[0]['count'] if res else 0}")
    
    print("\nTesting Attractiveness Engine...")
    from attractiveness_engine import attractiveness_engine
    scores = attractiveness_engine.compute_sku_scores()
    print(f"Computed attractiveness for {len(scores)} products.")
    if scores:
        print(f"Top product: {scores[0]['name']} with score {scores[0]['score']}")
        
    print("\nTesting Recommendation Engine...")
    from recommendation_engine import recommendation_engine
    recs = recommendation_engine.generate_recommendations(scores)
    print(f"Generated {len(recs)} merchandising recommendations.")
    if recs:
        print(f"Sample Rec: {recs[0]['rule']} - {recs[0]['recommendation']}")
        
    print("\nTesting Heatmap Engine...")
    from heatmap_engine import heatmap_engine
    hdata = heatmap_engine.get_heatmap_layer("Store Traffic", "Last 7 Days")
    print(f"Heatmap status: {hdata['status']}")
    print(f"Hotspots count: {len(hdata['hotspots'])}")
    
    print("\nTesting Behavior Journey Analytics...")
    from main import get_behavior_journey_analytics
    journey = get_behavior_journey_analytics("Last 7 Days")
    print(f"Common paths count: {len(journey['common_paths'])}")
    print(f"Segments count: {len(journey['segmentation'])}")
    
    print("\nALL ENGINE INTEGRATION CHECKS PASSED!")
except Exception as e:
    print(f"INTEGRATION CHECK FAILED: {e}")
    sys.exit(1)
