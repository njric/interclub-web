from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime

class FightBase(BaseModel):
    fighter_a: str
    fighter_a_club: str
    fighter_b: str
    fighter_b_club: str
    weight_class: int
    duration: int
    fight_type: str

    @field_validator('duration')
    def validate_duration(cls, v):
        if v <= 0 or v > 60:  # MAX_DURATION_MINUTES
            raise ValueError("Duration must be between 1 and 60 minutes")
        return v

    @field_validator('weight_class')
    def validate_weight_class(cls, v):
        if v <= 0:
            raise ValueError("Weight class must be positive")
        return v

class FightCreate(FightBase):
    position: Optional[int] = None

class FightUpdate(BaseModel):
    fighter_a: Optional[str] = None
    fighter_a_club: Optional[str] = None
    fighter_b: Optional[str] = None
    fighter_b_club: Optional[str] = None
    weight_class: Optional[int] = None
    duration: Optional[int] = None
    fight_type: Optional[str] = None

    @field_validator('fighter_a', 'fighter_b', 'fighter_a_club', 'fighter_b_club')
    def validate_fighter_name(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError("Field cannot be empty")
            if len(v) > 100:
                raise ValueError("Name too long")
        return v

    @field_validator('weight_class')
    def validate_weight_class(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Weight class must be positive")
        return v

    @field_validator('duration')
    def validate_duration(cls, v):
        if v is not None:
            if v <= 0 or v > 60:  # MAX_DURATION_MINUTES
                raise ValueError("Duration must be between 1 and 60 minutes")
        return v

class Fight(FightBase):
    id: str
    fight_number: int
    expected_start: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    is_completed: bool = False

    class Config:
        from_attributes = True

class StartTimeUpdate(BaseModel):
    start_time: str
