from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.analytics import Notification
from app.models.user import User
from app.schemas.analytics import NotificationOut

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    store_id: int | None = None,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Notification)
    if store_id:
        query = query.filter(Notification.store_id == store_id)
    if unread_only:
        query = query.filter(Notification.is_read == 0)
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)
):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = 1
    db.commit()
    db.refresh(notification)
    return notification
