from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db
from utils.auth_dependency import require_roles

router = APIRouter()


# ==========================================================
# GET ALL USERS (Admin Only)
# ==========================================================

@router.get("/", response_model=list[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin")),
):
    return crud.get_users(db)


# ==========================================================
# GET USER BY ID (Admin Only)
# ==========================================================

@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin")),
):

    user = crud.get_user_by_id(db, user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ==========================================================
# CREATE USER (Admin Only)
# ==========================================================

@router.post("/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin")),
):

    return crud.create_user(db, user)


# ==========================================================
# UPDATE USER (Admin Only)
# ==========================================================

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin")),
):

    updated = crud.update_user(
        db,
        user_id,
        user
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return updated


# ==========================================================
# DELETE USER (Admin Only)
# ==========================================================

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("Admin")),
):

    deleted = crud.delete_user(
        db,
        user_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "message": "User deleted successfully"
    }