from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models

from database import get_db
from utils.jwt_handler import verify_token

# ==========================================================
# OAuth2 Scheme
# ==========================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ==========================================================
# GET CURRENT USER
# ==========================================================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):

    try:

        payload = verify_token(token)

        email = payload.get("sub")

        if email is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        user = (
            db.query(models.User)
            .filter(models.User.email == email)
            .first()
        )

        if user is None:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        if not user.is_active:

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )

        return user

    except HTTPException:
        raise

    except Exception:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# ==========================================================
# ADMIN ONLY
# ==========================================================

def require_admin(

    current_user: models.User = Depends(get_current_user),

):

    if current_user.role.lower() != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


# ==========================================================
# STORE MANAGER ONLY
# ==========================================================

def require_store_manager(

    current_user: models.User = Depends(get_current_user),

):

    if current_user.role.lower() != "store manager":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Store Manager access required",
        )

    return current_user


# ==========================================================
# MARKETING MANAGER ONLY
# ==========================================================

def require_marketing_manager(

    current_user: models.User = Depends(get_current_user),

):

    if current_user.role.lower() != "marketing manager":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Marketing Manager access required",
        )

    return current_user


# ==========================================================
# RETAIL ANALYST ONLY
# ==========================================================

def require_retail_analyst(

    current_user: models.User = Depends(get_current_user),

):

    if current_user.role.lower() != "retail analyst":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Retail Analyst access required",
        )

    return current_user


# ==========================================================
# ADMIN OR STORE MANAGER
# ==========================================================

def require_admin_or_store_manager(

    current_user: models.User = Depends(get_current_user),

):

    allowed_roles = [
        "admin",
        "store manager",
    ]

    if current_user.role.lower() not in allowed_roles:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return current_user


# ==========================================================
# ADMIN OR MARKETING MANAGER
# ==========================================================

def require_admin_or_marketing_manager(

    current_user: models.User = Depends(get_current_user),

):

    allowed_roles = [
        "admin",
        "marketing manager",
    ]

    if current_user.role.lower() not in allowed_roles:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return current_user


# ==========================================================
# ADMIN OR RETAIL ANALYST
# ==========================================================

def require_admin_or_retail_analyst(

    current_user: models.User = Depends(get_current_user),

):

    allowed_roles = [
        "admin",
        "retail analyst",
    ]

    if current_user.role.lower() not in allowed_roles:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return current_user


# ==========================================================
# ANY AUTHENTICATED USER
# ==========================================================

def require_authenticated_user(

    current_user: models.User = Depends(get_current_user),

):

    return current_user
from fastapi import Depends, HTTPException, status

def require_roles(*allowed_roles):
    def role_checker(
        current_user: models.User = Depends(get_current_user),
    ):
        user_role = (current_user.role or "").strip().lower()

        allowed = {
            role.strip().lower()
            for role in allowed_roles
        }

        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return current_user

    return role_checker