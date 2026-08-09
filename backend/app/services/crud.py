from typing import Any, Generic, TypeVar

from fastapi import HTTPException, status
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.user import User
from app.services.audit import record_audit_event


def clean_integrity_error_detail(exc: IntegrityError) -> str:
    """psycopg2's DETAIL line (e.g. 'Key (store_id)=(1) is not present in
    table "stores".') is already a clean, specific message - prefer it over
    the raw multi-line exception."""
    message = str(exc.orig)
    for line in message.splitlines():
        line = line.strip()
        if line.startswith("DETAIL:"):
            return line.removeprefix("DETAIL:").strip()
    return message.splitlines()[0].strip() if message else "Invalid or conflicting reference."


ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType], resource_name: str) -> None:
        self.model = model
        self.resource_name = resource_name

    def list(self, db: Session) -> list[ModelType]:
        return db.query(self.model).order_by(self.model.id.desc()).all()

    def get_or_404(self, db: Session, item_id: int) -> ModelType:
        item = db.get(self.model, item_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{self.resource_name} not found",
            )
        return item

    def create(self, db: Session, data: CreateSchemaType, actor: User | None = None) -> ModelType:
        item = self.model(**data.model_dump())
        db.add(item)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=clean_integrity_error_detail(exc),
            ) from exc
        db.refresh(item)
        record_audit_event(
            db, action=f"{self.resource_name.lower()}_created", message=f"{self.resource_name} #{item.id} created",
            actor=actor, resource=self.resource_name.lower(), resource_id=item.id,
        )
        return item

    def update(self, db: Session, item_id: int, data: UpdateSchemaType, actor: User | None = None) -> ModelType:
        item = self.get_or_404(db, item_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=clean_integrity_error_detail(exc),
            ) from exc
        db.refresh(item)
        record_audit_event(
            db, action=f"{self.resource_name.lower()}_updated", message=f"{self.resource_name} #{item.id} updated",
            actor=actor, resource=self.resource_name.lower(), resource_id=item.id,
        )
        return item

    def delete(self, db: Session, item_id: int, actor: User | None = None) -> dict[str, Any]:
        item = self.get_or_404(db, item_id)
        db.delete(item)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=clean_integrity_error_detail(exc),
            ) from exc
        record_audit_event(
            db, action=f"{self.resource_name.lower()}_deleted", message=f"{self.resource_name} #{item_id} deleted",
            actor=actor, resource=self.resource_name.lower(), resource_id=item_id, severity="warning",
        )
        return {"message": f"{self.resource_name} deleted successfully"}
