from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.models.attention import AttentionEvent
from app.schemas.attention import AttentionCreate, AttentionUpdate

class AttentionRepository:
    @staticmethod
    def create_attention_event(db: Session, event_in: AttentionCreate) -> AttentionEvent:
        db_event = AttentionEvent(
            session_id=event_in.session_id,
            camera_id=event_in.camera_id,
            zone_id=event_in.zone_id,
            attention_score=event_in.attention_score,
            gaze_duration_ms=event_in.gaze_duration_ms,
            confidence=event_in.confidence,
            timestamp=event_in.timestamp if event_in.timestamp is not None else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        )
        db.add(db_event)
        db.commit()
        db.refresh(db_event)
        return db_event

    @staticmethod
    def get_attention_event(db: Session, event_id: str) -> Optional[AttentionEvent]:
        return db.query(AttentionEvent).filter(AttentionEvent.id == event_id).first()

    @staticmethod
    def list_attention_events(
        db: Session,
        session_id: Optional[str] = None,
        camera_id: Optional[str] = None,
        zone_id: Optional[str] = None,
        min_attention_score: Optional[float] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[AttentionEvent]:
        query = db.query(AttentionEvent)
        if session_id:
            query = query.filter(AttentionEvent.session_id == session_id)
        if camera_id:
            query = query.filter(AttentionEvent.camera_id == camera_id)
        if zone_id:
            query = query.filter(AttentionEvent.zone_id == zone_id)
        if min_attention_score is not None:
            query = query.filter(AttentionEvent.attention_score >= min_attention_score)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_attention_event(db: Session, db_event: AttentionEvent, event_in: AttentionUpdate) -> AttentionEvent:
        update_data = event_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)
        db.commit()
        db.refresh(db_event)
        return db_event

    @staticmethod
    def delete_attention_event(db: Session, db_event: AttentionEvent) -> None:
        db.delete(db_event)
        db.commit()
