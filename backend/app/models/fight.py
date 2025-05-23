from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from datetime import datetime

from ..database.database import Base

class Fight(Base):
    __tablename__ = "fights"

    id = Column(String, primary_key=True, index=True)
    fight_number = Column(Integer, nullable=False)
    fighter_a = Column(String, nullable=False)
    fighter_a_club = Column(String, nullable=False)
    fighter_b = Column(String, nullable=False)
    fighter_b_club = Column(String, nullable=False)
    weight_class = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)  # in minutes
    fight_type = Column(String, nullable=False, default="Boxing")
    expected_start = Column(DateTime, nullable=True)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
