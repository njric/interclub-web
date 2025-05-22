from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
import csv
import io
import uuid

from ..database.database import get_db
from ..models.fight import Fight
from ..schemas.fight import (
    Fight as FightSchema,
    FightCreate,
    FightUpdate,
    StartTimeUpdate
)
from ..utils.time import update_fight_times, update_subsequent_fights

router = APIRouter(prefix="/fights", tags=["fights"])

@router.get("/", response_model=List[FightSchema])
async def list_fights(db: Session = Depends(get_db)):
    try:
        fights = db.query(Fight).order_by(Fight.expected_start).all()
        return fights
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
async def import_fights(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        required_fields = {
            "fighter_a", "fighter_a_club",
            "fighter_b", "fighter_b_club",
            "weight_class", "duration"
        }
        if not all(field in reader.fieldnames for field in required_fields):
            missing_fields = required_fields - set(reader.fieldnames or [])
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {', '.join(missing_fields)}"
            )

        # Clear existing fights that haven't started
        db.query(Fight).filter(Fight.actual_start.is_(None)).delete()

        start_time = datetime.now()
        imported_count = 0

        # Get the highest fight number
        last_fight = db.query(Fight).order_by(Fight.fight_number.desc()).first()
        next_fight_number = (last_fight.fight_number + 1) if last_fight else 1

        for row in reader:
            try:
                duration = int(row["duration"])
                weight_class = int(row["weight_class"])

                if duration <= 0 or duration > 60:  # MAX_DURATION_MINUTES
                    continue

                if weight_class <= 0:
                    continue

                fight = Fight(
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
                start_time += timedelta(minutes=duration + 2)  # FIGHT_DURATION_BUFFER_MINUTES
            except (ValueError, KeyError):
                continue

        db.commit()
        return {"imported": imported_count}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/start-time")
async def set_start_time(start_time: StartTimeUpdate, db: Session = Depends(get_db)):
    """Set the start time for all fights."""
    try:
        # Parse the time string (HH:mm:ss) and combine with today's date
        time_parts = [int(x) for x in start_time.start_time.split(':')]
        if len(time_parts) < 2:
            raise ValueError("Invalid time format")

        now = datetime.now()
        new_start_time = now.replace(
            hour=time_parts[0],
            minute=time_parts[1],
            second=time_parts[2] if len(time_parts) > 2 else 0,
            microsecond=0
        )

        # Update all fight times
        updated_fights = update_fight_times(db, new_start_time)
        if not updated_fights:
            return {"message": "No fights to update"}

        return {"message": "Start time updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid time format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating start time: {str(e)}")

@router.post("/{fight_id}/start", response_model=FightSchema)
async def start_fight(fight_id: str, db: Session = Depends(get_db)):
    try:
        fight = db.query(Fight).filter(Fight.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.actual_start:
            raise HTTPException(status_code=400, detail="Fight already started")

        if fight.is_completed:
            raise HTTPException(status_code=400, detail="Fight already completed")

        # Check if there are any ongoing fights
        ongoing_fights = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        if ongoing_fights:
            raise HTTPException(status_code=400, detail="Another fight is in progress")

        current_time = datetime.now()
        fight.actual_start = current_time
        fight.expected_start = current_time

        # Calculate next available start time for subsequent fights
        next_start = current_time + timedelta(minutes=fight.duration + 2)  # FIGHT_DURATION_BUFFER_MINUTES

        # Update subsequent fights
        update_subsequent_fights(db, fight, next_start)

        db.commit()
        return fight

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{fight_id}/end", response_model=FightSchema)
async def end_fight(fight_id: str, db: Session = Depends(get_db)):
    try:
        fight = db.query(Fight).filter(Fight.id == fight_id).first()
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
        next_start = current_time + timedelta(minutes=2)  # FIGHT_DURATION_BUFFER_MINUTES

        # Update subsequent fights
        update_subsequent_fights(db, fight, next_start)

        db.commit()
        return fight

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ongoing", response_model=Optional[FightSchema])
async def get_ongoing_fight(db: Session = Depends(get_db)):
    """Get the currently ongoing fight"""
    try:
        ongoing_fight = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        return ongoing_fight

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ready", response_model=Optional[FightSchema])
async def get_ready_fight(db: Session = Depends(get_db)):
    """Get the next fight that should be preparing"""
    try:
        # First get the ongoing fight
        ongoing_fight = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        if ongoing_fight:
            # Get the next non-completed fight after the ongoing one
            ready_fight = db.query(Fight).filter(
                Fight.expected_start > ongoing_fight.expected_start,
                Fight.is_completed == False
            ).order_by(Fight.expected_start).first()
        else:
            # If no ongoing fight, get the next non-completed fight
            ready_fight = db.query(Fight).filter(
                Fight.is_completed == False,
                Fight.actual_start.is_(None)
            ).order_by(Fight.expected_start).first()

        return ready_fight

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=dict)
async def clear_all_fights(db: Session = Depends(get_db)):
    """Clear all fights from the database"""
    try:
        db.query(Fight).delete()
        db.commit()
        return {"message": "All fights cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
