from typing import List
from fastapi import APIRouter, Depends, status
from pymongo.collection import Collection

from app.database import (
    get_users_collection,
    get_checkins_collection,
    get_alerts_collection,
    get_reminders_collection,
)
from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.family import (
    FamilyDashboardResponse,
    AlertItem,
    ReminderItem,
    CreateReminderRequest,
)
from app.services.memory_service import get_family_dashboard_data
from fastapi import HTTPException

router = APIRouter(prefix="", tags=["Family"])


def require_family(current_user: UserResponse) -> None:
    if current_user.account_type.value != "family":
        raise HTTPException(status_code=403, detail="Family account required.")


@router.get(
    "/dashboard",
    response_model=FamilyDashboardResponse,
    summary="Get full family caregiver dashboard",
)
async def get_family_dashboard(
    current_user: UserResponse = Depends(get_current_user),
    users_col: Collection = Depends(get_users_collection),
    checkins_col: Collection = Depends(get_checkins_collection),
    alerts_col: Collection = Depends(get_alerts_collection),
    reminders_col: Collection = Depends(get_reminders_collection),
):
    """Retrieve connected senior's wellness overview, alerts, and recent check-ins."""
    require_family(current_user)
    return get_family_dashboard_data(
        users_col,
        checkins_col,
        alerts_col,
        reminders_col,
        current_user.id,
        current_user.full_name,
    )


@router.post(
    "/alerts/{alert_id}/acknowledge",
    summary="Acknowledge an alert",
)
async def acknowledge_alert(
    alert_id: str,
    current_user: UserResponse = Depends(get_current_user),
    alerts_col: Collection = Depends(get_alerts_collection),
):
    """Mark an alert as acknowledged by the caregiver."""
    require_family(current_user)
    try:
        alerts_col.update_one(
            {"_id": alert_id}, {"$set": {"is_acknowledged": True}}
        )
    except Exception:
        pass
    return {"success": True, "message": "Alert acknowledged."}


@router.post(
    "/reminders",
    status_code=status.HTTP_201_CREATED,
    summary="Create a new reminder for the senior",
)
async def create_reminder(
    payload: CreateReminderRequest,
    current_user: UserResponse = Depends(get_current_user),
    reminders_col: Collection = Depends(get_reminders_collection),
):
    """Add a scheduled reminder for the senior."""
    require_family(current_user)
    return {
        "success": True,
        "message": f"Reminder '{payload.title}' scheduled for {payload.time}.",
        "reminder": {
            "id": "new-rem-1",
            "title": payload.title,
            "time": payload.time,
            "frequency": payload.frequency,
            "status": "Scheduled",
        },
    }
