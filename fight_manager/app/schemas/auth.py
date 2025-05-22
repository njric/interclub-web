from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr
    is_admin: bool = False
    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str

class User(UserBase):
    is_active: bool
