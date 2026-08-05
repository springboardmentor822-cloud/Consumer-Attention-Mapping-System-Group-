from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas

from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET NOTIFICATIONS (Camera Wise)
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get(
    "/{camera_id}",
    response_model=list[schemas.NotificationResponse]
)
def get_notifications(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):

    return crud.get_notifications(db, camera_id)


# ==========================================================
# GET ALL NOTIFICATIONS
# Admin + Store Manager + Marketing Manager + Retail Analyst
# ==========================================================

@router.get(
    "/",
    response_model=list[schemas.NotificationResponse]
)
def get_all_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            "Admin",
            "Store Manager",
            "Marketing Manager",
            "Retail Analyst",
        )
    ),
):

    return crud.get_notifications(db, 1)