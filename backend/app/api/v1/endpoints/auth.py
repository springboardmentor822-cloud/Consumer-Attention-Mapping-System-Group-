import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    hash_password,
    verify_password,
)
from app.database import get_db
from app.models.user import EmailVerificationToken, PasswordResetToken, RefreshToken, User
from app.schemas.auth import (
    EmailVerificationConfirm,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshRequest,
    Token,
    UserCreate,
    UserOut,
)
from app.services.email_service import send_password_reset_email, send_verification_email

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = generate_secure_token()
    db.add(
        EmailVerificationToken(
            token=token,
            user_id=user.id,
            expires_at=dt.datetime.utcnow()
            + dt.timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS),
        )
    )
    db.commit()
    send_verification_email(user.email, token)

    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password or not verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is disabled")

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token, expires_at = create_refresh_token(subject=str(user.id))

    db.add(RefreshToken(token=refresh_token, user_id=user.id, expires_at=expires_at))
    db.commit()

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_row = (
        db.query(RefreshToken)
        .filter(RefreshToken.token == payload.refresh_token, RefreshToken.revoked.is_(False))
        .first()
    )
    if not token_row or token_row.expires_at < dt.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == token_row.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid user")

    # rotate refresh token
    token_row.revoked = True
    new_refresh_token, expires_at = create_refresh_token(subject=str(user.id))
    db.add(RefreshToken(token=new_refresh_token, user_id=user.id, expires_at=expires_at))
    db.commit()

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 202 regardless of whether the email exists, to avoid
    # leaking which addresses are registered.
    if user:
        token = generate_secure_token()
        db.add(
            PasswordResetToken(
                token=token,
                user_id=user.id,
                expires_at=dt.datetime.utcnow()
                + dt.timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
            )
        )
        db.commit()
        send_password_reset_email(user.email, token)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_row = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == payload.token, PasswordResetToken.used.is_(False))
        .first()
    )
    if not token_row or token_row.expires_at < dt.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.query(User).filter(User.id == token_row.user_id).first()
    user.hashed_password = hash_password(payload.new_password)
    token_row.used = True
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/verify-email")
def verify_email(payload: EmailVerificationConfirm, db: Session = Depends(get_db)):
    token_row = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.token == payload.token,
            EmailVerificationToken.used.is_(False),
        )
        .first()
    )
    if not token_row or token_row.expires_at < dt.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user = db.query(User).filter(User.id == token_row.user_id).first()
    user.is_verified = True
    token_row.used = True
    db.commit()
    return {"message": "Email verified successfully"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
