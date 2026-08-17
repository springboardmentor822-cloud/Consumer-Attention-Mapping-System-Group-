"""Recommendation Service — generates data-driven optimization recommendations."""
from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.models.recommendation import Recommendation


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations(self, store_id: UUID, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch stored recommendations for a store."""
        recs = self.db.query(Recommendation).filter(
            Recommendation.store_id == store_id
        ).order_by(Recommendation.created_at.desc()).limit(limit).all()

        return [
            {
                "id": str(r.id),
                "type": r.recommendation_type,
                "title": r.title,
                "description": r.description,
                "reason": r.reason,
                "supporting_metric": r.supporting_metric,
                "expected_impact": r.expected_impact,
                "priority": r.priority,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recs
        ]
