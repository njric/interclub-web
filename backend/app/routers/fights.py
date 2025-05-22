from datetime import datetime, time
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

router = APIRouter()

class FightBase(BaseModel):
    fighter_a: str
    fighter_a_club: str
    fighter_b: str
    fighter_b_club: str
    weight_class: int
    duration: int

class FightCreate(FightBase):
    position: Optional[int] = None

class FightUpdate(FightBase):
    pass

class FightStartTime(BaseModel):
    start_time: time

@router.post("/fights/start-time")
async def set_start_time(start_time: FightStartTime):
    """Set the start time for the first fight of the day."""
    try:
        # Update all fights to recalculate their expected start times
        # based on the new start time for the first fight
        fights = await get_all_fights()
        current_time = start_time.start_time

        for fight in fights:
            await update_fight_start_time(fight.id, current_time)
            # Add duration minutes to current_time for next fight
            current_time = (datetime.combine(datetime.today(), current_time) +
                          timedelta(minutes=fight.duration)).time()
        return {"message": "Start time updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fights/add")
async def add_fight(fight: FightCreate):
    """Add a new fight at a specific position."""
    try:
        # If position is not specified, add to the end
        if fight.position is None:
            total_fights = len(await get_all_fights())
            fight.position = total_fights + 1

        # Shift existing fights to make room for the new one
        await shift_fights_positions(fight.position)

        # Create the new fight
        fight_dict = fight.dict(exclude={'position'})
        new_fight = await create_fight(fight_dict, fight.position)

        return new_fight
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/fights/{fight_id}")
async def update_fight(fight_id: str, fight: FightUpdate):
    """Update an existing fight's details."""
    try:
        existing_fight = await get_fight(fight_id)
        if not existing_fight:
            raise HTTPException(status_code=404, detail="Fight not found")

        # Don't allow editing if fight has started
        if existing_fight.actual_start:
            raise HTTPException(status_code=400, detail="Cannot edit a fight that has already started")

        updated_fight = await edit_fight(fight_id, fight.dict())
        return updated_fight
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ... existing code ...
