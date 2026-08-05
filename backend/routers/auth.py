from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import schemas
from database import get_db

from auth_services import (
    register_user,
    login_user,
    get_all_users,
    get_user_by_id,
    delete_user,
    update_user_role
)

router = APIRouter()

# ==========================================================
# REGISTER
# ==========================================================

@router.post("/register")
def register(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    try:

        new_user = register_user(db, user)

        if new_user is None:
            raise HTTPException(
                status_code=400,
                detail="Email already registered."
            )

        return {
            "message": "User Registered Successfully",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "role": new_user.role
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }


# ==========================================================
# LOGIN
# ==========================================================

@router.post("/login")
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    try:

        result = login_user(
            db,
            user.email,
            user.password
        )

        if result is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid Email or Password"
            )

        return result

    except HTTPException:
        raise

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }


# ==========================================================
# GET ALL USERS
# ==========================================================

@router.get("/users")
def get_users(
    db: Session = Depends(get_db)
):
    try:
        return get_all_users(db)

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }


# ==========================================================
# GET USER BY ID
# ==========================================================

@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:

        user = get_user_by_id(
            db,
            user_id
        )

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user

    except HTTPException:
        raise

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }


# ==========================================================
# UPDATE USER ROLE
# ==========================================================

@router.put("/users/{user_id}/role")
def change_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db)
):
    try:

        user = update_user_role(
            db,
            user_id,
            role
        )

        if user is None:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "message": "Role Updated Successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }


# ==========================================================
# DELETE USER
# ==========================================================

@router.delete("/users/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:

        deleted = delete_user(
            db,
            user_id
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return {
            "message": "User Deleted Successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__
        }