from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = None
    medical_id: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = None
    medical_id: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str