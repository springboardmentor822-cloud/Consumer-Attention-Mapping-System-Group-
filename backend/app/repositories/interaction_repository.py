from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.models.interaction import ProductInteraction
from app.schemas.interaction import InteractionCreate, InteractionUpdate

class InteractionRepository:
    @staticmethod
    def create_interaction(db: Session, interaction_in: InteractionCreate) -> ProductInteraction:
        db_interaction = ProductInteraction(
            session_id=interaction_in.session_id,
            product_id=interaction_in.product_id,
            shelf_id=interaction_in.shelf_id,
            interaction_type=interaction_in.interaction_type,
            timestamp=interaction_in.timestamp if interaction_in.timestamp is not None else datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        )
        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)
        return db_interaction

    @staticmethod
    def get_interaction(db: Session, interaction_id: str) -> Optional[ProductInteraction]:
        return db.query(ProductInteraction).filter(ProductInteraction.id == interaction_id).first()

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
        query = db.query(ProductInteraction)
        if session_id:
            query = query.filter(ProductInteraction.session_id == session_id)
        if product_id:
            query = query.filter(ProductInteraction.product_id == product_id)
        if shelf_id:
            query = query.filter(ProductInteraction.shelf_id == shelf_id)
        if interaction_type:
            query = query.filter(ProductInteraction.interaction_type == interaction_type)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_interaction(db: Session, db_interaction: ProductInteraction, interaction_in: InteractionUpdate) -> ProductInteraction:
        update_data = interaction_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_interaction, field, value)
        db.commit()
        db.refresh(db_interaction)
        return db_interaction

    @staticmethod
    def delete_interaction(db: Session, db_interaction: ProductInteraction) -> None:
        db.delete(db_interaction)
        db.commit()
