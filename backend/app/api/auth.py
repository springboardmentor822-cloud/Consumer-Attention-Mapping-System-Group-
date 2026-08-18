import re
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select, func

from app.core.db import get_session
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.models.user import User, Role
from app.models.event_log import EventCategory
from app.services.audit import log_event
from app.models.password_reset import PasswordResetToken
from pydantic import BaseModel, EmailStr, field_validator
import uuid
import smtplib
from email.message import EmailMessage

router = APIRouter()

_optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user_optional(
    token: str | None = Depends(_optional_oauth2_scheme),
    session: Session = Depends(get_session),
) -> User | None:
    """Same as get_current_user but returns None instead of raising when
    no/invalid token is present. Needed for /register, which must allow
    zero-auth access ONLY during first-run bootstrap (see register())."""
    if token is None:
        return None
    payload = decode_access_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    try:
        user_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return None
    user = session.get(User, user_uuid)
    if user is None or not user.is_active:
        return None
    return user

PASSWORD_MIN_LENGTH = 8


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role_name: str = "Analyst"  # defaults to lowest-privilege role

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < PASSWORD_MIN_LENGTH:
            raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    # Only populated in development mode. Production never exposes the token.
    dev_reset_token: str | None = None
    message: str
    warning: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < PASSWORD_MIN_LENGTH:
            raise ValueError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[^A-Za-z0-9]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class MeResponse(BaseModel):
    id: str
    email: str
    role_name: str | None


def _no_users_exist(session: Session) -> bool:
    count = session.exec(select(func.count()).select_from(User)).one()
    return count == 0


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional),
):
    # SECURITY: previously this endpoint was fully open - anyone could
    # register themselves as SuperAdmin with no auth at all. Fixed rule:
    # registration is open ONLY when the user table is empty (first-run
    # bootstrap, so you can create the very first SuperAdmin without a
    # chicken-and-egg problem). Once at least one user exists, registering
    # a NEW account requires an authenticated SuperAdmin.
    if not _no_users_exist(session):
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to register new users",
            )
        role_name = current_user.role.name if current_user.role else None
        if role_name != "SuperAdmin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only SuperAdmin may register new users",
            )

    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = session.exec(select(Role).where(Role.name == payload.role_name)).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Unknown role: {payload.role_name}")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    log_event(
        session=session,
        category=EventCategory.audit,
        event_type="user_created",
        description=f"User account created: {user.email}",
        actor_user_id=current_user.id if current_user else None,
        target_type="user",
        target_id=user.id,
        metadata={"role": role.name, "bootstrap": current_user is None},
    )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    ip_address = request.client.host if request.client else None

    attempted_user = session.exec(
        select(User).where(User.email == form_data.username)
    ).first()

    log_event(
        session=session,
        category=EventCategory.security,
        event_type="login_attempt",
        description=f"Login attempt for {form_data.username}",
        actor_user_id=attempted_user.id if attempted_user else None,
        target_type="user" if attempted_user else None,
        target_id=attempted_user.id if attempted_user else None,
        metadata={"username": form_data.username},
        ip_address=ip_address,
    )

    user = attempted_user
    if not user or not verify_password(form_data.password, user.hashed_password):
        log_event(
            session=session,
            category=EventCategory.security,
            event_type="login_failed",
            description=f"Failed login for {form_data.username}",
            actor_user_id=user.id if user else None,
            target_type="user" if user else None,
            target_id=user.id if user else None,
            metadata={"username": form_data.username},
            ip_address=ip_address,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return MeResponse(
        id=str(current_user.id),
        email=current_user.email,
        role_name=current_user.role.name if current_user.role else None,
    )


def _send_password_reset_email(recipient: str, token: str) -> None:
    if not all((settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL)):
        raise RuntimeError("SMTP password-reset email is not configured")

    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/forgot-password?token={token}"
    message = EmailMessage()
    message["Subject"] = "Consumer Attention Mapping password reset"
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = recipient
    message.set_content(
        "A password reset was requested for your Consumer Attention Mapping account.\n\n"
        f"Reset your password here: {reset_url}\n\n"
        "This link uses a one-time token and expires according to the server reset-token policy. "
        "If you did not request this, you can ignore this email."
    )

    if settings.SMTP_USE_TLS:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            smtp.send_message(message)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account with that email")

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=secrets.token_urlsafe(32),
        expires_at=PasswordResetToken.default_expiry(),
    )
    session.add(reset_token)
    session.commit()

    if settings.DEV_PASSWORD_RESET:
        return ForgotPasswordResponse(
            dev_reset_token=reset_token.token,
            message="Development reset token generated.",
            warning="DEV MODE ONLY: no email was sent. Token returned directly for local testing.",
        )

    try:
        _send_password_reset_email(user.email, reset_token.token)
    except Exception as exc:
        # Do not expose SMTP credentials/configuration details to clients.
        session.delete(reset_token)
        session.commit()
        raise HTTPException(
            status_code=503,
            detail="Password reset email service is not configured or unavailable",
        ) from exc

    return ForgotPasswordResponse(
        message="If the account exists, a password reset email has been sent.",
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_session)):
    reset_token = session.exec(
        select(PasswordResetToken).where(PasswordResetToken.token == payload.token)
    ).first()

    if not reset_token or reset_token.used:
        raise HTTPException(status_code=400, detail="Invalid or already-used token")

    if reset_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")

    user = session.get(User, reset_token.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used = True
    session.add(user)
    session.add(reset_token)
    session.commit()

    log_event(
        session=session,
        category=EventCategory.security,
        event_type="password_update",
        description=f"Password reset completed for {user.email}",
        actor_user_id=user.id,
        target_type="user",
        target_id=user.id,
        metadata={"method": "password_reset_token"},
    )

    return {"status": "password updated"}
