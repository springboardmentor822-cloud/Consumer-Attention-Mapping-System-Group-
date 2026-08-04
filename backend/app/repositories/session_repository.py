from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.models.session import Session as ShopperSession
from app.schemas.session import SessionCreate, SessionUpdate

class SessionRepository:
    @staticmethod
    def create_session(db: Session, session_in: SessionCreate) -> ShopperSession:
        db_session = ShopperSession(
            store_id=session_in.store_id,
            shopper_identifier=session_in.shopper_identifier,
            entry_time=session_in.entry_time if session_in.entry_time is not None else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None),
            exit_time=session_in.exit_time,
            duration_seconds=session_in.duration_seconds,
            zone_sequence=session_in.zone_sequence
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def get_session(db: Session, session_id: str) -> Optional[ShopperSession]:
        return db.query(ShopperSession).filter(ShopperSession.id == session_id).first()

    @staticmethod
    def list_sessions(db: Session, skip: int = 0, limit: int = 100) -> List[ShopperSession]:
        return db.query(ShopperSession).offset(skip).limit(limit).all()

    @staticmethod
    def list_store_sessions(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[ShopperSession]:
        return db.query(ShopperSession).filter(ShopperSession.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def update_session(db: Session, db_session: ShopperSession, session_in: SessionUpdate) -> ShopperSession:
        update_data = session_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_session, field, value)
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def close_session(db: Session, db_session: ShopperSession, exit_time: datetime.datetime) -> ShopperSession:
        db_session.exit_time = exit_time
        duration = (exit_time - db_session.entry_time).total_seconds()
        db_session.duration_seconds = max(0.0, duration)
        db.commit()
        db.refresh(db_session)
        return db_session

    @staticmethod
    def delete_session(db: Session, db_session: ShopperSession) -> None:
        db.delete(db_session)
        db.commit()
