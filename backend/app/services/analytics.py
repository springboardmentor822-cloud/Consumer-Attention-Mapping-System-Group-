import datetime
from typing import Any, Dict, List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np
import scipy.stats as st

from backend.app.models.tracking import CoordinateLog, ShopperSession, AttentionEvent, InteractionEvent
from backend.app.models.product import Product
from backend.app.models.shelf import Shelf
from backend.app.models.zone import Zone


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_kpis(self, store_id: UUID) -> Dict[str, Any]:
        """Calculates Top KPI Cards: Total Foot Traffic, Average Dwell Time, Top Attractiveness Product."""
        # Total foot traffic: count of unique shopper sessions today (simulated to last 24h)
        last_24h = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
        
        foot_traffic = self.db.query(func.count(ShopperSession.id)).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.start_time >= last_24h
        ).scalar() or 0
        
        # Average dwell time (in seconds)
        avg_dwell_query = self.db.query(
            func.avg(
                func.extract('epoch', ShopperSession.end_time) - func.extract('epoch', ShopperSession.start_time)
            )
        ).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.end_time.isnot(None),
            ShopperSession.start_time >= last_24h
        ).scalar()
        
        avg_dwell = round(float(avg_dwell_query or 0), 2)

        # Get top product
        scores = self.calculate_product_attractiveness(store_id)
        top_product = None
        if scores:
            top_product = max(scores, key=lambda x: x["score"])

        return {
            "total_foot_traffic": foot_traffic,
            "average_dwell_time_seconds": avg_dwell,
            "top_product": top_product["product_name"] if top_product else "N/A"
        }

    def generate_heatmap_data(self, store_id: UUID, time_range_hours: int = 24) -> Dict[str, Any]:
        """
        Generates 2D KDE density matrix for heatmaps.
        Returns a normalized grid of points to be rendered on the frontend.
        """
        start_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=time_range_hours)
        logs = self.db.query(CoordinateLog.x, CoordinateLog.y).filter(
            CoordinateLog.store_id == store_id,
            CoordinateLog.timestamp >= start_time
        ).all()

        if not logs or len(logs) < 5:
            return {"points": [], "max_val": 1}

        x = np.array([log.x for log in logs])
        y = np.array([log.y for log in logs])

        # Filter out out-of-bounds (assuming 0-100 scale for simplicity)
        valid_idx = (x >= 0) & (x <= 100) & (y >= 0) & (y <= 100)
        x = x[valid_idx]
        y = y[valid_idx]

        if len(x) < 5:
            return {"points": [], "max_val": 1}

        # Perform 2D KDE
        try:
            # We evaluate on a 50x50 grid
            grid_x, grid_y = np.mgrid[0:100:50j, 0:100:50j]
            positions = np.vstack([grid_x.ravel(), grid_y.ravel()])
            values = np.vstack([x, y])
            kernel = st.gaussian_kde(values)
            f = np.reshape(kernel(positions).T, grid_x.shape)
            
            # Normalize
            f_norm = (f - f.min()) / (f.max() - f.min()) if f.max() > f.min() else f
            
            # Extract high density points for simpleheat format [x, y, value]
            heatmap_points = []
            for i in range(grid_x.shape[0]):
                for j in range(grid_x.shape[1]):
                    if f_norm[i, j] > 0.05: # threshold to keep payload small
                        heatmap_points.append([
                            float(grid_x[i, j]),
                            float(grid_y[i, j]),
                            float(f_norm[i, j])
                        ])
            
            return {
                "points": heatmap_points,
                "max_val": 1.0
            }
        except Exception as e:
            # Fallback to simple points if KDE fails (e.g. singular matrix)
            points = [[float(log.x), float(log.y), 1.0] for log in logs[-100:]] # Max 100 points
            return {"points": points, "max_val": 1.0}

    def calculate_product_attractiveness(self, store_id: UUID) -> List[Dict[str, Any]]:
        """
        Calculates attractiveness score for products.
        Score = w1*(Traffic/Views) + w2*(Dwell Time) + w3*(Interaction Count) - w4*(Stockout Rate)
        """
        w1, w2, w3, w4 = 0.3, 0.3, 0.4, 0.5
        
        products = self.db.query(Product).join(Shelf).filter(Shelf.store_id == store_id).all()
        
        results = []
        for prod in products:
            # Get interaction count
            interactions = self.db.query(func.count(InteractionEvent.id)).filter(
                InteractionEvent.product_id == prod.id
            ).scalar() or 0
            
            # Get attention gaze duration (dwell time proxy)
            gaze_dur = self.db.query(func.sum(AttentionEvent.gaze_duration_seconds)).filter(
                AttentionEvent.target_type == "PRODUCT",
                AttentionEvent.target_id == prod.id
            ).scalar() or 0.0

            # Traffic count (proxy: number of attention events)
            traffic = self.db.query(func.count(AttentionEvent.id)).filter(
                AttentionEvent.target_type == "PRODUCT",
                AttentionEvent.target_id == prod.id
            ).scalar() or 0

            # Simulate stockout rate (0.0 to 0.2) or fetch from DB if added
            # For now, using a mock value based on hash of ID to be deterministic
            stockout_rate = (hash(str(prod.id)) % 20) / 100.0

            score = (w1 * traffic) + (w2 * gaze_dur) + (w3 * interactions) - (w4 * stockout_rate * 100)
            
            results.append({
                "product_id": str(prod.id),
                "product_name": prod.product_name,
                "score": max(0, round(score, 2)),
                "metrics": {
                    "traffic": traffic,
                    "dwell": gaze_dur,
                    "interactions": interactions,
                    "stockout": stockout_rate
                }
            })
            
        return sorted(results, key=lambda x: x["score"], reverse=True)

    def generate_recommendations(self, store_id: UUID) -> List[Dict[str, str]]:
        """
        Rule-Based Engine for Optimization Recommendations.
        """
        scores = self.calculate_product_attractiveness(store_id)
        recommendations = []
        
        for p in scores:
            metrics = p["metrics"]
            
            # Rule 1: High Traffic + Low Dwell -> Improve visual merchandising
            if metrics["traffic"] > 10 and metrics["dwell"] < 5:
                recommendations.append({
                    "type": "warning",
                    "title": "Low Engagement",
                    "description": f"{p['product_name']} has high traffic but low dwell time. Improve visual merchandising or pricing sign."
                })
                
            # Rule 2: High Dwell + Low Interaction/Sales -> Check pricing/availability
            if metrics["dwell"] > 20 and metrics["interactions"] < 2:
                recommendations.append({
                    "type": "alert",
                    "title": "Conversion Issue",
                    "description": f"{p['product_name']} gets high attention but few interactions. Check pricing or stock availability."
                })
                
        # Rule 3: Dead Zones (simulated globally)
        recommendations.append({
            "type": "info",
            "title": "Dead Zone Detected",
            "description": "Low foot traffic in Aisle 2. Reposition high-demand anchor products to direct traffic there."
        })
        
        return recommendations[:5] # Return top 5 recommendations
