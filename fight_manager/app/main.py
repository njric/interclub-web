from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import fights, auth
from .database.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fight Manager API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(fights.router)
app.include_router(auth.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Fight Manager API",
        "docs": "/docs",
        "redoc": "/redoc"
    }
