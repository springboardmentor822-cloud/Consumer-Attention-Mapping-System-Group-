"""Shopper Segmentation Service — classifies shoppers into 5 segments."""
from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.models.tracking import ShopperSession, AttentionEvent, InteractionEvent, CoordinateLog
from backend.app.models.segmentation import ShopperSegment
from backend.app.models.journey import CustomerJourney


class SegmentationService:
    SEGMENTS = ["Explorer", "Quick Buyer", "Comparison Shopper", "Impulse Buyer", "Brand Loyal"]

    def __init__(self, db: Session):
        self.db = db

    def classify_session(self, session: ShopperSession, store_id: UUID) -> Dict[str, Any]:
        """Classify a single shopper session into one of the 5 segments."""
        # Gather metrics
        dwell_time = 0.0
        if session.end_time and session.start_time:
            dwell_time = (session.end_time - session.start_time).total_seconds()

        # Count zones visited from journey data
        journey = self.db.query(CustomerJourney).filter(
            CustomerJourney.session_id == session.id
        ).first()
        zones_visited = len(journey.zones_visited) if journey and isinstance(journey.zones_visited, list) else 1

        # Count interactions
        interactions = self.db.query(InteractionEvent).filter(
            InteractionEvent.session_id == session.id
        ).all()
        pickup_count = sum(1 for i in interactions if i.interaction_type == "PICKED_UP")
        return_count = sum(1 for i in interactions if i.interaction_type == "RETURNED")
        purchase_count = sum(1 for i in interactions if i.interaction_type == "PURCHASED")
        view_count = sum(1 for i in interactions if i.interaction_type == "VIEWED")
        product_switches = sum(1 for i in interactions if i.interaction_type in ("PICKED_UP", "RETURNED"))

        # Determine segment with confidence
        scores = {
            "Explorer": self._score_explorer(dwell_time, zones_visited, pickup_count),
            "Quick Buyer": self._score_quick_buyer(dwell_time, purchase_count, zones_visited),
            "Comparison Shopper": self._score_comparison(dwell_time, product_switches, pickup_count),
            "Impulse Buyer": self._score_impulse(dwell_time, pickup_count, view_count),
            "Brand Loyal": self._score_brand_loyal(dwell_time, purchase_count, zones_visited),
        }

        best_segment = max(scores, key=scores.get)
        confidence = min(scores[best_segment], 1.0)

        reasons = {
            "Explorer": f"High dwell time ({dwell_time:.0f}s) across {zones_visited} zones with exploratory movement",
            "Quick Buyer": f"Direct movement with short journey ({dwell_time:.0f}s) and {purchase_count} purchases",
            "Comparison Shopper": f"High dwell time ({dwell_time:.0f}s) with {product_switches} product switches and {pickup_count} pickups",
            "Impulse Buyer": f"Frequent engagement with {view_count} views and {pickup_count} pickups in short window",
            "Brand Loyal": f"Consistent product preference with {purchase_count} purchases across {zones_visited} targeted zones",
        }

        return {
            "segment": best_segment,
            "confidence": round(confidence, 2),
            "dwell_time": round(dwell_time, 1),
            "zones_visited": zones_visited,
            "product_switches": product_switches,
            "pickup_count": pickup_count,
            "purchase_count": purchase_count,
            "reason": reasons[best_segment],
        }

    def _score_explorer(self, dwell: float, zones: int, pickups: int) -> float:
        score = 0.0
        if dwell > 300:
            score += 0.4
        elif dwell > 120:
            score += 0.2
        if zones >= 4:
            score += 0.4
        elif zones >= 2:
            score += 0.2
        if pickups <= 2:
            score += 0.2
        return score

    def _score_quick_buyer(self, dwell: float, purchases: int, zones: int) -> float:
        score = 0.0
        if dwell < 120:
            score += 0.4
        elif dwell < 300:
            score += 0.2
        if purchases >= 1:
            score += 0.4
        if zones <= 2:
            score += 0.2
        return score

    def _score_comparison(self, dwell: float, switches: int, pickups: int) -> float:
        score = 0.0
        if dwell > 180:
            score += 0.3
        if switches >= 3:
            score += 0.4
        elif switches >= 1:
            score += 0.2
        if pickups >= 2:
            score += 0.3
        return score

    def _score_impulse(self, dwell: float, pickups: int, views: int) -> float:
        score = 0.0
        if dwell < 180:
            score += 0.3
        if views >= 3:
            score += 0.3
        if pickups >= 1:
            score += 0.4
        return score

    def _score_brand_loyal(self, dwell: float, purchases: int, zones: int) -> float:
        score = 0.0
        if dwell < 240:
            score += 0.2
        if purchases >= 1:
            score += 0.5
        if zones <= 3:
            score += 0.3
        return score

    def get_segments_for_store(self, store_id: UUID) -> List[Dict[str, Any]]:
        """Return all stored segments for a store."""
        segments = self.db.query(ShopperSegment).filter(
            ShopperSegment.store_id == store_id
        ).order_by(ShopperSegment.created_at.desc()).limit(200).all()

        return [
            {
                "id": str(s.id),
                "session_id": str(s.session_id),
                "segment": s.segment,
                "confidence": s.confidence,
                "metrics": s.metrics,
                "reason": s.reason,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in segments
        ]

    def get_segment_distribution(self, store_id: UUID) -> Dict[str, Any]:
        """Return segment counts for charting."""
        results = self.db.query(
            ShopperSegment.segment,
            func.count(ShopperSegment.id)
        ).filter(
            ShopperSegment.store_id == store_id
        ).group_by(ShopperSegment.segment).all()

        distribution = {seg: 0 for seg in self.SEGMENTS}
        for segment, count in results:
            distribution[segment] = count

        return distribution
