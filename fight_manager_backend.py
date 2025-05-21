from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal
from datetime import datetime, timedelta
import csv
import io
import uuid
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Float, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import os
from dotenv import load_dotenv
import enum

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
    fight_number = Column(Integer, nullable=False)
    fighter_a = Column(String, nullable=False)
    fighter_a_club = Column(String, nullable=False)
    fighter_b = Column(String, nullable=False)
    fighter_b_club = Column(String, nullable=False)
    weight_class = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)
    expected_start = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)

# Create tables
def recreate_tables():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

# Create tables on startup
recreate_tables()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Fight Manager API")

@app.get("/")
async def root():
    return {"message": "Fight Manager API is running"}

# Configure CORS with environment variable
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
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
    fight_number: int
    fighter_a: str
    fighter_a_club: str
    fighter_b: str
    fighter_b_club: str
    weight_class: int
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

    @field_validator('weight_class')
    def validate_weight_class(cls, v):
        if v <= 0:
            raise ValueError("Weight class must be positive")
        return v

def get_weight_class(weight: float) -> str:
    """Calculate weight class based on weight in kg"""
    weight_classes = [
        (52.2, "Flyweight"),
        (56.7, "Bantamweight"),
        (61.2, "Featherweight"),
        (65.8, "Lightweight"),
        (70.3, "Welterweight"),
        (77.1, "Middleweight"),
        (83.9, "Light Heavyweight"),
        (float('inf'), "Heavyweight")
    ]

    for limit, class_name in weight_classes:
        if weight <= limit:
            return class_name
    return "Heavyweight"

@app.get("/fights", response_model=List[Fight])
async def list_fights(db: Session = Depends(get_db)):
    try:
        fights = db.query(FightDB).order_by(FightDB.expected_start).all()
        return fights
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

