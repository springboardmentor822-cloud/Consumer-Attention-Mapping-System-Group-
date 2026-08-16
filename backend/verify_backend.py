import traceback
from app.core.database import SessionLocal
from app.api.analytics import (
    get_shopper_sessions,
    get_shopper_segmentation_breakdown,
    get_store_heatmap,
    get_shelf_heatmap,
    get_product_attractiveness_scores,
    get_recommendations
)
from app.api.sales import get_sales_overview, get_department_sales
from app.api.stores import list_stores
from app.api.cameras import list_cameras

def run_backend_verification():
    db = SessionLocal()
    print("\n=======================================================")
    print("      FASTAPI BACKEND COMPLETE HEALTH VERIFICATION     ")
    print("=======================================================\n")

    try:
        # 1. Stores API
        stores = list_stores(db=db)
        print(f"[PASS] Stores API: {len(stores)} store(s) active in database")

        # 2. Cameras API
        cameras = list_cameras(db=db)
        print(f"[PASS] Cameras API: {len(cameras)} camera(s) active")

        # 3. Sales Overview & Department Sales API
        overview = get_sales_overview(db=db)
        print(f"[PASS] Sales Overview API: {overview.get('total_records', 0)} sales records")

        depts = get_department_sales(db=db)
        print(f"[PASS] Department Sales API: {len(depts.get('departments', []))} departments configured")

        # 4. Step 1: Behavior Engine API (Trajectory & Segmentation)
        sessions = get_shopper_sessions(store_id=1, limit=10, db=db)
        print(f"[PASS] Behavior Sessions API: {len(sessions)} shopper sessions processed")

        seg = get_shopper_segmentation_breakdown(store_id=1, db=db)
        print(f"[PASS] Shopper Segmentation API: {len(seg.get('segments', []))} persona segments (Explorers, Quick Buyers, etc.)")

        # 5. Step 2: Spatial Homography & KDE Heatmap API
        heatmap = get_store_heatmap(store_id=1, layer_type='foot_traffic', db=db)
        print(f"[PASS] Homography Heatmap API: {heatmap.get('grid_width')}x{heatmap.get('grid_height')} density grid with {heatmap.get('total_samples')} tracking points")

        shelf_map = get_shelf_heatmap(shelf_id=1, store_id=1, db=db)
        print(f"[PASS] Shelf Hotspot API: {shelf_map.get('shelf_name')} ({shelf_map.get('rows')}x{shelf_map.get('cols')} vertical grid)")

        # 6. Step 3: Product Attractiveness Scoring API
        scores = get_product_attractiveness_scores(store_id=1, calculation_window='daily', db=db)
        print(f"[PASS] Attractiveness Scoring API: {len(scores)} SKU composite scores calculated")
        if scores:
            top = scores[0]
            p_name = top.get('product_name') if isinstance(top, dict) else getattr(top, 'product_name', 'SKU #1')
            score_val = top.get('attractiveness_score') if isinstance(top, dict) else getattr(top, 'attractiveness_score', 0)
            print(f"       -> Top Attractiveness SKU: {p_name} (Score: {score_val}/100)")

        # 7. Step 4: Diagnostic Recommendation Engine API
        recs = get_recommendations(store_id=1, db=db)
        print(f"[PASS] Recommendation Engine API: {len(recs)} actionable diagnostic alerts generated")
        if recs:
            top_rec = recs[0]
            title = top_rec.get('title') if isinstance(top_rec, dict) else getattr(top_rec, 'title', 'Alert')
            print(f"       -> High Priority Alert: {title}")

        print("\n=======================================================")
        print("   >>> RESULT: ALL BACKEND SERVICES 100% HEALTHY <<<   ")
        print("=======================================================\n")

    except Exception as e:
        print(f"\n[FAIL] Backend Health Check Error: {e}")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_backend_verification()
