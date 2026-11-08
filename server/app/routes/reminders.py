import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.collection import Collection

from app.database import get_reminders_collection, get_reminder_occurrences_collection, get_checkin_schedules_collection, get_checkin_executions_collection
from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.reminders import (
    CheckinExecutionResponse,
    CheckinScheduleCreate,
    CheckinScheduleResponse,
    CheckinScheduleUpdate,
    OccurrenceAction,
    OccurrenceResponse,
    ReminderCreate,
    ReminderResponse,
    ReminderUpdate,
)
from app.repositories.reminder_repository import ReminderRepository
from app.services.reminder_service import next_occurrence, occurrence_document, public_reminder, validate_timezone

router = APIRouter(tags=["Reminders and Schedules"])


def reminder_response(document):
    return ReminderResponse(**public_reminder(document))


def schedule_response(document):
    return CheckinScheduleResponse(**{**document, "id": str(document["_id"])})


@router.post("/api/reminders", response_model=ReminderResponse, status_code=201)
async def create_reminder(payload: ReminderCreate, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection)):
    validate_timezone(payload.timezone)
    now = datetime.now(timezone.utc)
    document = {
        "_id": str(uuid.uuid4()), "user_id": current_user.id, **payload.model_dump(),
        "status": "scheduled", "created_at": now, "updated_at": now,
    }
    document["next_occurrence"] = next_occurrence(payload.start_date, payload.reminder_time, payload.frequency, payload.timezone, now, payload.end_date)
    reminders.insert_one(document)
    return reminder_response(document)


@router.get("/api/reminders", response_model=List[ReminderResponse])
async def list_reminders(current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection)):
    return [reminder_response(item) for item in reminders.find({"user_id": current_user.id}).sort("next_occurrence", 1)]


@router.get("/api/reminders/upcoming", response_model=List[ReminderResponse])
async def upcoming_reminders(current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection)):
    now = datetime.now(timezone.utc)
    return [reminder_response(item) for item in reminders.find({"user_id": current_user.id, "status": "scheduled", "next_occurrence": {"$gte": now}}).sort("next_occurrence", 1).limit(50)]


@router.get("/api/reminders/{reminder_id}", response_model=ReminderResponse)
async def get_reminder(reminder_id: str, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection)):
    item = reminders.find_one({"_id": reminder_id, "user_id": current_user.id})
    if not item:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return reminder_response(item)


@router.patch("/api/reminders/{reminder_id}", response_model=ReminderResponse)
async def update_reminder(reminder_id: str, payload: ReminderUpdate, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection)):
    item = reminders.find_one({"_id": reminder_id, "user_id": current_user.id})
    if not item:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    changes = payload.model_dump(exclude_unset=True)
    timezone_name = changes.get("timezone", item["timezone"])
    validate_timezone(timezone_name)
    reminders.update_one({"_id": reminder_id, "user_id": current_user.id}, {"$set": {**changes, "updated_at": datetime.now(timezone.utc)}})
    return reminder_response(reminders.find_one({"_id": reminder_id, "user_id": current_user.id}))


@router.delete("/api/reminders/{reminder_id}", status_code=204)
async def delete_reminder(reminder_id: str, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection)):
    result = reminders.update_one({"_id": reminder_id, "user_id": current_user.id}, {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc)}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Reminder not found.")


async def action_occurrence(reminder_id, action, payload, current_user, reminders, occurrences):
    reminder = reminders.find_one({"_id": reminder_id, "user_id": current_user.id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    occurrence_id = f"{reminder_id}:{reminder.get('next_occurrence').isoformat()}"
    occurrence = occurrences.find_one({"_id": occurrence_id, "user_id": current_user.id})
    if not occurrence:
        occurrence = occurrence_document(reminder, reminder["next_occurrence"])
        occurrences.insert_one(occurrence)
    now = datetime.now(timezone.utc)
    changes = {"status": action}
    if action == "acknowledged":
        changes["acknowledged_at"] = now
    if action == "completed":
        changes["completed_at"] = now
    if payload.note:
        changes["note"] = payload.note
    occurrences.update_one({"_id": occurrence_id, "user_id": current_user.id}, {"$set": changes})
    return occurrences.find_one({"_id": occurrence_id, "user_id": current_user.id})


@router.post("/api/reminders/{reminder_id}/acknowledge", response_model=OccurrenceResponse)
async def acknowledge_reminder(reminder_id: str, payload: OccurrenceAction, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection), occurrences: Collection = Depends(get_reminder_occurrences_collection)):
    item = await action_occurrence(reminder_id, "acknowledged", payload, current_user, reminders, occurrences)
    return {**item, "id": str(item["_id"])}


@router.post("/api/reminders/{reminder_id}/complete", response_model=OccurrenceResponse)
async def complete_reminder(reminder_id: str, payload: OccurrenceAction, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection), occurrences: Collection = Depends(get_reminder_occurrences_collection)):
    item = await action_occurrence(reminder_id, "completed", payload, current_user, reminders, occurrences)
    return {**item, "id": str(item["_id"])}


