from datetime import datetime, timedelta
import hashlib
import hmac
import os
from jose import jwt

SECRET_KEY = "my-super-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if password matches"""
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    """Hash a password using SHA256 (simple and reliable)"""
    salt = "consumer-attention-salt"
    return hashlib.sha256((salt + password).encode()).hexdigest()

def create_access_token(data: dict) -> str:
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt