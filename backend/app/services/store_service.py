from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app.models.store import Store
from app.repositories.store_repository import StoreRepository
from app.schemas.store import StoreCreate, StoreUpdate

class StoreService:
    @staticmethod
    def create_store(db: Session, store_in: StoreCreate) -> Store:
        existing = StoreRepository.get_store_by_code(db, store_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Store with code '{store_in.code}' already exists."
            )
        
        if store_in.width <= 0 or store_in.height <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store width and height must be greater than zero."
            )
            
        return StoreRepository.create_store(db, store_in)

    @staticmethod
    def get_store(db: Session, store_id: str) -> Store:
        store = StoreRepository.get_store(db, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found."
            )
        return store

    @staticmethod
    def list_stores(db: Session, skip: int = 0, limit: int = 100) -> List[Store]:
        return StoreRepository.list_stores(db, skip, limit)

    @staticmethod
    def update_store(db: Session, store_id: str, store_in: StoreUpdate) -> Store:
        db_store = StoreService.get_store(db, store_id)
        
        if store_in.code is not None and store_in.code != db_store.code:
            existing = StoreRepository.get_store_by_code(db, store_in.code)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Store with code '{store_in.code}' already exists."
                )

        if store_in.width is not None and store_in.width <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store width must be greater than zero."
            )
        if store_in.height is not None and store_in.height <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store height must be greater than zero."
            )

        return StoreRepository.update_store(db, db_store, store_in)

    @staticmethod
    def delete_store(db: Session, store_id: str) -> None:
        db_store = StoreService.get_store(db, store_id)
        StoreRepository.delete_store(db, db_store)
