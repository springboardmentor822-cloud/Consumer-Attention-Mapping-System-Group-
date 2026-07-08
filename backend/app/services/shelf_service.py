from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.shelf import Shelf
from backend.app.models.store import Store
from backend.app.schemas.shelf import ShelfCreate, ShelfUpdate


class ShelfService:
    def list_shelves_for_store(self, db: Session, store_id: UUID) -> list[Shelf]:
        return list(db.scalars(select(Shelf).where(Shelf.store_id == store_id).order_by(Shelf.created_at.desc())).all())

    def get_shelf(self, db: Session, shelf_id: UUID) -> Shelf:
        shelf = db.get(Shelf, shelf_id)
        if shelf is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")
        return shelf

    def create_shelf(self, db: Session, store_id: UUID, payload: ShelfCreate) -> Shelf:
        store = db.get(Store, store_id)
        if store is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

        shelf = Shelf(
            store_id=store_id,
            shelf_name=payload.shelf_name,
            zone_coordinates=payload.zone_coordinates,
        )
        db.add(shelf)
        db.commit()
        db.refresh(shelf)
        return shelf

    def update_shelf(self, db: Session, shelf_id: UUID, payload: ShelfUpdate) -> Shelf:
        shelf = self.get_shelf(db, shelf_id)
        update_data = payload.model_dump(exclude_unset=True)
        if "shelf_name" in update_data:
            shelf.shelf_name = update_data["shelf_name"]
        if "zone_coordinates" in update_data:
            shelf.zone_coordinates = update_data["zone_coordinates"]
        db.commit()
        db.refresh(shelf)
        return shelf

    def delete_shelf(self, db: Session, shelf_id: UUID) -> None:
        shelf = self.get_shelf(db, shelf_id)
        db.delete(shelf)
        db.commit()


shelf_service = ShelfService()
