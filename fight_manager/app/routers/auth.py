from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
import jwt
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the root directory
root_dir = Path(__file__).resolve().parents[3]  # Go up 3 levels to reach the root
load_dotenv(root_dir / '.env')

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# Get credentials from environment variables
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

print(f"Loaded credentials - Username: {ADMIN_USERNAME}")  # Debug log

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    print(f"Login attempt - Username: {form_data.username}")  # Debug log

    if form_data.username != ADMIN_USERNAME or form_data.password != ADMIN_PASSWORD:
        print(f"Login failed - Expected: {ADMIN_USERNAME}, Got: {form_data.username}")  # Debug log
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": form_data.username}
    )
    return {"token": access_token}
