from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.store import Store
from backend.app.schemas.store import StoreCreate, StoreUpdate


class StoreService:
    def list_stores(self, db: Session) -> list[Store]:
        return list(db.scalars(select(Store).order_by(Store.created_at.desc())).all())

    def get_store(self, db: Session, store_id: UUID) -> Store:
        store = db.get(Store, store_id)
        if store is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")
        return store

    def create_store(self, db: Session, payload: StoreCreate) -> Store:
        store = Store(
            store_name=payload.store_name,
            location=payload.location,
            metadata_=payload.metadata,
        )
        db.add(store)
        db.commit()
        db.refresh(store)
        return store

    def update_store(self, db: Session, store_id: UUID, payload: StoreUpdate) -> Store:
        store = self.get_store(db, store_id)
        update_data = payload.model_dump(exclude_unset=True)
        if "store_name" in update_data:
            store.store_name = update_data["store_name"]
        if "location" in update_data:
            store.location = update_data["location"]
        if "metadata" in update_data:
            store.metadata_ = update_data["metadata"]
        db.commit()
        db.refresh(store)
        return store

    def delete_store(self, db: Session, store_id: UUID) -> None:
        store = self.get_store(db, store_id)
        db.delete(store)
        db.commit()

    def approve_store(self, db: Session, store_id: UUID, is_approved: bool) -> Store:
        store = self.get_store(db, store_id)
        store.is_approved = is_approved
        db.commit()
        db.refresh(store)
        return store


store_service = StoreService()
