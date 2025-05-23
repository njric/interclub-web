from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.fight import Fight
from .config import FIGHT_DURATION_BUFFER_MINUTES

def get_next_start_time(current_time: datetime, duration: int) -> datetime:
    """Calculate the next available start time based on current time and duration."""
    return current_time + timedelta(minutes=duration + FIGHT_DURATION_BUFFER_MINUTES)

def update_fight_times(db: Session, start_time: datetime, min_fight_number: int = 0):
    """Update expected start times for all fights from a given fight number."""
    try:
        # Get all non-started fights ordered by fight number
        fights = db.query(Fight).filter(
            Fight.fight_number >= min_fight_number,
            Fight.actual_start.is_(None)
        ).order_by(Fight.fight_number).all()

        if not fights:
            return

        current_time = start_time
        for fight in fights:
            fight.expected_start = current_time
            current_time = get_next_start_time(current_time, fight.duration)

        db.commit()
        return fights
    except Exception as e:
        db.rollback()
        raise e

def update_subsequent_fights(db: Session, reference_fight: Fight, start_time: datetime):
    """Update expected start times for all fights after the reference fight."""
    return update_fight_times(
        db,
        start_time,
        min_fight_number=reference_fight.fight_number + 1
    )
