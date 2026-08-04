from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
import datetime
from app.models.session import Session as ShopperSession
from app.repositories.session_repository import SessionRepository
from app.repositories.store_repository import StoreRepository
from app.schemas.session import SessionCreate, SessionUpdate

class SessionService:
    @staticmethod
    def create_session(db: Session, session_in: SessionCreate) -> ShopperSession:
        store = StoreRepository.get_store(db, session_in.store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Store with ID '{session_in.store_id}' not found."
            )

        if session_in.entry_time is not None and session_in.exit_time is not None:
            session_in.duration_seconds = max(0.0, (session_in.exit_time - session_in.entry_time).total_seconds())

        return SessionRepository.create_session(db, session_in)

    @staticmethod
    def get_session(db: Session, session_id: str) -> ShopperSession:
        session = SessionRepository.get_session(db, session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found."
            )
        return session

    @staticmethod
    def list_sessions(db: Session, skip: int = 0, limit: int = 100) -> List[ShopperSession]:
        return SessionRepository.list_sessions(db, skip, limit)

    @staticmethod
    def list_store_sessions(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[ShopperSession]:
        store = StoreRepository.get_store(db, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Store with ID '{store_id}' not found."
            )
        return SessionRepository.list_store_sessions(db, store_id, skip, limit)

    @staticmethod
    def update_session(db: Session, session_id: str, session_in: SessionUpdate) -> ShopperSession:
        db_session = SessionService.get_session(db, session_id)

        new_entry = session_in.entry_time if session_in.entry_time is not None else db_session.entry_time
        new_exit = session_in.exit_time if session_in.exit_time is not None else db_session.exit_time

        if new_entry is not None and new_exit is not None:
            session_in.duration_seconds = max(0.0, (new_exit - new_entry).total_seconds())

        return SessionRepository.update_session(db, db_session, session_in)

    @staticmethod
    def close_session(db: Session, session_id: str, exit_time: Optional[datetime.datetime] = None) -> ShopperSession:
        db_session = SessionService.get_session(db, session_id)
        close_time = exit_time if exit_time is not None else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        return SessionRepository.close_session(db, db_session, close_time)

    @staticmethod
    def delete_session(db: Session, session_id: str) -> None:
        db_session = SessionService.get_session(db, session_id)
        SessionRepository.delete_session(db, db_session)
