from pydantic import BaseModel, field_validator, field_serializer, computed_field
from typing import Optional
from datetime import datetime
from zoneinfo import ZoneInfo

class FightBase(BaseModel):
    fighter_a: str
    fighter_a_club: str
    fighter_b: str
    fighter_b_club: str
    weight_class: int
    round_duration: int  # duration of one round in minutes
    nb_rounds: int  # number of rounds
    rest_time: int  # rest time between rounds in minutes
    fight_type: str

    @field_validator('round_duration')
    def validate_round_duration(cls, v):
        if v <= 0 or v > 60:
            raise ValueError("Round duration must be between 1 and 60 minutes")
        return v

    @field_validator('nb_rounds')
    def validate_nb_rounds(cls, v):
        if v <= 0 or v > 10:
            raise ValueError("Number of rounds must be between 1 and 10")
        return v

    @field_validator('rest_time')
    def validate_rest_time(cls, v):
        if v < 0 or v > 10:
            raise ValueError("Rest time must be between 0 and 10 minutes")
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
    round_duration: Optional[int] = None
    nb_rounds: Optional[int] = None
    rest_time: Optional[int] = None
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

    @field_validator('round_duration')
    def validate_round_duration(cls, v):
        if v is not None:
            if v <= 0 or v > 60:
                raise ValueError("Round duration must be between 1 and 60 minutes")
        return v

    @field_validator('nb_rounds')
    def validate_nb_rounds(cls, v):
        if v is not None:
            if v <= 0 or v > 10:
                raise ValueError("Number of rounds must be between 1 and 10")
        return v

    @field_validator('rest_time')
    def validate_rest_time(cls, v):
        if v is not None:
            if v < 0 or v > 10:
                raise ValueError("Rest time must be between 0 and 10 minutes")
        return v

class Fight(FightBase):
    id: str
    fight_number: int
    expected_start: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    is_completed: bool = False

    @computed_field
    @property
    def duration(self) -> int:
        """Calculate total fight duration: nb_rounds * round_duration + (nb_rounds - 1) * rest_time"""
        return self.nb_rounds * self.round_duration + (self.nb_rounds - 1) * self.rest_time

    @field_serializer('expected_start', 'actual_start', 'actual_end')
    def serialize_datetime(self, value: Optional[datetime]) -> Optional[str]:
        if value is None:
            return None
        # If datetime is naive (no timezone), assume Europe/Paris
        if value.tzinfo is None:
            value = value.replace(tzinfo=ZoneInfo('Europe/Paris'))
        return value.isoformat()

    class Config:
        from_attributes = True

class StartTimeUpdate(BaseModel):
    start_time: str
