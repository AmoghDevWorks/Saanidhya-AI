from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, status
from pymongo.collection import Collection

from app.database import (
    get_users_collection,
    get_checkins_collection,
    get_alerts_collection,
    get_reminders_collection,
    get_relationships_collection,
    get_users_collection,
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
from app.services.family_authorization import get_shared_senior

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
    relationships_col: Collection = Depends(get_relationships_collection),
):
    """Retrieve connected senior's wellness overview, alerts, and recent check-ins."""
    require_family(current_user)
    relationship, senior = get_shared_senior(
        relationships_col, users_col, current_user.id, "wellness_summaries"
    )
    return get_family_dashboard_data(
        users_col,
        checkins_col,
        alerts_col,
        reminders_col,
        current_user.id,
        current_user.full_name,
        str(senior["_id"]),
        include_reminders=(
            relationship.get("permissions", {}).get("view_reminders", False)
            and senior.get("family_preferences", {}).get("reminders", False)
        ),
    )


@router.post(
    "/alerts/{alert_id}/acknowledge",
    summary="Acknowledge an alert",
)
async def acknowledge_alert(
    alert_id: str,
    current_user: UserResponse = Depends(get_current_user),
    alerts_col: Collection = Depends(get_alerts_collection),
    relationships_col: Collection = Depends(get_relationships_collection),
    users_col: Collection = Depends(get_users_collection),
):
    """Mark an alert as acknowledged by the caregiver."""
    require_family(current_user)
    _, senior = get_shared_senior(
        relationships_col, users_col, current_user.id, "notifications_enabled"
    )
    result = alerts_col.update_one(
        {"_id": alert_id, "elderly_user_id": str(senior["_id"])},
        {"$set": {
            "status": "acknowledged",
            "updated_at": datetime.now(timezone.utc),
            "acknowledged_by": current_user.id,
        }},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Alert not found.")
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
    relationships_col: Collection = Depends(get_relationships_collection),
    users_col: Collection = Depends(get_users_collection),
):
    """Add a scheduled reminder for the senior."""
    require_family(current_user)
    get_shared_senior(
        relationships_col, users_col, current_user.id, "manage_reminders"
    )
    raise HTTPException(
        status_code=410,
        detail="Use /api/reminders to create reminders; caregiver reminder creation requires the linked senior ID and is not enabled on this legacy endpoint.",
    )
