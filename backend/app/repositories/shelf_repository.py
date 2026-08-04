from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.shelf import Shelf
from app.schemas.shelf import ShelfCreate, ShelfUpdate

class ShelfRepository:
    @staticmethod
    def create_shelf(db: Session, shelf_in: ShelfCreate) -> Shelf:
        db_shelf = Shelf(
            store_id=shelf_in.store_id,
            name=shelf_in.name,
            x=shelf_in.x,
            y=shelf_in.y,
            width=shelf_in.width,
            height=shelf_in.height
        )
        db.add(db_shelf)
        db.commit()
        db.refresh(db_shelf)
        return db_shelf

    @staticmethod
    def get_shelf(db: Session, shelf_id: str) -> Optional[Shelf]:
        return db.query(Shelf).filter(Shelf.id == shelf_id).first()

    @staticmethod
    def list_shelves(db: Session, skip: int = 0, limit: int = 100) -> List[Shelf]:
        return db.query(Shelf).offset(skip).limit(limit).all()

    @staticmethod
    def list_store_shelves(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[Shelf]:
        return db.query(Shelf).filter(Shelf.store_id == store_id).offset(skip).limit(limit).all()

    @staticmethod
    def update_shelf(db: Session, db_shelf: Shelf, shelf_in: ShelfUpdate) -> Shelf:
        update_data = shelf_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_shelf, field, value)
        db.commit()
        db.refresh(db_shelf)
        return db_shelf

    @staticmethod
    def delete_shelf(db: Session, db_shelf: Shelf) -> None:
        db.delete(db_shelf)
        db.commit()
