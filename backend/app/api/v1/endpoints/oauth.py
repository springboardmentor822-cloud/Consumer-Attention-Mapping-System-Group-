"""
Google OAuth2 "Sign in with Google" flow.

This is fully wired up (authorization redirect + token exchange + user
provisioning) but requires real GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
values in .env to actually work end-to-end, since that requires a
registered OAuth app in Google Cloud Console.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.database import get_db
from app.models.enums import RoleEnum
from app.models.user import RefreshToken, User
from app.schemas.auth import Token

router = APIRouter()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google/login")
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=501,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.",
        )
    params = (
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback", response_model=Token)
async def google_callback(code: str, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange OAuth code")
        google_tokens = token_resp.json()

        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {google_tokens['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")
        profile = userinfo_resp.json()

    user = db.query(User).filter(User.email == profile["email"]).first()
    if not user:
        user = User(
            full_name=profile.get("name", profile["email"]),
            email=profile["email"],
            hashed_password=None,
            role=RoleEnum.RETAIL_ANALYST,
            is_active=True,
            is_verified=True,
            oauth_provider="google",
            oauth_sub=profile.get("sub"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token, expires_at = create_refresh_token(subject=str(user.id))
    db.add(RefreshToken(token=refresh_token, user_id=user.id, expires_at=expires_at))
    db.commit()

    return Token(access_token=access_token, refresh_token=refresh_token)
