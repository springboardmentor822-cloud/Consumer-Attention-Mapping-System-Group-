"""
Password reset token. Dev-mode only right now: no email delivery exists
(see config.py - no SMTP settings anywhere), so the token is returned
directly in the API response instead of being emailed. This must stay
clearly labeled as dev-mode in the API response and never silently
treated as "email sent" - that would misrepresent what actually happens.

Save this as: app/models/password_reset.py
Then add it to app/models/__init__.py following whatever pattern the
other models (camera.py, shopper_segment.py, etc.) already use there,
so create_all() picks up this table. Restart uvicorn after.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class PasswordResetToken(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    token: str = Field(unique=True, index=True)
    expires_at: datetime
    used: bool = Field(default=False)

    @staticmethod
    def default_expiry() -> datetime:
        return datetime.now(timezone.utc) + timedelta(minutes=15)
