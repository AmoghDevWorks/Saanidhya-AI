import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pymongo.collection import Collection

from app.database import (
    get_checkins_collection,
    get_alerts_collection,
    get_memories_collection,
    get_users_collection,
    get_relationships_collection,
    get_notifications_collection,
)
from app.repositories.notification_repository import NotificationRepository
from app.repositories.memory_repository import MemoryRepository
from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.checkin import (
    SaveCheckinRequest,
    CheckinResponse,
    TodayCheckinSummary,
)
from app.schemas.voice import (
    CheckinEndResponse,
    CheckinMessageRequest,
    CheckinMessageResponse,
    CheckinStartResponse,
)
from app.services.gnani_service import (
    GnaniIntegrationUnavailable,
    generate_llm_response,
)
from app.services.memory_extraction_service import (
    safely_extract_and_store_memories,
)
from app.services.memory_retrieval_service import retrieve_relevant_memories
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
    relationships_col: Collection = Depends(get_relationships_collection),
    notifications_col: Collection = Depends(get_notifications_collection),
    users_col: Collection = Depends(get_users_collection),
):
    """Store conversation turns and extracted wellness markers."""
    alert_repository = NotificationRepository(
        relationships_col, alerts_col, notifications_col, users_col
    )
    return save_voice_checkin(checkins_col, alert_repository, current_user.id, payload)


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


@router.post("/start", response_model=CheckinStartResponse)
async def start_checkin(
    current_user: UserResponse = Depends(get_current_user),
    checkins_col: Collection = Depends(get_checkins_collection),
    memories_col: Collection = Depends(get_memories_collection),
    users_col: Collection = Depends(get_users_collection),
):
    session_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc)
    memory_context = []
    user = users_col.find_one({"_id": current_user.id}) or {}
    if user.get("memory_consent", False):
        memory_context = retrieve_relevant_memories(
            MemoryRepository(memories_col), current_user.id
        )
    checkins_col.insert_one(
        {
            "_id": session_id,
            "user_id": current_user.id,
            "session_type": "daily_morning",
            "started_at": started_at,
            "status": "active",
            "messages": [],
            "memory_context": memory_context,
        }
    )
    return CheckinStartResponse(
        session_id=session_id,
        started_at=started_at,
        relevant_memories=[
            {
                "category": item["category"],
                "key": item["key"],
                "value": item["value"],
            }
            for item in memory_context
        ],
    )


@router.post("/{session_id}/message", response_model=CheckinMessageResponse)
async def checkin_message(
    session_id: str,
    payload: CheckinMessageRequest,
    current_user: UserResponse = Depends(get_current_user),
    checkins_col: Collection = Depends(get_checkins_collection),
):
    if not payload.transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A transcribed message is required.",
        )
    session = checkins_col.find_one(
        {"_id": session_id, "user_id": current_user.id, "status": "active"}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Check-in session not found.")
    try:
        response = await generate_llm_response(
            payload.transcript,
            payload.conversation,
            payload.language,
            session.get("memory_context", []),
        )
    except GnaniIntegrationUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="LLM request failed.") from exc

    messages = list(session.get("messages", []))
    messages.extend(
        [
            {"speaker": "user", "text": payload.transcript},
            {"speaker": "saanidhya", "text": response.response_text},
        ]
    )
    checkins_col.update_one({"_id": session_id}, {"$set": {"messages": messages}})
    return CheckinMessageResponse(
        session_id=session_id, transcript=payload.transcript, response=response
    )


@router.post("/{session_id}/end", response_model=CheckinEndResponse)
async def end_checkin(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
    checkins_col: Collection = Depends(get_checkins_collection),
    memories_col: Collection = Depends(get_memories_collection),
    users_col: Collection = Depends(get_users_collection),
):
    ended_at = datetime.now(timezone.utc)
    session = checkins_col.find_one(
        {"_id": session_id, "user_id": current_user.id, "status": "active"}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Check-in session not found.")
    messages = session.get("messages", [])
    summary = (
        f"Voice check-in completed with {len(messages)} conversation messages."
        if messages
        else "Voice check-in completed without conversation messages."
    )
    checkins_col.update_one(
        {"_id": session_id},
        {
            "$set": {
                "ended_at": ended_at,
                "status": "completed",
                "summary": summary,
                "dialogue": messages,
            }
        },
    )
    user = users_col.find_one({"_id": current_user.id}) or {}
    if user.get("memory_consent", False):
        background_tasks.add_task(
            safely_extract_and_store_memories,
            MemoryRepository(memories_col),
            current_user.id,
            messages,
        )
    return CheckinEndResponse(
        session_id=session_id, ended_at=ended_at, summary=summary
    )
