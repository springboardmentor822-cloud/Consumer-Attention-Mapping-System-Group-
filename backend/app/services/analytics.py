import datetime
from typing import Any, Dict, List, Tuple
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import numpy as np
import scipy.stats as st

from backend.app.models.tracking import CoordinateLog, ShopperSession, AttentionEvent, InteractionEvent
from backend.app.models.product import Product
from backend.app.models.shelf import Shelf
from backend.app.models.zone import Zone
from backend.app.models.product_score import ProductScore
from backend.app.models.heatmap import HeatmapResult


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_kpis(self, store_id: UUID) -> Dict[str, Any]:
        """Calculates Top KPI Cards: Total Foot Traffic, Average Dwell Time, Top Attractiveness Product."""
        last_30d = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)

        foot_traffic = self.db.query(func.count(ShopperSession.id)).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.start_time >= last_30d
        ).scalar() or 0

        avg_dwell_query = self.db.query(
            func.avg(
                func.extract('epoch', ShopperSession.end_time) - func.extract('epoch', ShopperSession.start_time)
            )
        ).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.end_time.isnot(None),
            ShopperSession.start_time >= last_30d
        ).scalar()

        avg_dwell = round(float(avg_dwell_query or 0), 2)

        # Get top product from stored scores
        top_score = self.db.query(ProductScore).filter(
            ProductScore.store_id == store_id
        ).order_by(ProductScore.attractiveness_score.desc()).first()

        top_product_name = "N/A"
        if top_score:
            product = self.db.get(Product, top_score.product_id)
            if product:
                top_product_name = product.product_name

        # Additional KPIs
        total_interactions = self.db.query(func.count(InteractionEvent.id)).join(
            ShopperSession, InteractionEvent.session_id == ShopperSession.id
        ).filter(
            ShopperSession.store_id == store_id,
            InteractionEvent.timestamp >= last_30d
        ).scalar() or 0

        purchases = self.db.query(func.count(InteractionEvent.id)).join(
            ShopperSession, InteractionEvent.session_id == ShopperSession.id
        ).filter(
            ShopperSession.store_id == store_id,
            InteractionEvent.interaction_type == "PURCHASED",
            InteractionEvent.timestamp >= last_30d
        ).scalar() or 0

        conversion_rate = round((purchases / foot_traffic * 100), 1) if foot_traffic > 0 else 0

        return {
            "total_foot_traffic": foot_traffic,
            "average_dwell_time_seconds": avg_dwell,
            "top_product": top_product_name,
            "total_interactions": total_interactions,
            "total_purchases": purchases,
            "conversion_rate": conversion_rate,
        }

    def generate_heatmap_data(self, store_id: UUID, time_range_hours: int = 24) -> Dict[str, Any]:
        """Generates 2D KDE density matrix for heatmaps."""
        start_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=time_range_hours)
        logs = self.db.query(CoordinateLog.x, CoordinateLog.y).filter(
            CoordinateLog.store_id == store_id,
            CoordinateLog.timestamp >= start_time
        ).all()

        if not logs or len(logs) < 5:
            return {"points": [], "max_val": 1}

        x = np.array([log.x for log in logs])
        y = np.array([log.y for log in logs])

        valid_idx = (x >= 0) & (x <= 100) & (y >= 0) & (y <= 100)
        x = x[valid_idx]
        y = y[valid_idx]

        if len(x) < 5:
            return {"points": [], "max_val": 1}

        try:
            grid_x, grid_y = np.mgrid[0:100:50j, 0:100:50j]
            positions = np.vstack([grid_x.ravel(), grid_y.ravel()])
            values = np.vstack([x, y])
            kernel = st.gaussian_kde(values)
            f = np.reshape(kernel(positions).T, grid_x.shape)

            f_norm = (f - f.min()) / (f.max() - f.min()) if f.max() > f.min() else f

            heatmap_points = []
            for i in range(grid_x.shape[0]):
                for j in range(grid_x.shape[1]):
                    if f_norm[i, j] > 0.05:
                        heatmap_points.append([
                            float(grid_x[i, j]),
                            float(grid_y[i, j]),
                            float(f_norm[i, j])
                        ])

            return {"points": heatmap_points, "max_val": 1.0}
        except Exception:
            points = [[float(log.x), float(log.y), 1.0] for log in logs[-100:]]
            return {"points": points, "max_val": 1.0}

    def calculate_product_attractiveness(self, store_id: UUID) -> List[Dict[str, Any]]:
        """
        Product Attractiveness Score using spec formula:
        0.35 * Attention Duration + 0.25 * Interaction Frequency +
        0.20 * Pickup Rate + 0.15 * Conversion Rate + 0.05 * Repeat Engagement
        All normalized to 0-100.
        """
        products = self.db.query(Product).join(Shelf).filter(Shelf.store_id == store_id).all()
        if not products:
            return []

        raw_metrics = []
        for prod in products:
            # Attention Duration (sum of gaze seconds)
            attention_dur = self.db.query(func.sum(AttentionEvent.gaze_duration_seconds)).filter(
                AttentionEvent.target_type == "PRODUCT",
                AttentionEvent.target_id == prod.id
            ).scalar() or 0.0

            # Interaction Frequency
            interaction_freq = self.db.query(func.count(InteractionEvent.id)).filter(
                InteractionEvent.product_id == prod.id
            ).scalar() or 0

            # Pickup count
            pickup_count = self.db.query(func.count(InteractionEvent.id)).filter(
                InteractionEvent.product_id == prod.id,
                InteractionEvent.interaction_type == "PICKED_UP"
            ).scalar() or 0

            # Purchase count
            purchase_count = self.db.query(func.count(InteractionEvent.id)).filter(
                InteractionEvent.product_id == prod.id,
                InteractionEvent.interaction_type == "PURCHASED"
            ).scalar() or 0

            # Repeat engagement (multiple attention events)
            repeat_eng = self.db.query(func.count(AttentionEvent.id)).filter(
                AttentionEvent.target_type == "PRODUCT",
                AttentionEvent.target_id == prod.id
            ).scalar() or 0

            raw_metrics.append({
                "product": prod,
                "attention_duration": float(attention_dur),
                "interaction_frequency": interaction_freq,
                "pickup_rate": pickup_count,
                "conversion_rate": purchase_count,
                "repeat_engagement": repeat_eng,
            })

        # Normalize each metric to 0-100
        def normalize(values):
            min_v, max_v = min(values), max(values)
            if max_v == min_v:
                return [50.0] * len(values)
            return [((v - min_v) / (max_v - min_v)) * 100 for v in values]

        attention_vals = normalize([m["attention_duration"] for m in raw_metrics])
        interaction_vals = normalize([m["interaction_frequency"] for m in raw_metrics])
        pickup_vals = normalize([m["pickup_rate"] for m in raw_metrics])
        conversion_vals = normalize([m["conversion_rate"] for m in raw_metrics])
        repeat_vals = normalize([m["repeat_engagement"] for m in raw_metrics])

        results = []
        for i, m in enumerate(raw_metrics):
            score = (
                0.35 * attention_vals[i] +
                0.25 * interaction_vals[i] +
                0.20 * pickup_vals[i] +
                0.15 * conversion_vals[i] +
                0.05 * repeat_vals[i]
            )
            results.append({
                "product_id": str(m["product"].id),
                "product_name": m["product"].product_name,
                "score": round(score, 1),
                "metrics": {
                    "attention_duration": round(attention_vals[i], 1),
                    "interaction_frequency": round(interaction_vals[i], 1),
                    "pickup_rate": round(pickup_vals[i], 1),
                    "conversion_rate": round(conversion_vals[i], 1),
                    "repeat_engagement": round(repeat_vals[i], 1),
                },
                "raw_metrics": {
                    "attention_duration": m["attention_duration"],
                    "interaction_frequency": m["interaction_frequency"],
                    "pickup_count": m["pickup_rate"],
                    "purchase_count": m["conversion_rate"],
                    "repeat_views": m["repeat_engagement"],
                }
            })

        return sorted(results, key=lambda x: x["score"], reverse=True)

    def get_dwell_time_analytics(self, store_id: UUID) -> Dict[str, Any]:
        """Dwell time breakdown by hour and zone."""
        last_30d = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)

        # Dwell by hour
        hourly = self.db.query(
            extract('hour', ShopperSession.start_time).label('hour'),
            func.avg(
                func.extract('epoch', ShopperSession.end_time) - func.extract('epoch', ShopperSession.start_time)
            ).label('avg_dwell')
        ).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.end_time.isnot(None),
            ShopperSession.start_time >= last_30d
        ).group_by('hour').order_by('hour').all()

        hours = [int(h.hour) for h in hourly] if hourly else list(range(8, 22))
        dwell_values = [round(float(h.avg_dwell or 0), 1) for h in hourly] if hourly else [0] * 14

        # Dwell distribution
        dwell_list = self.db.query(
            func.extract('epoch', ShopperSession.end_time) - func.extract('epoch', ShopperSession.start_time)
        ).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.end_time.isnot(None),
            ShopperSession.start_time >= last_30d
        ).all()

        dwell_distribution = [round(float(d[0]), 1) for d in dwell_list if d[0] and d[0] > 0]

        return {
            "hourly": {"hours": hours, "values": dwell_values},
            "distribution": dwell_distribution[:200],
        }

    def get_traffic_flow(self, store_id: UUID) -> Dict[str, Any]:
        """Hourly and daily traffic flow data."""
        last_30d = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)

        # Hourly visitor count
        hourly = self.db.query(
            extract('hour', ShopperSession.start_time).label('hour'),
            func.count(ShopperSession.id).label('visitors')
        ).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.start_time >= last_30d
        ).group_by('hour').order_by('hour').all()

        hours = [int(h.hour) for h in hourly] if hourly else list(range(8, 22))
        visitor_counts = [int(h.visitors) for h in hourly] if hourly else [0] * 14

        # Daily visitor count
        daily = self.db.query(
            func.date(ShopperSession.start_time).label('day'),
            func.count(ShopperSession.id).label('visitors')
        ).filter(
            ShopperSession.store_id == store_id,
            ShopperSession.start_time >= last_30d
        ).group_by('day').order_by('day').all()

        days = [str(d.day) for d in daily] if daily else []
        daily_counts = [int(d.visitors) for d in daily] if daily else []

        return {
            "hourly": {"hours": hours, "values": visitor_counts},
            "daily": {"days": days, "values": daily_counts},
        }

    def generate_recommendations(self, store_id: UUID) -> List[Dict[str, str]]:
        """Rule-Based Engine for Optimization Recommendations."""
        scores = self.calculate_product_attractiveness(store_id)
        recommendations = []

        for p in scores:
            raw = p.get("raw_metrics", {})

            # Rule 1: High Traffic + Low Dwell
            if raw.get("repeat_views", 0) > 5 and raw.get("attention_duration", 0) < 10:
                recommendations.append({
                    "type": "warning",
                    "title": "Low Engagement",
                    "description": f"{p['product_name']} has high traffic but low dwell time. Improve visual merchandising or pricing sign.",
                    "priority": "high",
                })

            # Rule 2: High Dwell + Low Interaction
            if raw.get("attention_duration", 0) > 30 and raw.get("interaction_frequency", 0) < 3:
                recommendations.append({
                    "type": "alert",
                    "title": "Conversion Issue",
                    "description": f"{p['product_name']} gets high attention but few interactions. Check pricing or stock availability.",
                    "priority": "high",
                })

            # Rule 3: High interaction but no purchase
            if raw.get("interaction_frequency", 0) > 5 and raw.get("purchase_count", 0) == 0:
                recommendations.append({
                    "type": "warning",
                    "title": "Purchase Barrier",
                    "description": f"{p['product_name']} has strong interaction but zero purchases. Investigate pricing or availability.",
                    "priority": "medium",
                })

        if not recommendations:
            recommendations.append({
                "type": "info",
                "title": "All Products Performing Well",
                "description": "No critical issues detected. Consider A/B testing shelf layouts for further optimization.",
                "priority": "low",
            })

        return recommendations[:10]
