from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.shelf import Shelf
from app.repositories.shelf_repository import ShelfRepository
from app.repositories.store_repository import StoreRepository
from app.schemas.shelf import ShelfCreate, ShelfUpdate
from app.utils.geometry import is_within_bounds

class ShelfService:
    @staticmethod
    def create_shelf(db: Session, shelf_in: ShelfCreate) -> Shelf:
        store = StoreRepository.get_store(db, shelf_in.store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Store with ID '{shelf_in.store_id}' not found."
            )

        if not is_within_bounds(shelf_in.x, shelf_in.y, shelf_in.width, shelf_in.height, store.width, store.height):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shelf does not fit within the store dimensions or coordinates are negative."
            )

        return ShelfRepository.create_shelf(db, shelf_in)

    @staticmethod
    def get_shelf(db: Session, shelf_id: str) -> Shelf:
        shelf = ShelfRepository.get_shelf(db, shelf_id)
        if not shelf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shelf not found."
            )
        return shelf

    @staticmethod
    def list_shelves(db: Session, skip: int = 0, limit: int = 100) -> List[Shelf]:
        return ShelfRepository.list_shelves(db, skip, limit)

    @staticmethod
    def list_store_shelves(db: Session, store_id: str, skip: int = 0, limit: int = 100) -> List[Shelf]:
        store = StoreRepository.get_store(db, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Store with ID '{store_id}' not found."
            )
        return ShelfRepository.list_store_shelves(db, store_id, skip, limit)

    @staticmethod
    def update_shelf(db: Session, shelf_id: str, shelf_in: ShelfUpdate) -> Shelf:
        db_shelf = ShelfService.get_shelf(db, shelf_id)
        store = StoreRepository.get_store(db, db_shelf.store_id)

        new_x = shelf_in.x if shelf_in.x is not None else db_shelf.x
        new_y = shelf_in.y if shelf_in.y is not None else db_shelf.y
        new_w = shelf_in.width if shelf_in.width is not None else db_shelf.width
        new_h = shelf_in.height if shelf_in.height is not None else db_shelf.height

        if not is_within_bounds(new_x, new_y, new_w, new_h, store.width, store.height):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Updated shelf parameters do not fit within the store dimensions."
            )

        return ShelfRepository.update_shelf(db, db_shelf, shelf_in)

    @staticmethod
    def delete_shelf(db: Session, shelf_id: str) -> None:
        db_shelf = ShelfService.get_shelf(db, shelf_id)
        ShelfRepository.delete_shelf(db, db_shelf)
