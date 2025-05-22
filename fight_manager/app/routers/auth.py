from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging

from ..database.database import get_db
from ..models.user import User
from ..schemas.auth import Token, UserCreate, User as UserSchema
from ..utils.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_admin_user
)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserSchema)
async def register_user(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    # Debug logging
    body = await request.body()
    print("Raw request body:", body)
    print("Content type:", request.headers.get("content-type"))
    print("User data received:", user_data.model_dump())

    # Check if username exists
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # Check if email exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_admin=user_data.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/register/admin", response_model=UserSchema)
async def register_admin(
    user_data: UserCreate = Body(...),  # Explicitly mark as request body
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Only existing admins can create new admin users."""
    user_data.is_admin = True
    return await register_user(user_data=user_data, db=db)
