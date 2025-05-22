from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.database import recreate_tables
from .routers import fights
from .utils.config import ALLOWED_ORIGINS

app = FastAPI(title="Fight Manager API")

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

# Create tables on startup
recreate_tables()

@app.get("/")
async def root():
    return {"message": "Fight Manager API is running"}
