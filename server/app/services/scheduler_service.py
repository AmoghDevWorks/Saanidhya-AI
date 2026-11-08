import asyncio
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.database import (
    get_checkin_executions_collection,
    get_checkin_schedules_collection,
    get_notifications_collection,
    get_reminder_occurrences_collection,
    get_reminders_collection,
)
from app.services.reminder_service import next_occurrence, occurrence_document

logger = logging.getLogger("saanidhya.scheduler")


def process_due_reminders() -> int:
    now = datetime.now(timezone.utc)
    reminders = get_reminders_collection()
    occurrences = get_reminder_occurrences_collection()
    notifications = get_notifications_collection()
    processed = 0
    while True:
        reminder = reminders.find_one_and_update(
            {
                "status": "scheduled",
                "next_occurrence": {"$lte": now, "$ne": None},
                "$or": [
                    {"processing_until": {"$exists": False}},
                    {"processing_until": {"$lt": now}},
                ],
            },
            {"$set": {"processing_until": now.replace(microsecond=0) + timedelta(minutes=5)}},
            return_document=ReturnDocument.AFTER,
        )
        if not reminder:
            break
        scheduled_for = reminder["next_occurrence"]
        occurrence = occurrence_document(reminder, scheduled_for)
        try:
            occurrences.insert_one(occurrence)
        except DuplicateKeyError:
            reminders.update_one({"_id": reminder["_id"]}, {"$unset": {"processing_until": ""}})
            continue
        try:
            notifications.insert_one(
                {
                    "_id": occurrence["_id"],
                    "recipient_user_id": reminder["user_id"],
                    "category": "reminder",
                    "severity": "info",
                    "title": reminder["title"],
                    "message": reminder.get("description", "Your scheduled reminder is due."),
                    "read": False,
                    "created_at": now,
                }
            )
        except DuplicateKeyError:
            pass
        following = next_occurrence(
            reminder["start_date"],
            reminder["reminder_time"],
            reminder["frequency"],
            reminder["timezone"],
            now,
            reminder.get("end_date"),
        )
        reminders.update_one(
            {"_id": reminder["_id"]},
            {"$set": {"next_occurrence": following, "updated_at": now}},
        )
        reminders.update_one({"_id": reminder["_id"]}, {"$unset": {"processing_until": ""}})
        processed += 1
    return processed


def process_due_checkins() -> int:
    now = datetime.now(timezone.utc)
    schedules = get_checkin_schedules_collection()
    executions = get_checkin_executions_collection()
    notifications = get_notifications_collection()
    processed = 0
    for schedule in schedules.find({"enabled": True}):
        zone = ZoneInfo(schedule["timezone"])
        local_now = now.astimezone(zone)
        if local_now.weekday() not in schedule.get("days", []):
            continue
        scheduled_local = local_now.replace(
            hour=schedule["preferred_time"].hour,
            minute=schedule["preferred_time"].minute,
            second=0,
            microsecond=0,
        )
        scheduled_for = scheduled_local.astimezone(timezone.utc)
        if scheduled_for > now:
            continue
        execution_id = f"{schedule['_id']}:{scheduled_for.date().isoformat()}"
        try:
            executions.insert_one(
                {
                    "_id": execution_id,
                    "schedule_id": schedule["_id"],
                    "user_id": schedule["user_id"],
                    "scheduled_for": scheduled_for,
                    "status": "due",
                    "created_at": now,
                }
            )
        except Exception:
            continue
        notifications.insert_one(
            {
                "_id": execution_id,
                "recipient_user_id": schedule["user_id"],
                "category": "checkin",
                "severity": "info",
                "title": schedule["title"],
                "message": "Your scheduled voice check-in is ready. Open Saanidhya when you are ready to talk.",
                "read": False,
                "created_at": now,
            }
        )
        processed += 1
    return processed


async def scheduler_loop(stop_event: asyncio.Event):
    while not stop_event.is_set():
        try:
            process_due_reminders()
            process_due_checkins()
        except Exception:
            logger.exception("Scheduled reminder processing failed")
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=60)
        except asyncio.TimeoutError:
            continue
