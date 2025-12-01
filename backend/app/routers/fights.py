from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Request
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
from ..utils.auth import verify_token

router = APIRouter(prefix="/fights", tags=["fights"])

@router.get("", response_model=List[FightSchema])
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
            "weight_class", "duration",
            "fight_type"
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
                    fight_type=row["fight_type"].strip(),
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
    """Get the next fight that should be preparing (first non-started fight in order)"""
    try:
        # Get the first non-started, non-completed fight in sequential order
        # This is the next fight to prepare, regardless of which fight is currently ongoing
        ready_fight = db.query(Fight).filter(
            Fight.is_completed == False,
            Fight.actual_start.is_(None)
        ).order_by(Fight.fight_number).first()

        return ready_fight

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/next", response_model=List[FightSchema])
async def get_next_fights(limit: int = 5, db: Session = Depends(get_db)):
    """Get the next upcoming fights that haven't started yet"""
    try:
        # Get the ongoing fight and ready fight first
        ongoing_fight = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        # Get ready fight (first non-started fight in order)
        ready_fight = db.query(Fight).filter(
            Fight.is_completed == False,
            Fight.actual_start.is_(None)
        ).order_by(Fight.fight_number).first()

        # Get next fights after the ready fight
        next_fights_query = db.query(Fight).filter(
            Fight.actual_start.is_(None),
            Fight.is_completed == False
        )

        if ready_fight:
            # Show fights that come after the ready fight
            next_fights_query = next_fights_query.filter(
                Fight.fight_number > ready_fight.fight_number
            )

        next_fights = next_fights_query.order_by(Fight.fight_number).limit(limit).all()
        return next_fights

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/past", response_model=List[FightSchema])
async def get_past_fights(limit: int = 10, db: Session = Depends(get_db)):
    """Get completed fights ordered by completion time (most recent first)"""
    try:
        past_fights = db.query(Fight).filter(
            Fight.is_completed == True,
            Fight.actual_end.isnot(None)
        ).order_by(Fight.actual_end.desc()).limit(limit).all()

        return past_fights

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-times", response_model=List[FightSchema])
async def refresh_fight_times(db: Session = Depends(get_db), _: dict = Depends(verify_token)):
    """Force recalculation of all fight expected start times"""
    try:
        # Get the first fight to use as reference
        first_fight = db.query(Fight).order_by(Fight.fight_number).first()

        if not first_fight or not first_fight.expected_start:
            raise HTTPException(
                status_code=400,
                detail="No fights found or first fight has no expected start time"
            )

        # Check if there's an ongoing fight
        ongoing_fight = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        if ongoing_fight:
            # If there's an ongoing fight, recalculate from after it
            from ..utils.config import FIGHT_DURATION_BUFFER_MINUTES
            next_time = ongoing_fight.actual_start + timedelta(
                minutes=ongoing_fight.duration + FIGHT_DURATION_BUFFER_MINUTES
            )
            update_fight_times(db, next_time, min_fight_number=ongoing_fight.fight_number + 1)
        else:
            # No ongoing fight, recalculate all from the first fight's expected start
            update_fight_times(db, first_fight.expected_start)

        db.commit()

        # Return all fights in order
        return db.query(Fight).order_by(Fight.fight_number).all()

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to refresh times: {str(e)}")

@router.delete("", response_model=dict)
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

@router.post("/{fight_id}/cancel", response_model=FightSchema)
async def cancel_fight(
    fight_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)  # Add auth requirement
):
    """Cancel a fight by deleting it and updating subsequent fight numbers and times"""
    try:
        # Get the fight to cancel
        fight = db.query(Fight).filter(Fight.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.actual_start:
            raise HTTPException(status_code=400, detail="Cannot cancel a fight that has already started")

        if fight.is_completed:
            raise HTTPException(status_code=400, detail="Cannot cancel a completed fight")

        # Store fight data before deletion for return value
        fight_data = FightSchema.from_orm(fight)

        # Get all subsequent fights
        subsequent_fights = db.query(Fight).filter(
            Fight.fight_number > fight.fight_number
        ).order_by(Fight.fight_number).all()

        # Update fight numbers for subsequent fights
        for subsequent_fight in subsequent_fights:
            subsequent_fight.fight_number -= 1

        # Delete the fight
        db.delete(fight)

        # Update times for all remaining fights
        first_fight = db.query(Fight).order_by(Fight.fight_number).first()
        if first_fight and first_fight.expected_start:
            update_fight_times(db, first_fight.expected_start)

        try:
            db.commit()
        except Exception as commit_error:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to commit changes: {str(commit_error)}"
            )

        return fight_data

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel fight: {str(e)}"
        )

