import math
import json
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.models import ShopperPosition, ShopperSession, Shelf

class BehaviorEngine:
    """
    Step 1: Consumer Behavior Intelligence Engine
    Calculates journey metrics (path distance, zone dwell times, velocity)
    and classifies shoppers into 5 personas (Explorers, Quick Buyers, Comparison Shoppers, Impulse Buyers, Brand Loyal Customers).
    """

    @staticmethod
    def calculate_euclidean_distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2)

    @staticmethod
    def is_point_in_polygon(x: float, y: float, poly: List[List[float]]) -> bool:
        """Ray-casting algorithm to test if point (x, y) is inside polygon."""
        if not poly or len(poly) < 3:
            return False
        n = len(poly)
        inside = False
        p1x, p1y = poly[0]
        for i in range(n + 1):
            p2x, p2y = poly[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    def process_shopper_session(self, db: Session, shopper_id: int, store_id: int) -> ShopperSession:
        """
        Extracts positions for a shopper, computes total distance, velocity, zone dwell times,
        classifies their persona, and stores/updates the ShopperSession record.
        """
        positions = (
            db.query(ShopperPosition)
            .filter(ShopperPosition.shopper_id == shopper_id)
            .order_by(ShopperPosition.timestamp.asc())
            .all()
        )

        if not positions:
            # Create default empty session
            session = ShopperSession(
                shopper_id=shopper_id,
                store_id=store_id,
                total_path_distance=0.0,
                avg_velocity=0.0,
                total_dwell_time=0,
                interaction_count=0,
                shopper_segment="Explorer"
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            return session

        # 1. Calculate trajectory distance and movement velocity
        total_distance = 0.0
        dwell_seconds = len(positions)  # Assuming ~1 sample per second
        interactions = 0
        gaze_hits = {}

        for i in range(len(positions) - 1):
            dist = self.calculate_euclidean_distance(
                (positions[i].x, positions[i].y),
                (positions[i + 1].x, positions[i + 1].y)
            )
            total_distance += dist

            if positions[i].gaze_target:
                interactions += 1
                gaze_hits[positions[i].gaze_target] = gaze_hits.get(positions[i].gaze_target, 0) + 1

        first_ts = positions[0].timestamp
        last_ts = positions[-1].timestamp
        duration_seconds = max(1.0, (last_ts - first_ts).total_seconds()) if (last_ts and first_ts) else max(1.0, float(dwell_seconds))
        avg_velocity = round(total_distance / duration_seconds, 2)

        # 2. Zone dwell calculation against store shelves
        shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
        zone_dwells: Dict[str, int] = {}

        for shelf in shelves:
            poly = None
            if shelf.coordinates_json:
                try:
                    poly = json.loads(shelf.coordinates_json)
                except:
                    poly = None

            if not poly:
                # Default bounding box around position_x, position_y
                px = getattr(shelf, "position_x", 100.0) or 100.0
                py = getattr(shelf, "position_y", 100.0) or 100.0
                poly = [[px - 50, py - 50], [px + 50, py - 50], [px + 50, py + 50], [px - 50, py + 50]]

            dwell_in_zone = 0
            for pos in positions:
                if self.is_point_in_polygon(pos.x, pos.y, poly):
                    dwell_in_zone += 1

            if dwell_in_zone > 0:
                zone_dwells[shelf.zone_name or shelf.name] = dwell_in_zone

        # 3. Classify Shopper Persona
        segment = self.classify_shopper_persona(
            total_distance=total_distance,
            total_dwell_time=int(duration_seconds),
            zone_count=len(zone_dwells),
            interaction_count=interactions,
            avg_velocity=avg_velocity
        )

        # 4. Save/Update Session in DB
        existing_session = db.query(ShopperSession).filter(ShopperSession.shopper_id == shopper_id).first()
        if existing_session:
            session = existing_session
            session.total_path_distance = round(total_distance, 2)
            session.avg_velocity = avg_velocity
            session.total_dwell_time = int(duration_seconds)
            session.zone_dwell_json = json.dumps(zone_dwells)
            session.interaction_count = interactions
            session.shopper_segment = segment
            session.exit_time = datetime.utcnow()
        else:
            session = ShopperSession(
                shopper_id=shopper_id,
                store_id=store_id,
                entry_time=first_ts,
                exit_time=last_ts,
                total_path_distance=round(total_distance, 2),
                avg_velocity=avg_velocity,
                total_dwell_time=int(duration_seconds),
                zone_dwell_json=json.dumps(zone_dwells),
                interaction_count=interactions,
                shopper_segment=segment
            )
            db.add(session)

        db.commit()
        db.refresh(session)
        return session

    def classify_shopper_persona(
        self,
        total_distance: float,
        total_dwell_time: int,
        zone_count: int,
        interaction_count: int,
        avg_velocity: float
    ) -> str:
        """
        Maps journey metrics to 1 of 5 buyer personas:
        - Explorer: High distance, high multi-zone dwell time, low pickup/interaction frequency
        - Quick Buyer: Low dwell time, direct fast velocity trajectory, immediate checkout
        - Comparison Shopper: Extended dwell time at single shelf, high product interaction count
        - Impulse Buyer: Moderate path length, short view duration followed by immediate interaction
        - Brand Loyal Customer: Targeted navigation to brand zones with high purchase conversion
        """
        if total_dwell_time > 120 and zone_count >= 3 and interaction_count < 3:
            return "Explorer"
        elif total_dwell_time < 45 and avg_velocity > 1.5:
            return "Quick Buyer"
        elif total_dwell_time > 90 and interaction_count >= 5:
            return "Comparison Shopper"
        elif 30 <= total_dwell_time <= 90 and interaction_count >= 2 and avg_velocity < 1.0:
            return "Impulse Buyer"
        elif zone_count == 1 and interaction_count >= 3:
            return "Brand Loyal Customer"

        # Default fallback rule heuristic
        if total_distance > 500:
            return "Explorer"
        return "Quick Buyer"

behavior_engine = BehaviorEngine()
