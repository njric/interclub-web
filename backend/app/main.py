from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .database.database import create_tables
from .routers import fights, auth
from .utils.config import ALLOWED_ORIGINS

# Forcer le fuseau horaire local
os.environ['TZ'] = 'Europe/Paris'

app = FastAPI(title="Fight Manager API", redirect_slashes=False)

# Configure CORS with environment variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(fights.router)
app.include_router(auth.router)

# Create tables on startup (preserves existing data)
create_tables()

@app.get("/")
async def root():
    return {"message": "Fight Manager API is running"}
