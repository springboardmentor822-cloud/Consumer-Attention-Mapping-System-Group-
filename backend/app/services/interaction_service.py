from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.interaction import ProductInteraction
from app.models.product import Product
from app.models.shelf import Shelf
from app.repositories.interaction_repository import InteractionRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.shelf_repository import ShelfRepository
from app.schemas.interaction import InteractionCreate, InteractionUpdate, VALID_INTERACTION_TYPES

class InteractionService:
    @staticmethod
    def create_interaction(db: Session, interaction_in: InteractionCreate) -> ProductInteraction:
        sess = SessionRepository.get_session(db, interaction_in.session_id)
        if not sess:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session with ID '{interaction_in.session_id}' not found."
            )

        prod = db.query(Product).filter(Product.id == interaction_in.product_id).first()
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID '{interaction_in.product_id}' not found."
            )

        shlf = ShelfRepository.get_shelf(db, interaction_in.shelf_id)
        if not shlf:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shelf with ID '{interaction_in.shelf_id}' not found."
            )

        if interaction_in.interaction_type.lower() not in VALID_INTERACTION_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid interaction type. Must be one of {list(VALID_INTERACTION_TYPES)}"
            )

        return InteractionRepository.create_interaction(db, interaction_in)

    @staticmethod
    def get_interaction(db: Session, interaction_id: str) -> ProductInteraction:
        interaction = InteractionRepository.get_interaction(db, interaction_id)
        if not interaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interaction log not found."
            )
        return interaction

    @staticmethod
    def list_interactions(
        db: Session,
        session_id: Optional[str] = None,
        product_id: Optional[str] = None,
        shelf_id: Optional[str] = None,
        interaction_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ProductInteraction]:
        return InteractionRepository.list_interactions(db, session_id, product_id, shelf_id, interaction_type, skip, limit)

    @staticmethod
    def update_interaction(db: Session, interaction_id: str, interaction_in: InteractionUpdate) -> ProductInteraction:
        db_interaction = InteractionService.get_interaction(db, interaction_id)

        if interaction_in.session_id is not None:
            sess = SessionRepository.get_session(db, interaction_in.session_id)
            if not sess:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

        if interaction_in.product_id is not None:
            prod = db.query(Product).filter(Product.id == interaction_in.product_id).first()
            if not prod:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

        if interaction_in.shelf_id is not None:
            shlf = ShelfRepository.get_shelf(db, interaction_in.shelf_id)
            if not shlf:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found.")

        if interaction_in.interaction_type is not None and interaction_in.interaction_type.lower() not in VALID_INTERACTION_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid interaction type. Must be one of {list(VALID_INTERACTION_TYPES)}"
            )

        return InteractionRepository.update_interaction(db, db_interaction, interaction_in)

    @staticmethod
    def delete_interaction(db: Session, interaction_id: str) -> None:
        db_interaction = InteractionService.get_interaction(db, interaction_id)
        InteractionRepository.delete_interaction(db, db_interaction)