@router.patch("/{fight_id}", response_model=FightSchema)
async def update_fight(
    fight_id: str,
    fight_update: FightUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)  # Add auth requirement
):
    """Update a fight's details"""
    try:
        # Get the fight to update
        fight = db.query(Fight).filter(Fight.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.actual_start:
            raise HTTPException(status_code=400, detail="Cannot update a fight that has already started")

        if fight.is_completed:
            raise HTTPException(status_code=400, detail="Cannot update a completed fight")

        # Update fight fields if provided in the request
        for field, value in fight_update.dict(exclude_unset=True).items():
            setattr(fight, field, value)

        try:
            db.commit()
        except Exception as commit_error:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to commit changes: {str(commit_error)}"
            )

        return fight

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update fight: {str(e)}"
        )

@router.patch("/{fight_id}/number/{new_number}", response_model=List[FightSchema])
async def update_fight_number(
    fight_id: str,
    new_number: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    """Update a fight's number and reorder other fights accordingly"""
    try:
        # Get the fight to update
        fight = db.query(Fight).filter(Fight.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        # Get total number of fights
        total_fights = db.query(Fight).count()
        if new_number < 1 or new_number > total_fights:
            raise HTTPException(status_code=400, detail=f"Fight number must be between 1 and {total_fights}")

        # Get ongoing fight
        ongoing_fight = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        # Get ready fight (first non-started fight in order)
        ready_fight = db.query(Fight).filter(
            Fight.is_completed == False,
            Fight.actual_start.is_(None)
        ).order_by(Fight.fight_number).first()

        # Get the lowest fight number that can be modified
        # This will be the fight after the ready fight
        if ready_fight:
            next_available_fight = db.query(Fight).filter(
                Fight.expected_start > ready_fight.expected_start,
                Fight.is_completed == False
            ).order_by(Fight.expected_start).first()

            if next_available_fight:
                min_allowed_number = next_available_fight.fight_number
            else:
                raise HTTPException(
                    status_code=400,
                    detail="No fights available for reordering"
                )
        else:
            min_allowed_number = 1

        # Check if the fight being moved is allowed to be moved
        if fight.fight_number < min_allowed_number:
            raise HTTPException(
                status_code=400,
                detail="Cannot modify completed fights, ongoing fight, or next ready fight"
            )

        # Check if the new position is allowed
        if new_number < min_allowed_number:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot move fight before position {min_allowed_number}"
            )

        old_number = fight.fight_number

        # Update fight numbers for other fights
        if new_number > old_number:
            # Moving fight later in the order
            db.query(Fight).filter(
                Fight.fight_number > old_number,
                Fight.fight_number <= new_number,
                Fight.fight_number >= min_allowed_number
            ).update({Fight.fight_number: Fight.fight_number - 1})
        else:
            # Moving fight earlier in the order
            db.query(Fight).filter(
                Fight.fight_number >= new_number,
                Fight.fight_number < old_number,
                Fight.fight_number >= min_allowed_number
            ).update({Fight.fight_number: Fight.fight_number + 1})

        # Update the target fight's number
        fight.fight_number = new_number

        # Update expected start times for fights after ongoing/ready
        if ongoing_fight:
            # If there's an ongoing fight, calculate next time slot after it
            from datetime import timedelta
            from ..utils.config import FIGHT_DURATION_BUFFER_MINUTES
            next_time = ongoing_fight.actual_start + timedelta(
                minutes=ongoing_fight.duration + FIGHT_DURATION_BUFFER_MINUTES
            )
            # Only update fights after the ongoing one
            update_fight_times(db, next_time, min_fight_number=ongoing_fight.fight_number + 1)
        else:
            # No ongoing fight, recalculate all from the start
            first_fight = db.query(Fight).order_by(Fight.fight_number).first()
            if first_fight and first_fight.expected_start:
                update_fight_times(db, first_fight.expected_start)

        db.commit()

        # Return all fights in their new order
        return db.query(Fight).order_by(Fight.fight_number).all()

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update fight number: {str(e)}"
        )

