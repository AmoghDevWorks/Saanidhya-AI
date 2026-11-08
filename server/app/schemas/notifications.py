from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InvitationRequest(BaseModel):
    family_email: str = Field(..., min_length=3, max_length=254)
    relationship_type: str = Field(default="family", max_length=50)


class AcceptInvitationRequest(BaseModel):
    token: str = Field(..., min_length=16, max_length=200)


class RelationshipResponse(BaseModel):
    id: str
    elderly_user_id: str
    family_user_id: str
    relationship_type: str
    status: str
    permissions: dict
    created_at: datetime
    accepted_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class SharingPreferences(BaseModel):
    notifications_enabled: bool = True
    wellness_summaries: bool = True
    checkin_updates: bool = True
    discomfort_updates: bool = False
    assistance_requests: bool = True
    reminders: bool = True


class ConsentResponse(BaseModel):
    enabled: bool
    preferences: SharingPreferences


class AlertResponse(BaseModel):
    id: str
    elderly_user_id: str
    category: str
    severity: str
    title: str
    message: str
    source: str
    status: str
    created_at: datetime
    updated_at: datetime
    resolution_note: Optional[str] = None

    model_config = {"populate_by_name": True}


class AlertStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(new|acknowledged|in_progress|resolved|dismissed)$")
    resolution_note: Optional[str] = Field(default=None, max_length=1000)


class NotificationResponse(BaseModel):
    id: str
    alert_id: Optional[str] = None
    category: str
    severity: str
    title: str
    message: str
    read: bool
    created_at: datetime

    model_config = {"populate_by_name": True}


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int
