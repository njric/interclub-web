from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, timedelta
import csv
import io
import uuid
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/fightdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class FightDB(Base):
    __tablename__ = "fights"

    id = Column(String, primary_key=True, index=True)
    fighter_a = Column(String, nullable=False)
    fighter_b = Column(String, nullable=False)
    duration = Column(Integer, nullable=False)
    expected_start = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)

# Create tables
Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Fight Manager API")

# Configure CORS with environment variable
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
FIGHT_DURATION_BUFFER_MINUTES = int(os.getenv("FIGHT_DURATION_BUFFER_MINUTES", "2"))
MAX_DURATION_MINUTES = int(os.getenv("MAX_DURATION_MINUTES", "60"))

# Pydantic models with validation
class FightUpdate(BaseModel):
    fighter_a: Optional[str] = None
    fighter_b: Optional[str] = None

    @field_validator('fighter_a', 'fighter_b')
    def validate_fighter_name(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError("Fighter name cannot be empty")
            if len(v) > 100:
                raise ValueError("Fighter name too long")
        return v

class Fight(BaseModel):
    id: str
    fighter_a: str
    fighter_b: str
    duration: int
    expected_start: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    is_completed: bool = False

    class Config:
        orm_mode = True

    @field_validator('duration')
    def validate_duration(cls, v):
        if v <= 0 or v > MAX_DURATION_MINUTES:
            raise ValueError(f"Duration must be between 1 and {MAX_DURATION_MINUTES} minutes")
        return v

@app.get("/fights", response_model=List[Fight])
async def list_fights(db: Session = Depends(get_db)):
    try:
        return db.query(FightDB).order_by(FightDB.expected_start).all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.patch("/fights/{fight_id}", response_model=Fight)
async def update_fight(fight_id: str, update: FightUpdate, db: Session = Depends(get_db)):
    try:
        fight = db.query(FightDB).filter(FightDB.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.is_completed:
            raise HTTPException(status_code=400, detail="Cannot update completed fight")

        if update.fighter_a is not None:
            fight.fighter_a = update.fighter_a
        if update.fighter_b is not None:
            fight.fighter_b = update.fighter_b

        db.commit()
        return fight
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.post("/fights/import")
async def import_fights(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        # Validate CSV structure
        required_fields = {"fighter_a", "fighter_b", "duration"}
        if not all(field in reader.fieldnames for field in required_fields):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain fields: {', '.join(required_fields)}"
            )

        # Clear existing fights that haven't started
        db.query(FightDB).filter(FightDB.actual_start.is_(None)).delete()

        start_time = datetime.now()
        imported_count = 0

        for row in reader:
            try:
                duration = int(row["duration"])
                if duration <= 0 or duration > MAX_DURATION_MINUTES:
                    continue  # Skip invalid durations

                fight = FightDB(
                    id=str(uuid.uuid4()),
                    fighter_a=row["fighter_a"].strip(),
                    fighter_b=row["fighter_b"].strip(),
                    duration=duration,
                    expected_start=start_time,
                    is_completed=False
                )
                db.add(fight)
                imported_count += 1
                start_time += timedelta(minutes=duration + FIGHT_DURATION_BUFFER_MINUTES)
            except ValueError:
                continue  # Skip rows with invalid data

        db.commit()
        return {"imported": imported_count}

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/fights/{fight_id}/start", response_model=Fight)
async def start_fight(fight_id: str, db: Session = Depends(get_db)):
    try:
        fight = db.query(FightDB).filter(FightDB.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.actual_start:
            raise HTTPException(status_code=400, detail="Fight already started")

        if fight.is_completed:
            raise HTTPException(status_code=400, detail="Fight already completed")

        # Check if there are any ongoing fights
        ongoing_fights = db.query(FightDB).filter(
            FightDB.actual_start.isnot(None),
            FightDB.actual_end.is_(None)
        ).first()

        if ongoing_fights:
            raise HTTPException(status_code=400, detail="Another fight is in progress")

        fight.actual_start = datetime.now()
        db.commit()
        return fight

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.post("/fights/{fight_id}/end", response_model=Fight)
async def end_fight(fight_id: str, db: Session = Depends(get_db)):
    try:
        fight = db.query(FightDB).filter(FightDB.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if not fight.actual_start:
            raise HTTPException(status_code=400, detail="Fight hasn't started")

        if fight.actual_end:
            raise HTTPException(status_code=400, detail="Fight already ended")

        fight.actual_end = datetime.now()
        fight.is_completed = True
        db.commit()
        return fight

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")
