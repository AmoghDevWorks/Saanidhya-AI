from typing import List
from fastapi import APIRouter, Depends, status
from pymongo.collection import Collection

from app.database import get_checkins_collection, get_alerts_collection
from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.checkin import (
    SaveCheckinRequest,
    CheckinResponse,
    TodayCheckinSummary,
)
from app.services.memory_service import (
    save_voice_checkin,
    get_today_checkin_summary,
    get_checkin_history,
)

router = APIRouter(prefix="", tags=["Check-in"])


@router.get(
    "/today",
    response_model=TodayCheckinSummary,
    summary="Get today's check-in summary",
)
async def get_today_summary(
    current_user: UserResponse = Depends(get_current_user),
    checkins_col: Collection = Depends(get_checkins_collection),
):
    """Retrieve today's check-in status and wellness notes for the logged in senior user."""
    return get_today_checkin_summary(checkins_col, current_user.id)


@router.post(
    "/save",
    response_model=CheckinResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a completed voice check-in conversation",
)
async def save_checkin(
    payload: SaveCheckinRequest,
    current_user: UserResponse = Depends(get_current_user),
    checkins_col: Collection = Depends(get_checkins_collection),
    alerts_col: Collection = Depends(get_alerts_collection),
):
    """Store conversation turns and extracted wellness markers."""
    return save_voice_checkin(
        checkins_col, alerts_col, current_user.id, payload
    )


@router.get(
    "/history",
    response_model=List[CheckinResponse],
    summary="Get conversation history",
)
async def get_history(
    current_user: UserResponse = Depends(get_current_user),
    checkins_col: Collection = Depends(get_checkins_collection),
):
    """Retrieve previous check-in records."""
    return get_checkin_history(checkins_col, current_user.id)
