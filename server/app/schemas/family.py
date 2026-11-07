from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.checkin import CheckinResponse


class SeniorProfile(BaseModel):
    """Connected elderly parent or loved one's profile."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., description="Elderly user's name")
    relationship: str = Field(default="Father", description="Relationship")
    age: int = Field(default=74, description="Age")
    preferred_language: str = Field(
        default="Kannada & English", alias="preferredLanguage"
    )
    last_checkin_time: str = Field(
        ..., alias="lastCheckinTime", description="Human readable time"
    )
    today_status: str = Field(
        default="Completed",
        alias="todayStatus",
        description="'Completed' or 'Pending'",
    )


class AlertItem(BaseModel):
    """Caregiver alert regarding wellness or medication."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Alert identifier")
    type: str = Field(
        ..., description="'medication', 'discomfort', 'checkin_delayed'"
    )
    severity: str = Field(
        default="info", description="'info' or 'attention' or 'urgent'"
    )
    title: str = Field(..., description="Alert headline")
    message: str = Field(..., description="Empathetic, clear alert description")
    timestamp: str = Field(..., description="Time string")
    is_acknowledged: bool = Field(
        default=False,
        alias="isAcknowledged",
        description="Whether family marked as read",
    )


class ReminderItem(BaseModel):
    """Scheduled reminder for senior."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Reminder identifier")
    title: str = Field(..., description="Reminder text")
    time: str = Field(..., description="Time of reminder e.g. 09:00 AM")
    frequency: str = Field(default="Daily", description="Recurrence")
    status: str = Field(default="Scheduled")


class CreateReminderRequest(BaseModel):
    """Payload to create a new reminder."""

    model_config = ConfigDict(populate_by_name=True)

    title: str = Field(..., min_length=2, max_length=120)
    time: str = Field(..., description="Time string (e.g. 02:00 PM)")
    frequency: str = Field(default="Daily")


class FamilyDashboardResponse(BaseModel):
    """Full data payload for the Family Member Dashboard."""

    model_config = ConfigDict(populate_by_name=True)

    family_member_name: str = Field(..., alias="familyMemberName")
    senior_profile: SeniorProfile = Field(..., alias="seniorProfile")
    wellness_overview: Dict[str, Any] = Field(..., alias="wellnessOverview")
    recent_checkins: List[CheckinResponse] = Field(
        default_factory=list, alias="recentCheckins"
    )
    alerts: List[AlertItem] = Field(default_factory=list)
    reminders: List[ReminderItem] = Field(default_factory=list)
