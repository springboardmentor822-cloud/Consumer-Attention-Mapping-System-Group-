from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud

from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


@router.get("/")
def dashboard(
    camera_id: int = 1,
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

    # Database statistics
    business = crud.get_dashboard_analytics(db)

    # Live AI statistics
    ai = crud.get_ai_dashboard(db, camera_id)

    # Merge both dictionaries
    return {
        **business,
        **ai
    }