@app.patch("/fights/reorder", response_model=List[Fight])
async def reorder_fights(fight_orders: List[dict], db: Session = Depends(get_db)):
    """Update the order of fights"""
    try:
        for order in fight_orders:
            fight = db.query(FightDB).filter(FightDB.id == order["id"]).first()
            if fight:
                fight.fight_number = order["fight_number"]

        # Recalculate expected start times based on new order
        all_fights = db.query(FightDB).order_by(FightDB.fight_number).all()
        current_time = datetime.now()

        for fight in all_fights:
            if not fight.actual_start:  # Only update non-started fights
                fight.expected_start = current_time
                current_time += timedelta(minutes=fight.duration + FIGHT_DURATION_BUFFER_MINUTES)

        db.commit()
        return all_fights
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.post("/fights/import")
async def import_fights(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        # Validate CSV structure
        required_fields = {
            "fighter_a", "fighter_a_club",
            "fighter_b", "fighter_b_club",
            "weight_class", "duration"
        }
        if not all(field in reader.fieldnames for field in required_fields):
            missing_fields = required_fields - set(reader.fieldnames or [])
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing_fields)}. Required fields are: {', '.join(required_fields)}"
            )

        # Clear existing fights that haven't started
        try:
            db.query(FightDB).filter(FightDB.actual_start.is_(None)).delete()
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error during delete: {str(e)}")

        start_time = datetime.now()
        imported_count = 0

        # Get the highest fight number
        try:
            last_fight = db.query(FightDB).order_by(FightDB.fight_number.desc()).first()
            next_fight_number = (last_fight.fight_number + 1) if last_fight else 1
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error getting fight number: {str(e)}")

        for row in reader:
            try:
                duration = int(row["duration"])
                weight_class = int(row["weight_class"])

                if duration <= 0 or duration > MAX_DURATION_MINUTES:
                    continue

                if weight_class <= 0:
                    continue

                fight = FightDB(
                    id=str(uuid.uuid4()),
                    fight_number=next_fight_number,
                    fighter_a=row["fighter_a"].strip(),
                    fighter_a_club=row["fighter_a_club"].strip(),
                    fighter_b=row["fighter_b"].strip(),
                    fighter_b_club=row["fighter_b_club"].strip(),
                    weight_class=weight_class,
                    duration=duration,
                    expected_start=start_time,
                    is_completed=False
                )
                db.add(fight)
                imported_count += 1
                next_fight_number += 1
                start_time += timedelta(minutes=duration + FIGHT_DURATION_BUFFER_MINUTES)
            except (ValueError, KeyError) as e:
                continue
            except SQLAlchemyError as e:
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Database error adding fight: {str(e)}")

        try:
            db.commit()
            return {"imported": imported_count}
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error during commit: {str(e)}")

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def update_subsequent_fights(db: Session, reference_fight: FightDB, start_time: datetime):
    """Update expected start times for all fights after the reference fight"""
    subsequent_fights = db.query(FightDB).filter(
        FightDB.expected_start > reference_fight.expected_start,
        FightDB.actual_start.is_(None)  # Only update fights that haven't started yet
    ).order_by(FightDB.expected_start).all()

    current_time = start_time
    for fight in subsequent_fights:
        if fight.id != reference_fight.id:  # Don't update the reference fight itself
            fight.expected_start = current_time
            current_time += timedelta(minutes=fight.duration + FIGHT_DURATION_BUFFER_MINUTES)

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

        current_time = datetime.now()
        fight.actual_start = current_time
        fight.expected_start = current_time  # Update this fight's expected start

        # Calculate next available start time for subsequent fights
        next_start = current_time + timedelta(minutes=fight.duration + FIGHT_DURATION_BUFFER_MINUTES)

        # Update subsequent fights
        update_subsequent_fights(db, fight, next_start)

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

        current_time = datetime.now()
        fight.actual_end = current_time
        fight.is_completed = True

        # Calculate start time for next fights based on actual end time
        next_start = current_time + timedelta(minutes=FIGHT_DURATION_BUFFER_MINUTES)

        # Update subsequent fights
        update_subsequent_fights(db, fight, next_start)

        db.commit()
        return fight

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.post("/fights/{fight_id}/reset", response_model=Fight)
async def reset_fight(fight_id: str, db: Session = Depends(get_db)):
    try:
        fight = db.query(FightDB).filter(FightDB.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        fight.actual_start = None
        fight.actual_end = None
        fight.is_completed = False
        db.commit()
        return fight

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.get("/fights/ongoing", response_model=Optional[Fight])
async def get_ongoing_fight(db: Session = Depends(get_db)):
    """Get the currently ongoing fight"""
    try:
        ongoing_fight = db.query(FightDB).filter(
            FightDB.actual_start.isnot(None),
            FightDB.actual_end.is_(None)
        ).first()

        return ongoing_fight

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.get("/fights/ready", response_model=Optional[Fight])
async def get_ready_fight(db: Session = Depends(get_db)):
    """Get the next fight that should be preparing"""
    try:
        # First get the ongoing fight
        ongoing_fight = db.query(FightDB).filter(
            FightDB.actual_start.isnot(None),
            FightDB.actual_end.is_(None)
        ).first()

        if ongoing_fight:
            # Get the next non-completed fight after the ongoing one
            ready_fight = db.query(FightDB).filter(
                FightDB.expected_start > ongoing_fight.expected_start,
                FightDB.is_completed == False
            ).order_by(FightDB.expected_start).first()
        else:
            # If no ongoing fight, get the next non-completed fight
            ready_fight = db.query(FightDB).filter(
                FightDB.is_completed == False,
                FightDB.actual_start.is_(None)
            ).order_by(FightDB.expected_start).first()

        return ready_fight

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.delete("/fights", response_model=dict)
async def clear_all_fights(db: Session = Depends(get_db)):
    """Clear all fights from the database"""
    try:
        db.query(FightDB).delete()
        db.commit()
        return {"message": "All fights cleared successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.post("/fights/{fight_id}/cancel", response_model=Fight)
async def cancel_fight(fight_id: str, db: Session = Depends(get_db)):
    """Cancel a fight and move it to the end of the schedule"""
    try:
        # Get the fight to cancel
        fight = db.query(FightDB).filter(FightDB.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.actual_start:
            raise HTTPException(status_code=400, detail="Cannot cancel a fight that has already started")

        if fight.is_completed:
            raise HTTPException(status_code=400, detail="Cannot cancel a completed fight")

        # Find the last scheduled fight
        last_fight = db.query(FightDB).order_by(FightDB.expected_start.desc()).first()

        # Calculate new start time for the canceled fight
        if last_fight and last_fight.id != fight_id:
            new_start = last_fight.expected_start + timedelta(minutes=last_fight.duration + FIGHT_DURATION_BUFFER_MINUTES)
        else:
            # If this is the only fight or the last fight, schedule it for now
            new_start = datetime.now() + timedelta(minutes=FIGHT_DURATION_BUFFER_MINUTES)

        old_start = fight.expected_start
        fight.expected_start = new_start

        # Update the schedule for fights that were after this one
        subsequent_fights = db.query(FightDB).filter(
            FightDB.expected_start > old_start,
            FightDB.id != fight_id
        ).order_by(FightDB.expected_start).all()

        current_time = old_start
        for subsequent_fight in subsequent_fights:
            subsequent_fight.expected_start = current_time
            current_time += timedelta(minutes=subsequent_fight.duration + FIGHT_DURATION_BUFFER_MINUTES)

        db.commit()
        return fight

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.patch("/fights/{fight_id}/number/{new_number}", response_model=List[Fight])
async def update_fight_number(fight_id: str, new_number: int, db: Session = Depends(get_db)):
    """Update a fight's number and reorder other fights accordingly"""
    try:
        # Start a transaction
        db.begin()

        # Get all non-started fights in a single query, ordered by fight number
        fights = db.query(FightDB).filter(
            FightDB.actual_start.is_(None)
        ).order_by(FightDB.fight_number).all()

        # Find the fight to update and validate
        fight_to_update = next((f for f in fights if f.id == fight_id), None)
        if not fight_to_update:
            db.rollback()
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight_to_update.actual_start:
            db.rollback()
            raise HTTPException(status_code=400, detail="Cannot reorder a fight that has already started")

        # Validate the new number
        total_fights = len(fights)
        if new_number < 1 or new_number > total_fights:
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Fight number must be between 1 and {total_fights}")

        old_number = fight_to_update.fight_number

        # Skip if no change
        if new_number == old_number:
            db.rollback()
            return db.query(FightDB).order_by(FightDB.fight_number).all()

        # Update fight numbers in memory first
        if new_number > old_number:
            # Moving fight later in the order
            for fight in fights:
                if old_number < fight.fight_number <= new_number:
                    fight.fight_number -= 1
        else:
            # Moving fight earlier in the order
            for fight in fights:
                if new_number <= fight.fight_number < old_number:
                    fight.fight_number += 1

        fight_to_update.fight_number = new_number

        # Update expected start times
        current_time = datetime.now()
        for fight in sorted(fights, key=lambda x: x.fight_number):
            if not fight.actual_start:  # Only update non-started fights
                fight.expected_start = current_time
                current_time += timedelta(minutes=fight.duration + FIGHT_DURATION_BUFFER_MINUTES)

        # Commit all changes in a single transaction
        db.commit()

        # Return all fights in their new order
        return db.query(FightDB).order_by(FightDB.fight_number).all()

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/fights/next", response_model=List[Fight])
async def get_next_fights(limit: int = 5, db: Session = Depends(get_db)):
    """Get the upcoming fights that haven't started yet"""
    try:
        # Get the ongoing fight first to use its expected_start as reference
        ongoing_fight = db.query(FightDB).filter(
            FightDB.actual_start.isnot(None),
            FightDB.actual_end.is_(None)
        ).first()

        if ongoing_fight:
            # Get fights after the ongoing one
            next_fights = db.query(FightDB).filter(
                FightDB.expected_start > ongoing_fight.expected_start,
                FightDB.is_completed == False
            ).order_by(FightDB.expected_start).limit(limit).all()
        else:
            # If no ongoing fight, get the next non-completed fights
            next_fights = db.query(FightDB).filter(
                FightDB.is_completed == False,
                FightDB.actual_start.is_(None)
            ).order_by(FightDB.expected_start).limit(limit).all()

        return next_fights

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error occurred")

@app.get("/fights/past", response_model=List[Fight])
async def get_past_fights(limit: int = 10, db: Session = Depends(get_db)):
    """Get the completed fights"""
    try:
        past_fights = db.query(FightDB).filter(
            FightDB.is_completed == True
        ).order_by(FightDB.actual_end.desc()).limit(limit).all()

        return past_fights

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error occurred")
