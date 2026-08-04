from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.attention import AttentionEvent
from app.repositories.attention_repository import AttentionRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.camera_repository import CameraRepository
from app.repositories.zone_repository import ZoneRepository
from app.schemas.attention import AttentionCreate, AttentionUpdate

class AttentionService:
    @staticmethod
    def create_attention_event(db: Session, event_in: AttentionCreate) -> AttentionEvent:
        sess = SessionRepository.get_session(db, event_in.session_id)
        if not sess:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session with ID '{event_in.session_id}' not found."
            )

        cam = CameraRepository.get_camera(db, event_in.camera_id)
        if not cam:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Camera with ID '{event_in.camera_id}' not found."
            )

        zn = ZoneRepository.get_zone(db, event_in.zone_id)
        if not zn:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Zone with ID '{event_in.zone_id}' not found."
            )

        if event_in.attention_score < 0.0 or event_in.attention_score > 1.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attention score must be between 0.0 and 1.0."
            )

        if event_in.confidence < 0.0 or event_in.confidence > 1.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Confidence must be between 0.0 and 1.0."
            )

        return AttentionRepository.create_attention_event(db, event_in)

    @staticmethod
    def get_attention_event(db: Session, event_id: str) -> AttentionEvent:
        event = AttentionRepository.get_attention_event(db, event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attention event not found."
            )
        return event

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
        return AttentionRepository.list_attention_events(db, session_id, camera_id, zone_id, min_attention_score, skip, limit)

    @staticmethod
    def update_attention_event(db: Session, event_id: str, event_in: AttentionUpdate) -> AttentionEvent:
        db_event = AttentionService.get_attention_event(db, event_id)

        if event_in.session_id is not None:
            sess = SessionRepository.get_session(db, event_in.session_id)
            if not sess:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

        if event_in.camera_id is not None:
            cam = CameraRepository.get_camera(db, event_in.camera_id)
            if not cam:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Camera not found.")

        if event_in.zone_id is not None:
            zn = ZoneRepository.get_zone(db, event_in.zone_id)
            if not zn:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found.")

        new_score = event_in.attention_score if event_in.attention_score is not None else db_event.attention_score
        new_conf = event_in.confidence if event_in.confidence is not None else db_event.confidence

        if new_score < 0.0 or new_score > 1.0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attention score must be between 0.0 and 1.0.")

        if new_conf < 0.0 or new_conf > 1.0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Confidence must be between 0.0 and 1.0.")

        return AttentionRepository.update_attention_event(db, db_event, event_in)

    @staticmethod
    def delete_attention_event(db: Session, event_id: str) -> None:
        db_event = AttentionService.get_attention_event(db, event_id)
        AttentionRepository.delete_attention_event(db, db_event)
