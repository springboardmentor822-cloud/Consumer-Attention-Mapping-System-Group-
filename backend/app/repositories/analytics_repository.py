from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Dict, Any, Optional
from app.models.attention import AttentionEvent
from app.models.zone import Zone
from app.models.session import Session as ShopperSession
from app.models.interaction import ProductInteraction
from app.models.product import Product
from app.models.tracking import TrackingLog

class AnalyticsRepository:
    @staticmethod
    def get_zone_attention_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        results = db.query(
            Zone.id.label("zone_id"),
            Zone.name.label("zone_name"),
            func.count(AttentionEvent.id).label("total_attention_events"),
            func.coalesce(func.avg(AttentionEvent.attention_score), 0.0).label("average_attention_score"),
            func.coalesce(func.sum(AttentionEvent.gaze_duration_ms), 0.0).label("total_gaze_duration_ms")
        ).join(
            AttentionEvent, AttentionEvent.zone_id == Zone.id
        ).filter(
            Zone.store_id == store_id
        ).group_by(
            Zone.id, Zone.name
        ).all()

        return [
            {
                "zone_id": r.zone_id,
                "zone_name": r.zone_name,
                "total_attention_events": r.total_attention_events,
                "average_attention_score": float(r.average_attention_score),
                "total_gaze_duration_ms": float(r.total_gaze_duration_ms)
            }
            for r in results
        ]

    @staticmethod
    def get_store_heatmap_data(db: Session, store_id: str) -> List[Dict[str, Any]]:
        results = db.query(
            AttentionEvent.zone_id.label("zone_id"),
            Zone.x.label("x"),
            Zone.y.label("y"),
            func.count(AttentionEvent.id).label("attention_count"),
            func.coalesce(func.avg(AttentionEvent.attention_score), 0.0).label("average_attention_score")
        ).join(
            Zone, AttentionEvent.zone_id == Zone.id
        ).filter(
            Zone.store_id == store_id
        ).group_by(
            AttentionEvent.zone_id, Zone.x, Zone.y
        ).all()

        return [
            {
                "zone_id": r.zone_id,
                "x": float(r.x),
                "y": float(r.y),
                "attention_count": r.attention_count,
                "average_attention_score": float(r.average_attention_score)
            }
            for r in results
        ]

    @staticmethod
    def get_dwell_time_metrics(db: Session, store_id: str) -> Dict[str, Any]:
        result = db.query(
            func.count(ShopperSession.id).label("total_sessions"),
            func.coalesce(func.avg(ShopperSession.duration_seconds), 0.0).label("average_duration_seconds"),
            func.coalesce(func.max(ShopperSession.duration_seconds), 0.0).label("longest_session"),
            func.coalesce(func.min(ShopperSession.duration_seconds), 0.0).label("shortest_session")
        ).filter(
            ShopperSession.store_id == store_id
        ).first()

        if not result or result.total_sessions == 0:
            return {
                "total_sessions": 0,
                "average_duration_seconds": 0.0,
                "longest_session": 0.0,
                "shortest_session": 0.0
            }

        return {
            "total_sessions": result.total_sessions,
            "average_duration_seconds": float(result.average_duration_seconds),
            "longest_session": float(result.longest_session),
            "shortest_session": float(result.shortest_session)
        }

    @staticmethod
    def get_product_interaction_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        results = db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(case((ProductInteraction.interaction_type == "view", 1), else_=0)).label("views"),
            func.sum(case((ProductInteraction.interaction_type == "pickup", 1), else_=0)).label("pickups"),
            func.sum(case((ProductInteraction.interaction_type == "compare", 1), else_=0)).label("compares"),
            func.sum(case((ProductInteraction.interaction_type == "return", 1), else_=0)).label("returns"),
            func.sum(case((ProductInteraction.interaction_type == "purchase", 1), else_=0)).label("purchases")
        ).join(
            ProductInteraction, ProductInteraction.product_id == Product.id
        ).filter(
            Product.store_id == store_id
        ).group_by(
            Product.id, Product.name
        ).all()

        return [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "views": int(r.views or 0),
                "pickups": int(r.pickups or 0),
                "compares": int(r.compares or 0),
                "returns": int(r.returns or 0),
                "purchases": int(r.purchases or 0)
            }
            for r in results
        ]

    @staticmethod
    def get_conversion_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        metrics = AnalyticsRepository.get_product_interaction_metrics(db, store_id)
        results = []
        for m in metrics:
            views = m["views"]
            purchases = m["purchases"]
            conversion_rate = float(purchases) / float(views) if views > 0 else 0.0
            results.append({
                "product_id": m["product_id"],
                "product_name": m["product_name"],
                "views": views,
                "purchases": purchases,
                "conversion_rate": conversion_rate
            })
        return results

    @staticmethod
    def get_zone_traffic_metrics(db: Session, store_id: str) -> List[Dict[str, Any]]:
        results = db.query(
            Zone.id.label("zone_id"),
            Zone.name.label("zone_name"),
            func.count(AttentionEvent.id).label("zone_visits"),
            func.count(AttentionEvent.session_id.distinct()).label("unique_sessions"),
            func.coalesce(func.avg(AttentionEvent.attention_score), 0.0).label("average_attention_score")
        ).outerjoin(
            AttentionEvent, AttentionEvent.zone_id == Zone.id
        ).filter(
            Zone.store_id == store_id
        ).group_by(
            Zone.id, Zone.name
        ).all()

        return [
            {
                "zone_id": r.zone_id,
                "zone_name": r.zone_name,
                "zone_visits": r.zone_visits,
                "unique_sessions": r.unique_sessions,
                "average_attention_score": float(r.average_attention_score)
            }
            for r in results
        ]

    @staticmethod
    def get_shopper_journey_data(db: Session, store_id: str) -> List[Dict[str, Any]]:
        import datetime
        from app.models.camera import Camera

        # Get all cameras in this store to filter tracking logs
        cameras = db.query(Camera).filter(Camera.store_id == store_id).all()
        cam_ids = [c.id for c in cameras]

        # Get all zones in this store
        zones = db.query(Zone).filter(Zone.store_id == store_id).all()
        zone_map = {str(z.id): z.name for z in zones}
        for z in zones:
            zone_map[str(z.name)] = z.name

        # Resolve shoppers from sessions
        sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).all()
        shoppers = []
        session_shopper_ids = set()
        for s in sessions:
            if s.shopper_identifier:
                shoppers.append({
                    "shopper_identifier": s.shopper_identifier,
                    "session_id": s.id,
                    "zone_sequence": s.zone_sequence
                })
                session_shopper_ids.add(s.shopper_identifier)

        # Retrieve all tracking logs
        tracking_query = db.query(TrackingLog)
        if cam_ids:
            # Filter by camera if cameras exist
            tracking_query = tracking_query.filter(TrackingLog.camera_id.in_(cam_ids))
        
        all_logs = tracking_query.all()
        shopper_logs = {}
        for log in all_logs:
            shopper_logs.setdefault(log.shopper_id, []).append(log)

        # Fallback: add shoppers from tracking logs who have no session
        for shopper_id in shopper_logs:
            if shopper_id not in session_shopper_ids:
                shoppers.append({
                    "shopper_identifier": shopper_id,
                    "session_id": None,
                    "zone_sequence": None
                })

        transitions = {}
        for sh in shoppers:
            sequence = []
            
            # 1. Fetch logs for this shopper and sort them stably by timestamp
            logs = shopper_logs.get(sh["shopper_identifier"], [])
            logs = sorted(logs, key=lambda l: l.timestamp or datetime.datetime.min)
            
            for log in logs:
                zone_name = str(log.zone_id)
                # Map using zone_map (e.g. z.id or z.name)
                if zone_name in zone_map:
                    zone_name = zone_map[zone_name]
                else:
                    # Fallback to query Zone table directly
                    z_obj = db.query(Zone).filter((Zone.id == zone_name) | (Zone.name == zone_name)).first()
                    if z_obj:
                        zone_name = z_obj.name
                sequence.append(zone_name)

            # 2. Try AttentionEvent if logs are empty and we have a session
            if not sequence and sh["session_id"]:
                events = db.query(AttentionEvent).filter(
                    AttentionEvent.session_id == sh["session_id"]
                ).order_by(AttentionEvent.timestamp.asc()).all()
                for e in events:
                    sequence.append(zone_map.get(str(e.zone_id), e.zone_id))

            # 3. Fallback to session.zone_sequence
            if len(sequence) < 2 and sh["zone_sequence"]:
                sequence = sh["zone_sequence"]

            # Collapse consecutive duplicates
            collapsed = []
            for item in sequence:
                if not collapsed or collapsed[-1] != item:
                    collapsed.append(item)

            if len(collapsed) < 2:
                continue

            for i in range(len(collapsed) - 1):
                source = collapsed[i]
                target = collapsed[i+1]
                pair = (source, target)
                transitions[pair] = transitions.get(pair, 0) + 1

        return [
            {
                "source_zone": pair[0],
                "target_zone": pair[1],
                "transition_count": count
            }
            for pair, count in transitions.items()
        ]
