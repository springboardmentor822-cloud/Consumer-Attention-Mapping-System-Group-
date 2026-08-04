from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.store import Store
from app.schemas.store import StoreCreate, StoreUpdate

class StoreRepository:
    @staticmethod
    def create_store(db: Session, store_in: StoreCreate) -> Store:
        db_store = Store(
            name=store_in.name,
            code=store_in.code,
            address=store_in.address,
            width=store_in.width,
            height=store_in.height,
            is_active=store_in.is_active
        )
        db.add(db_store)
        db.commit()
        db.refresh(db_store)
        return db_store

    @staticmethod
    def get_store(db: Session, store_id: str) -> Optional[Store]:
        return db.query(Store).filter(Store.id == store_id).first()

    @staticmethod
    def get_store_by_code(db: Session, code: str) -> Optional[Store]:
        return db.query(Store).filter(Store.code == code).first()

    @staticmethod
    def list_stores(db: Session, skip: int = 0, limit: int = 100) -> List[Store]:
        return db.query(Store).offset(skip).limit(limit).all()

    @staticmethod
    def update_store(db: Session, db_store: Store, store_in: StoreUpdate) -> Store:
        update_data = store_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_store, field, value)
        db.commit()
        db.refresh(db_store)
        return db_store

    @staticmethod
    def delete_store(db: Session, db_store: Store) -> None:
        db.delete(db_store)
        db.commit()