@router.post("/add", response_model=FightSchema)
async def add_fight(
    fight: FightCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    """Add a new fight with proper positioning"""
    try:
        # Get ongoing fight
        ongoing_fight = db.query(Fight).filter(
            Fight.actual_start.isnot(None),
            Fight.actual_end.is_(None)
        ).first()

        # Get ready fight (first non-started fight in order)
        ready_fight = db.query(Fight).filter(
            Fight.is_completed == False,
            Fight.actual_start.is_(None)
        ).order_by(Fight.fight_number).first()

        # Get the lowest fight number that can be modified
        # This will be the fight after the ready fight
        if ready_fight:
            next_available_fight = db.query(Fight).filter(
                Fight.expected_start > ready_fight.expected_start,
                Fight.is_completed == False
            ).order_by(Fight.expected_start).first()

            if next_available_fight:
                min_allowed_number = next_available_fight.fight_number
            else:
                # If no next available fight, add at the end
                last_fight = db.query(Fight).order_by(Fight.fight_number.desc()).first()
                min_allowed_number = (last_fight.fight_number + 1) if last_fight else 1
        else:
            min_allowed_number = 1

        # Determine the position to insert the new fight
        position = fight.position if fight.position is not None else min_allowed_number

        # Validate the position
        if position < min_allowed_number:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot add fight before position {min_allowed_number} due to ongoing or ready fights"
            )

        # Get total number of fights
        total_fights = db.query(Fight).count()

        # If position is beyond the current last fight, adjust it to be the next number
        if position > total_fights + 1:
            position = total_fights + 1

        # Calculate the expected start time for the new fight
        base_time = None
        if ongoing_fight:
            # If there's an ongoing fight, base the time on it
            base_time = ongoing_fight.actual_start + timedelta(minutes=ongoing_fight.duration + 2)

            # If we're inserting after the ready fight, adjust base time
            if ready_fight and position > ready_fight.fight_number:
                base_time = ready_fight.expected_start + timedelta(minutes=ready_fight.duration + 2)
        else:
            # If no ongoing fight, use the ready fight's time or now
            base_time = ready_fight.expected_start if ready_fight else datetime.now()

        # Create the new fight with calculated expected_start
        new_fight = Fight(
            id=str(uuid.uuid4()),
            fight_number=position,
            fighter_a=fight.fighter_a,
            fighter_a_club=fight.fighter_a_club,
            fighter_b=fight.fighter_b,
            fighter_b_club=fight.fighter_b_club,
            weight_class=fight.weight_class,
            duration=fight.duration,
            fight_type=fight.fight_type,
            expected_start=base_time,
            is_completed=False
        )
        db.add(new_fight)

        # Update fight numbers for existing fights to make room
        db.query(Fight).filter(
            Fight.fight_number >= position,
            Fight.fight_number >= min_allowed_number
        ).update({Fight.fight_number: Fight.fight_number + 1})

        # Commit the new fight and number updates first
        db.commit()

        # Now update all expected start times for fights after the ongoing/ready fight
        if ongoing_fight:
            subsequent_fights = db.query(Fight).filter(
                Fight.fight_number > ongoing_fight.fight_number,
                Fight.id != ongoing_fight.id
            ).order_by(Fight.fight_number).all()
        else:
            subsequent_fights = db.query(Fight).filter(
                Fight.is_completed == False
            ).order_by(Fight.fight_number).all()

        current_time = base_time
        for fight in subsequent_fights:
            if fight.id != new_fight.id and not fight.actual_start:
                fight.expected_start = current_time
                current_time += timedelta(minutes=fight.duration + 2)

        try:
            db.commit()
        except Exception as commit_error:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to commit changes: {str(commit_error)}"
            )

        # Return all fights in their new order to ensure proper update in frontend
        return new_fight

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add fight: {str(e)}"
        )

@router.delete("/{fight_id}", response_model=dict)
async def delete_fight(
    fight_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)  # Add auth requirement
):
    """Delete a specific fight and adjust subsequent fight numbers and times"""
    try:
        # Get the fight to delete
        fight = db.query(Fight).filter(Fight.id == fight_id).first()
        if not fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        if fight.actual_start:
            raise HTTPException(status_code=400, detail="Cannot delete a fight that has already started")

        # Get all subsequent fights before deletion
        subsequent_fights = db.query(Fight).filter(
            Fight.fight_number > fight.fight_number
        ).order_by(Fight.fight_number).all()

        # Update fight numbers for subsequent fights
        for subsequent_fight in subsequent_fights:
            subsequent_fight.fight_number -= 1

        # Delete the fight
        db.delete(fight)

        # Update times for all remaining fights
        first_fight = db.query(Fight).order_by(Fight.fight_number).first()
        if first_fight and first_fight.expected_start:
            update_fight_times(db, first_fight.expected_start)

        try:
            db.commit()
        except Exception as commit_error:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to commit changes: {str(commit_error)}"
            )

        return {"message": "Fight deleted successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete fight: {str(e)}"
        )