@router.post("/api/reminders/{reminder_id}/skip", response_model=OccurrenceResponse)
async def skip_reminder(reminder_id: str, payload: OccurrenceAction, current_user: UserResponse = Depends(get_current_user), reminders: Collection = Depends(get_reminders_collection), occurrences: Collection = Depends(get_reminder_occurrences_collection)):
    item = await action_occurrence(reminder_id, "skipped", payload, current_user, reminders, occurrences)
    return {**item, "id": str(item["_id"])}


@router.post("/api/schedules/checkins", response_model=CheckinScheduleResponse, status_code=201)
async def create_checkin_schedule(
    payload: CheckinScheduleCreate,
    current_user: UserResponse = Depends(get_current_user),
    schedules: Collection = Depends(get_checkin_schedules_collection),
):
    validate_timezone(payload.timezone)
    if any(day < 0 or day > 6 for day in payload.days):
        raise HTTPException(status_code=422, detail="Schedule days must be between 0 and 6.")
    now = datetime.now(timezone.utc)
    document = {
        "_id": str(uuid.uuid4()),
        "user_id": current_user.id,
        **payload.model_dump(),
        "enabled": True,
        "created_at": now,
        "updated_at": now,
    }
    schedules.insert_one(document)
    return schedule_response(document)


@router.get("/api/schedules/checkins", response_model=List[CheckinScheduleResponse])
async def list_checkin_schedules(
    current_user: UserResponse = Depends(get_current_user),
    schedules: Collection = Depends(get_checkin_schedules_collection),
):
    return [schedule_response(item) for item in schedules.find({"user_id": current_user.id})]


@router.patch("/api/schedules/checkins/{schedule_id}", response_model=CheckinScheduleResponse)
async def update_checkin_schedule(
    schedule_id: str,
    payload: CheckinScheduleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    schedules: Collection = Depends(get_checkin_schedules_collection),
):
    changes = payload.model_dump(exclude_unset=True)
    if "timezone" in changes:
        validate_timezone(changes["timezone"])
    if "days" in changes and any(day < 0 or day > 6 for day in changes["days"]):
        raise HTTPException(status_code=422, detail="Schedule days must be between 0 and 6.")
    result = schedules.update_one(
        {"_id": schedule_id, "user_id": current_user.id},
        {"$set": {**changes, "updated_at": datetime.now(timezone.utc)}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Check-in schedule not found.")
    return schedule_response(schedules.find_one({"_id": schedule_id, "user_id": current_user.id}))


@router.delete("/api/schedules/checkins/{schedule_id}", status_code=204)
async def delete_checkin_schedule(
    schedule_id: str,
    current_user: UserResponse = Depends(get_current_user),
    schedules: Collection = Depends(get_checkin_schedules_collection),
):
    result = schedules.update_one(
        {"_id": schedule_id, "user_id": current_user.id},
        {"$set": {"enabled": False, "updated_at": datetime.now(timezone.utc)}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Check-in schedule not found.")


@router.get("/api/schedules/checkins/history", response_model=List[CheckinExecutionResponse])
async def checkin_schedule_history(
    current_user: UserResponse = Depends(get_current_user),
    executions: Collection = Depends(get_checkin_executions_collection),
):
    return [
        {**item, "id": str(item["_id"])}
        for item in executions.find({"user_id": current_user.id}).sort("scheduled_for", -1).limit(100)
    ]
