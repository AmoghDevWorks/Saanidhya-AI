from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


REMINDER_CATEGORIES = {"medication", "routine", "event", "follow_up"}
REMINDER_STATUSES = {"scheduled", "paused", "cancelled"}
OCCURRENCE_STATUSES = {"scheduled", "due", "acknowledged", "completed", "skipped", "missed"}


class ReminderCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    category: str = Field(..., min_length=2, max_length=30)
    description: Optional[str] = Field(default=None, max_length=500)
    reminder_time: time
    frequency: str = Field(default="once", max_length=30)
    start_date: date
    end_date: Optional[date] = None
    timezone: str = "Asia/Kolkata"
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("category")
    @classmethod
    def valid_category(cls, value):
        if value not in REMINDER_CATEGORIES:
            raise ValueError("Unsupported reminder category.")
        return value


class ReminderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    reminder_time: Optional[time] = None
    frequency: Optional[str] = Field(default=None, max_length=30)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    timezone: Optional[str] = None
    notes: Optional[str] = Field(default=None, max_length=500)
    status: Optional[str] = None

    @field_validator("frequency")
    @classmethod
    def valid_frequency(cls, value):
        if value is not None and value not in {"once", "daily", "weekly"}:
            raise ValueError("Frequency must be once, daily, or weekly.")
        return value

    @field_validator("status")
    @classmethod
    def valid_status(cls, value):
        if value is not None and value not in REMINDER_STATUSES:
            raise ValueError("Unsupported reminder status.")
        return value


class ReminderResponse(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    description: Optional[str] = None
    reminder_time: time
    frequency: str
    start_date: date
    end_date: Optional[date] = None
    timezone: str
    notes: Optional[str] = None
    status: str
    next_occurrence: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class OccurrenceResponse(BaseModel):
    id: str
    reminder_id: str
    scheduled_for: datetime
    status: str
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    note: Optional[str] = None


class OccurrenceAction(BaseModel):
    note: Optional[str] = Field(default=None, max_length=500)


class CheckinScheduleCreate(BaseModel):
    title: str = Field(default="Daily wellness check-in", max_length=120)
    preferred_time: time
    days: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])
    language: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    grace_minutes: int = Field(default=60, ge=0, le=1440)


class CheckinScheduleUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    preferred_time: Optional[time] = None
    days: Optional[List[int]] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    grace_minutes: Optional[int] = Field(default=None, ge=0, le=1440)
    enabled: Optional[bool] = None


class CheckinScheduleResponse(BaseModel):
    id: str
    user_id: str
    title: str
    preferred_time: time
    days: List[int]
    language: Optional[str] = None
    timezone: str
    grace_minutes: int
    enabled: bool
    next_occurrence: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CheckinExecutionResponse(BaseModel):
    id: str
    schedule_id: str
    scheduled_for: datetime
    status: str
    completed_at: Optional[datetime] = None
