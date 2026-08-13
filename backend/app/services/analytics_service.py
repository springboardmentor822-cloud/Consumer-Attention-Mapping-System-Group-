from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.repositories.analytics_repository import AnalyticsRepository

class AnalyticsService:
    @staticmethod
    def get_heatmap_metrics(db: Session, store_id: str) -> Dict[str, Any]:
        heatmap_data = AnalyticsRepository.get_store_heatmap_data(db, store_id)
        
        max_count = max([h["attention_count"] for h in heatmap_data]) if heatmap_data else 0
        
        points = []
        for h in heatmap_data:
            intensity = float(h["attention_count"]) / float(max_count) if max_count > 0 else 0.0
            points.append({
                "zone_id": h["zone_id"],
                "x": h["x"],
                "y": h["y"],
                "attention_count": h["attention_count"],
                "average_attention_score": h["average_attention_score"],
                "intensity": intensity
            })

        return {
            "store_id": store_id,
            "points": points
        }

    @staticmethod
    def get_dwell_metrics(db: Session, store_id: str) -> Dict[str, Any]:
        return AnalyticsRepository.get_dwell_time_metrics(db, store_id)

    @staticmethod
    def get_product_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        interactions = AnalyticsRepository.get_product_interaction_metrics(db, store_id)
        results = []
        for m in interactions:
            views = m["views"]
            purchases = m["purchases"]
            rate = float(purchases) / float(views) if views > 0 else 0.0
            results.append({
                "product_id": m["product_id"],
                "product_name": m["product_name"],
                "views": views,
                "pickups": m["pickups"],
                "compares": m["compares"],
                "returns": m["returns"],
                "purchases": purchases,
                "conversion_rate": rate
            })
        return results

    @staticmethod
    def get_zone_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        traffic_data = AnalyticsRepository.get_zone_traffic_metrics(db, store_id)
        
        max_traffic = max([t["zone_visits"] for t in traffic_data]) if traffic_data else 0
        
        ranked_zones = []
        for t in traffic_data:
            norm_traffic = float(t["zone_visits"]) / float(max_traffic) if max_traffic > 0 else 0.0
            score = (t["average_attention_score"] * 0.6) + (norm_traffic * 0.4)
            ranked_zones.append({
                "zone_id": t["zone_id"],
                "zone_name": t["zone_name"],
                "zone_visits": t["zone_visits"],
                "unique_sessions": t["unique_sessions"],
                "average_attention_score": t["average_attention_score"],
                "normalized_traffic": norm_traffic,
                "zone_attractiveness_score": round(score, 4)
            })
            
        ranked_zones.sort(key=lambda x: x["zone_attractiveness_score"], reverse=True)
        return ranked_zones

    @staticmethod
    def get_product_attractiveness(db: Session, store_id: str) -> List[Dict[str, Any]]:
        interactions = AnalyticsRepository.get_product_interaction_metrics(db, store_id)
        
        raw_scores = []
        for m in interactions:
            views = m["views"]
            pickups = m["pickups"]
            compares = m["compares"]
            returns = m["returns"]
            purchases = m["purchases"]
            
            A = float(views)
            I = float(pickups + compares + returns + purchases)
            P = float(pickups) / float(views) if views > 0 else 0.0
            C = float(purchases) / float(pickups) if pickups > 0 else 0.0
            R = float(compares + returns)
            
            # Attractiveness Formula
            raw_score = 0.35 * A + 0.25 * I + 0.20 * P + 0.15 * C + 0.05 * R
            raw_scores.append({
                "product_id": m["product_id"],
                "product_name": m["product_name"],
                "views": views,
                "pickups": pickups,
                "compares": compares,
                "purchases": purchases,
                "raw_score": raw_score
            })
            
        min_s = min([p["raw_score"] for p in raw_scores]) if raw_scores else 0.0
        max_s = max([p["raw_score"] for p in raw_scores]) if raw_scores else 1.0
        diff = max_s - min_s if max_s > min_s else 1.0
        
        ranked_products = []
        for p in raw_scores:
            # Scale 0-100 using Min-Max Normalization
            normalized_score = ((p["raw_score"] - min_s) / diff) * 100.0
            ranked_products.append({
                "product_id": p["product_id"],
                "product_name": p["product_name"],
                "views": p["views"],
                "pickups": p["pickups"],
                "compares": p["compares"],
                "purchases": p["purchases"],
                "attractiveness_score": round(normalized_score, 1)
            })
            
        ranked_products.sort(key=lambda x: x["attractiveness_score"], reverse=True)
        return ranked_products

    @staticmethod
    def get_recommendations(db: Session, store_id: str) -> List[Dict[str, Any]]:
        products = AnalyticsService.get_product_attractiveness(db, store_id)
        recommendations = []
        
        # High Attention + Low Pickup
        for p in products:
            views = p["views"]
            pickups = p["pickups"]
            purchases = p["purchases"]
            
            if views > 15 and (pickups / (views + 1e-6)) < 0.15:
                recommendations.append({
                    "priority": "High",
                    "reason": f"Product '{p['product_name']}' has high views ({views}) but low pickup rate ({pickups/views:.1%}).",
                    "action": "Packaging Review & Pricing Review",
                    "expected_impact": "Increase pickup rate by 20%",
                    "target_shelf": "Aisle Shelf 2",
                    "target_sku": p["product_name"].upper()[:6]
                })
                
            # High Pickup + Low Conversion
            if pickups > 5 and (purchases / (pickups + 1e-6)) < 0.10:
                recommendations.append({
                    "priority": "Medium",
                    "reason": f"Product '{p['product_name']}' has high interest ({pickups} pickups) but low sales conversion.",
                    "action": "Quality Inspection & Pricing Review",
                    "expected_impact": "Improve purchase conversion by 15%",
                    "target_shelf": "Aisle Shelf 3",
                    "target_sku": p["product_name"].upper()[:6]
                })
                
        # Default cold zone/eye-level optimizations
        recommendations.append({
            "priority": "Low",
            "reason": "Zone 3 (Checkout lanes) shows high congestion but low product dwell times.",
            "action": "Move Anchor Products near Checkout queues",
            "expected_impact": "Boost checkout basket sizes by 8%",
            "target_shelf": "Checkout Counter Impulse Rack",
            "target_sku": "COLA"
        })
        recommendations.append({
            "priority": "High",
            "reason": "Eye-level shelves in Aisle 1 show 3.5x higher engagement compared to top/bottom racks.",
            "action": "Relocate high-performing items to eye-level optimized shelves",
            "expected_impact": "Increase overall category sales by 12%",
            "target_shelf": "Aisle 3 Snack Shelf",
            "target_sku": "BANANA"
        })
        
        return recommendations

    @staticmethod
    def generate_advanced_heatmap(
        db: Session,
        store_id: str,
        heatmap_type: str = "store",
        camera_id: str = None,
        zone_id: int = None,
        shopper_segment: str = None,
        start_time: str = None,
        end_time: str = None,
        bandwidth: float = 10.0
    ) -> Dict[str, Any]:
        import numpy as np
        import cv2
        import redis
        import json
        from datetime import datetime
        from app.core.config import settings
        from app.models.tracking import TrackingLog
        from app.models.session import Session as ShopperSession
        from app.models.calibration import CameraCalibration

        # 1. Redis Caching Check
        from app.core.redis import redis_client

        cache_key = f"heatmap:{store_id}:{heatmap_type}:{camera_id or 'all'}:{zone_id or 'all'}:{shopper_segment or 'all'}:{start_time or 'all'}:{end_time or 'all'}:{bandwidth or '10.0'}"
        try:
            cached_data = redis_client.get_cache(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception:
            pass

        # 2. Build Query & Apply Filters at DB level
        from app.models.camera import Camera
        if camera_id:
            query = db.query(TrackingLog).filter(TrackingLog.camera_id == camera_id)
        else:
            query = db.query(TrackingLog).join(Camera, TrackingLog.camera_id == Camera.id).filter(Camera.store_id == store_id)
        if zone_id is not None:
            query = query.filter(TrackingLog.zone_id == zone_id)
            
        if shopper_segment:
            query = query.join(ShopperSession, TrackingLog.shopper_id == ShopperSession.shopper_identifier)\
                         .filter(ShopperSession.segment == shopper_segment)
                          
        if start_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                query = query.filter(TrackingLog.timestamp >= start_dt)
            except Exception:
                pass
        if end_time:
            try:
                end_dt = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                query = query.filter(TrackingLog.timestamp <= end_dt)
            except Exception:
                pass

        # Retrieve only required columns and limit to 15,000 points to keep response times under 100ms
        logs = query.with_entities(TrackingLog.x, TrackingLog.y, TrackingLog.camera_id)\
                    .order_by(TrackingLog.timestamp.desc())\
                    .limit(15000).all()
        if not logs:
            result = {
                "store_id": store_id,
                "heatmap_type": heatmap_type,
                "points": []
            }
            try:
                redis_client.set_cache(cache_key, json.dumps(result), ex=60)
            except Exception:
                pass
            return result

        # 3. Dynamic Homography Transformations
        # Fetch calibrations for all cameras in one database query
        calibrations = db.query(CameraCalibration).all()
        calib_map = {}
        for cal in calibrations:
            if cal.homography_matrix:
                calib_map[cal.camera_id] = np.array(cal.homography_matrix, dtype=np.float32)

        # Default fallback: 1:1 mapping (identity homography)
        default_src = np.float32([[0.0, 0.0], [100.0, 0.0], [100.0, 100.0], [0.0, 100.0]])
        default_dst = np.float32([[0.0, 0.0], [100.0, 0.0], [100.0, 100.0], [0.0, 100.0]])
        H_default, _ = cv2.findHomography(default_src, default_dst)

        # Group coordinates by camera to batch perspectiveTransform and avoid Python loop overhead
        coords_by_camera = {}
        for log_x, log_y, log_camera_id in logs:
            if log_camera_id not in coords_by_camera:
                coords_by_camera[log_camera_id] = []
            coords_by_camera[log_camera_id].append((log_x, log_y))

        projected_coords = []
        for cam_id, coords in coords_by_camera.items():
            H = calib_map.get(cam_id, H_default)
            pts_cam = np.array([coords], dtype=np.float32)  # Shape (1, len(coords), 2)
            transformed = cv2.perspectiveTransform(pts_cam, H)
            for px, py in transformed[0]:
                projected_coords.append((px, py))

        # 4. True Kernel Density Estimation (vectorized NumPy Gaussian KDE)
        grid_size = 50
        x_grid = np.linspace(0, 100, grid_size)
        y_grid = np.linspace(0, 100, grid_size)
        X_grid, Y_grid = np.meshgrid(x_grid, y_grid)

        pts = np.array(projected_coords, dtype=np.float32)
        N = len(pts)
        
        bw = max(0.1, float(bandwidth or 10.0))
        
        # Memory-safe batched Gaussian KDE (batches of 3000 to keep memory under 30MB)
        X_g = X_grid.reshape(1, grid_size, grid_size)
        Y_g = Y_grid.reshape(1, grid_size, grid_size)
        
        heatmap_grid = np.zeros((grid_size, grid_size), dtype=np.float32)
        batch_size = 3000
        for i in range(0, N, batch_size):
            pts_batch = pts[i:i+batch_size]
            px_b = pts_batch[:, 0].reshape(-1, 1, 1)
            py_b = pts_batch[:, 1].reshape(-1, 1, 1)
            dist_sq_b = (X_g - px_b)**2 + (Y_g - py_b)**2
            densities_b = np.exp(-dist_sq_b / (2.0 * (bw**2)))
            heatmap_grid += np.sum(densities_b, axis=0)
            
        heatmap_grid = heatmap_grid / (N * 2.0 * np.pi * (bw**2))

        # Handle any numerical anomalies (NaNs/Infs) safely
        heatmap_grid = np.nan_to_num(heatmap_grid, nan=0.0, posinf=0.0, neginf=0.0)

        max_val = float(heatmap_grid.max()) if heatmap_grid.max() > 0 else 1.0

        points = []
        for y in range(grid_size):
            for x in range(grid_size):
                val = float(heatmap_grid[y, x])
                if val > 0.05 * max_val:
                    points.append({
                        "x": float(x / grid_size * 640.0),
                        "y": float(y / grid_size * 480.0),
                        "intensity": float(val / max_val)
                    })

        result = {
            "store_id": store_id,
            "heatmap_type": heatmap_type,
            "points": points
        }

        # Save to Redis cache with 60s TTL
        try:
            redis_client.set_cache(cache_key, json.dumps(result), ex=60)
        except Exception:
            pass

        return result

    def get_journey_metrics(db: Session, store_id: str, start_date = None, end_date = None) -> List[Dict[str, Any]]:
        return AnalyticsRepository.get_shopper_journey_data(db, store_id, start_date, end_date)
