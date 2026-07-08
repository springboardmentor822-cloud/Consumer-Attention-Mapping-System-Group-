from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from backend.app.services.auth_service import auth_service


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = auth_service.register(db, payload)
    return AuthResponse.model_validate(auth_service.build_auth_response(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = auth_service.authenticate(db, payload)
    return AuthResponse.model_validate(auth_service.build_auth_response(user))
