from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.token import RefreshToken
from app.schemas.user import UserRegister, UserResponse, UserLogin
from app.utils.hashing import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    get_refresh_token_expiry
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ─── Request Schemas ──────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str

# ─── Register ─────────────────────────────────────────────

@router.post("/register", response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hash_password(user_data.password),
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# ─── Login ────────────────────────────────────────────────

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create both tokens
    access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })
    refresh_token = create_refresh_token()

    # Save refresh token to database
    db_token = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=get_refresh_token_expiry()
    )
    db.add(db_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

# ─── Refresh ──────────────────────────────────────────────

@router.post("/refresh")
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Use this when access token expires.
    Send the refresh token, get a new access token back.
    """
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token,
        RefreshToken.is_revoked == False
    ).first()

    if not db_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )

    if db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=401,
            detail="Refresh token has expired, please login again"
        )

    user = db.query(User).filter(User.id == db_token.user_id).first()
    new_access_token = create_access_token({
        "sub": str(user.id),
        "role": user.role
    })

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

# ─── Logout ───────────────────────────────────────────────

@router.post("/logout")
def logout(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Logout by revoking the refresh token.
    After this, the refresh token can no longer be used.
    """
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == request.refresh_token
    ).first()

    if db_token:
        db_token.is_revoked = True
        db.commit()

    return {"message": "Logged out successfully"}

# ─── Get current user (protected route example) ───────────

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Protected route — requires a valid access token.
    Returns the currently logged in user's details.
    """
    return current_user