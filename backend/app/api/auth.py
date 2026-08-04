from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.core.security import decode_access_token, create_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserRegister, UserResponse
from app.schemas.auth import TokenResponse
from app.services.auth_service import AuthService
from app.utils.logging import get_structured_logger
from pydantic import BaseModel, Field

logger = get_structured_logger("auth_api")
router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_user_email(user: Any) -> str:
    if isinstance(user, dict):
        return user.get("email", "")
    return getattr(user, "email", "")

def get_user_role(user: Any) -> str:
    if isinstance(user, dict):
        return user.get("role", "")
    if hasattr(user, "role") and hasattr(user.role, "name"):
        return user.role.name
    return ""

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        logger.warning("JWT validation failed: Invalid payload")
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        logger.warning("JWT validation failed: sub field missing")
        raise credentials_exception
        
    user = UserRepository.get_by_id(db, user_id)
    if user is None:
        logger.warning(f"JWT validation failed: User {user_id} not found")
        raise credentials_exception
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = get_user_role(current_user)
        user_email = get_user_email(current_user)
        if user_role not in self.allowed_roles:
            logger.warning(f"Role authorization failed: User {user_email} with role {user_role} requested access restricted to {self.allowed_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: one of {self.allowed_roles}"
            )
        return current_user


@router.post(
    "/register",
    response_model=UserResponse,
    summary="Register a new user",
    description="Creates a new user profile with a specific role and returns user details."
)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    from app.models.role import Role
    # Sanitize input email
    user_data.email = user_data.email.strip().lower()
    
    role = db.query(Role).filter(Role.id == user_data.role_id).first()
    if not role:
        logger.warning(f"Registration failed: Invalid role ID {user_data.role_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role ID specified"
        )
    user = AuthService.register_user(db, user_data)
    logger.info(f"User registered successfully: {user.email}", extra={"user_id": user.id, "email": user.email, "role": role.name})
    return UserResponse(
        id=user.id,
        email=user.email,
        role=role.name,
        is_active=user.is_active
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="User Login",
    description="Authenticate via username (email) and password to receive a JWT access token."
)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username_clean = form_data.username.strip().lower()
    try:
        user = AuthService.authenticate_user(db, username_clean, form_data.password)
    except Exception as e:
        logger.warning(f"Login failed for user {username_clean}: {str(e)}")
        raise e
        
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.name}
    )
    logger.info(f"User logged in successfully: {user.email}", extra={"user_id": user.id, "email": user.email, "role": user.role.name})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role.name,
        email=user.email
    )


@router.get(
    "/profile",
    response_model=UserResponse,
    summary="Get user profile",
    description="Retrieve the profile details of the currently authenticated user."
)
def get_profile(current_user: User = Depends(get_current_user)):
    user_role = get_user_role(current_user)
    user_email = get_user_email(current_user)
    user_id = current_user.get("id") if isinstance(current_user, dict) else current_user.id
    user_is_active = current_user.get("is_active") if isinstance(current_user, dict) else current_user.is_active
    return UserResponse(
        id=user_id,
        email=user_email,
        role=user_role,
        is_active=user_is_active
    )


# Administrator User Control APIs
require_admin = RoleChecker(["Administrator"])

class UserUpdate(BaseModel):
    role_id: int = Field(..., description="The new role ID for the user")
    is_active: bool = Field(..., description="Whether the user is active")

@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all users",
    description="Retrieve a list of all registered users (Administrator access required)."
)
def list_users(db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    users = db.query(User).all()
    return [UserResponse(
        id=u.id,
        email=u.email,
        role=u.role.name,
        is_active=u.is_active
    ) for u in users]


@router.put(
    "/users/{id}",
    response_model=UserResponse,
    summary="Update user details",
    description="Modify a user's role and activation status by ID (Administrator access required)."
)
def update_user(id: str, update_data: UserUpdate, db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        logger.warning(f"User update failed: User {id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    from app.models.role import Role
    role = db.query(Role).filter(Role.id == update_data.role_id).first()
    if not role:
        logger.warning(f"User update failed: Invalid role ID {update_data.role_id}")
        raise HTTPException(status_code=400, detail="Invalid role ID")
        
    user.role_id = update_data.role_id
    user.is_active = update_data.is_active
    db.commit()
    db.refresh(user)
    
    admin_email = get_user_email(current_user)
    logger.info(f"User {user.email} updated by Admin {admin_email}", extra={"target_user_id": user.id, "new_role": role.name, "is_active": user.is_active})
    return UserResponse(
        id=user.id,
        email=user.email,
        role=role.name,
        is_active=user.is_active
    )


@router.delete(
    "/users/{id}",
    summary="Delete a user",
    description="Permanently remove a user by ID (Administrator access required)."
)
def delete_user(id: str, db: Session = Depends(get_db), current_user: Any = Depends(require_admin)):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        logger.warning(f"User deletion failed: User {id} not found")
        raise HTTPException(status_code=404, detail="User not found")
    
    email = user.email
    db.delete(user)
    db.commit()
    
    admin_email = get_user_email(current_user)
    logger.info(f"User {email} deleted by Admin {admin_email}", extra={"target_user_id": id, "email": email})
    return {"status": "success", "message": "User deleted successfully"}
