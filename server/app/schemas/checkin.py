from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DialogueTurn(BaseModel):
    """A single turn in the voice conversation."""

    model_config = ConfigDict(populate_by_name=True)

    speaker: str = Field(..., description="'saanidhya' or 'user'")
    text: str = Field(..., description="Spoken message text")
    timestamp: Optional[str] = Field(default=None, description="Time string")


class SaveCheckinRequest(BaseModel):
    """Payload sent when a voice check-in conversation finishes."""

    model_config = ConfigDict(populate_by_name=True)

    session_type: str = Field(
        default="daily_morning", alias="sessionType", description="Check-in type"
    )
    dialogue: List[DialogueTurn] = Field(
        ..., description="Complete conversational turns"
    )
    mood: Optional[str] = Field(default=None, description="Observed mood")
    medication_confirmed: Optional[bool] = Field(
        default=None,
        alias="medicationConfirmed",
        description="Whether medication intake was confirmed",
    )
    medication_details: Optional[str] = Field(
        default=None,
        alias="medicationDetails",
    )
    physical_comfort: Optional[str] = Field(
        default=None,
        alias="physicalComfort",
    )
    summary: Optional[str] = Field(
        default=None, description="Concise conversation summary"
    )


class CheckinResponse(BaseModel):
    """Serialized check-in record."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique check-in ID")
    user_id: str = Field(..., alias="userId")
    session_type: str = Field(..., alias="sessionType")
    timestamp: datetime = Field(...)
    status: str = Field(default="completed")
    mood: str = Field(default="Peaceful")
    medication_confirmed: Optional[bool] = Field(
        default=True, alias="medicationConfirmed"
    )
    medication_details: Optional[str] = Field(
        default=None, alias="medicationDetails"
    )
    physical_comfort: Optional[str] = Field(
        default=None, alias="physicalComfort"
    )
    summary: str = Field(...)
    dialogue: List[DialogueTurn] = Field(default_factory=list)
    messages: List[DialogueTurn] = Field(default_factory=list)
    follow_ups: List[str] = Field(default_factory=list, alias="followUps")


class TodayCheckinSummary(BaseModel):
    """Summary of today's check-in status for the Elderly dashboard."""

    model_config = ConfigDict(populate_by_name=True)

    has_checked_in_today: bool = Field(..., alias="hasCheckedInToday")
    today_checkin: Optional[CheckinResponse] = Field(
        default=None, alias="todayCheckin"
    )
    mood: str = Field(default="Peaceful")
    medication_status: str = Field(
        default="Pending Morning Check-in", alias="medicationStatus"
    )
    wellness_notes: str = Field(
        default="Ready for today's voice conversation.", alias="wellnessNotes"
    )
    follow_up: Optional[str] = Field(default=None, alias="followUp")
    recent_checkins: List[CheckinResponse] = Field(
        default_factory=list, alias="recentCheckins"
    )
