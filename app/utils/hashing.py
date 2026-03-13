import bcrypt
import secrets
from jose import jwt
from datetime import datetime, timedelta
from app.config import settings

# ─── Password Hashing ────────────────────────────────────

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

# ─── Access Token (JWT) ───────────────────────────────────

def create_access_token(data: dict) -> str:
    """
    Creates a short-lived JWT access token (expires in 30 mins).
    This is what the frontend sends with every API request.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

def verify_access_token(token: str) -> dict:
    """
    Verifies and decodes a JWT token.
    Returns the payload (user id, role) if valid.
    Raises an error if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except Exception:
        return None

# ─── Refresh Token ────────────────────────────────────────

def create_refresh_token() -> str:
    """
    Creates a long-lived random refresh token (expires in 7 days).
    This is stored in the database and used to get new access tokens.
    """
    return secrets.token_urlsafe(64)

def get_refresh_token_expiry() -> datetime:
    return datetime.utcnow() + timedelta(days=7)