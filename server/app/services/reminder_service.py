import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional
from zoneinfo import ZoneInfo

from fastapi import HTTPException


def validate_timezone(value: str) -> ZoneInfo:
    try:
        return ZoneInfo(value)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Invalid IANA timezone.") from exc


def next_occurrence(
    start_date: date,
    reminder_time,
    frequency: str,
    timezone_name: str,
    now: Optional[datetime] = None,
    end_date: Optional[date] = None,
) -> Optional[datetime]:
    zone = validate_timezone(timezone_name)
    if end_date and end_date < start_date:
        raise HTTPException(status_code=422, detail="End date cannot be before start date.")
    current = (now or datetime.now(timezone.utc)).astimezone(zone)
    candidate_date = max(start_date, current.date())
    if frequency == "daily":
        pass
    elif frequency == "weekly":
        candidate_date += timedelta(days=(start_date.weekday() - candidate_date.weekday()) % 7)
    elif frequency == "once" and candidate_date != start_date:
        return None
    elif frequency != "once":
        raise HTTPException(status_code=422, detail="Frequency must be once, daily, or weekly.")
    candidate = datetime.combine(candidate_date, reminder_time, tzinfo=zone)
    if candidate <= current:
        if frequency == "daily":
            candidate += timedelta(days=1)
        elif frequency == "weekly":
            candidate += timedelta(days=7)
        else:
            return None
    if end_date and candidate.date() > end_date:
        return None
    return candidate.astimezone(timezone.utc)


def occurrence_document(reminder: Dict[str, Any], scheduled_for: datetime) -> Dict[str, Any]:
    return {
        "_id": f"{reminder['_id']}:{scheduled_for.isoformat()}",
        "reminder_id": reminder["_id"],
        "user_id": reminder["user_id"],
        "scheduled_for": scheduled_for,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc),
    }


def public_reminder(document: Dict[str, Any]) -> Dict[str, Any]:
    return {**document, "id": str(document["_id"]), "user_id": str(document["user_id"])}
