from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.fight import Fight
from .config import FIGHT_DURATION_BUFFER_MINUTES

def update_fight_times(db: Session, start_time: datetime):
    """Update expected start times for all fights based on a new start time."""
    try:
        # Get all fights ordered by fight number
        fights = db.query(Fight).order_by(Fight.fight_number).all()
        if not fights:
            return

        current_time = start_time
        for fight in fights:
            if not fight.actual_start:  # Only update non-started fights
                fight.expected_start = current_time
                current_time += timedelta(minutes=fight.duration + FIGHT_DURATION_BUFFER_MINUTES)

        db.commit()
        return fights
    except Exception as e:
        db.rollback()
        raise e

def update_subsequent_fights(db: Session, reference_fight: Fight, start_time: datetime):
    """Update expected start times for all fights after the reference fight"""
    subsequent_fights = db.query(Fight).filter(
        Fight.expected_start > reference_fight.expected_start,
        Fight.actual_start.is_(None)  # Only update fights that haven't started yet
    ).order_by(Fight.expected_start).all()

    current_time = start_time
    for fight in subsequent_fights:
        if fight.id != reference_fight.id:  # Don't update the reference fight itself
            fight.expected_start = current_time
            current_time += timedelta(minutes=fight.duration + FIGHT_DURATION_BUFFER_MINUTES)
