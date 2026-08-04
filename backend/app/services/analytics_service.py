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
        
        ranked_products = []
        for m in interactions:
            score = (m["views"] * 0.2) + (m["pickups"] * 0.3) + (m["compares"] * 0.2) + (m["purchases"] * 0.3)
            ranked_products.append({
                "product_id": m["product_id"],
                "product_name": m["product_name"],
                "views": m["views"],
                "pickups": m["pickups"],
                "compares": m["compares"],
                "purchases": m["purchases"],
                "attractiveness_score": round(score, 4)
            })
            
        ranked_products.sort(key=lambda x: x["attractiveness_score"], reverse=True)
        return ranked_products

    @staticmethod
    def get_journey_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        return AnalyticsRepository.get_shopper_journey_data(db, store_id)
