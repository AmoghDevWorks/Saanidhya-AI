import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.schemas.checkin import (
    SaveCheckinRequest,
    CheckinResponse,
    TodayCheckinSummary,
    DialogueTurn,
)
from app.schemas.family import (
    FamilyDashboardResponse,
    SeniorProfile,
    AlertItem,
    ReminderItem,
)

logger = logging.getLogger("saanidhya.memory_service")


def format_checkin_doc(doc: Dict[str, Any]) -> CheckinResponse:
    """Safely format a MongoDB check-in document into a CheckinResponse."""
    dialogue_raw = doc.get("dialogue", [])
    dialogue = [
        DialogueTurn(
            speaker=t.get("speaker", "saanidhya"),
            text=t.get("text", ""),
            timestamp=t.get("timestamp"),
        )
        for t in dialogue_raw
    ]

    return CheckinResponse(
        id=str(doc.get("_id")),
        userId=str(doc.get("user_id")),
        sessionType=doc.get("session_type", "daily_morning"),
        timestamp=doc.get("timestamp") or datetime.now(timezone.utc),
        status=doc.get("status", "completed"),
        mood=doc.get("mood") or "Not recorded",
        medicationConfirmed=doc.get("medication_confirmed"),
        medicationDetails=doc.get("medication_details"),
        physicalComfort=doc.get("physical_comfort"),
        summary=doc.get(
            "summary", "No summary recorded."
        ),
        dialogue=dialogue,
        followUps=doc.get("follow_ups", []),
    )


def save_voice_checkin(
    checkins_col: Collection,
    alerts_col: Collection,
    user_id: str,
    payload: SaveCheckinRequest,
) -> CheckinResponse:
    """Save a completed check-in, extract wellness indicators, and log alerts if necessary."""
    now = datetime.now(timezone.utc)
    checkin_id = str(uuid.uuid4())

    # Build automated Evon AI conversation summary if none provided
    summary = payload.summary
    if not summary:
        mood_str = payload.mood or "Peaceful"
        med_str = (
            "confirmed medication intake"
            if payload.medication_confirmed
            else "medication pending"
        )
        discomfort_str = payload.physical_comfort or "no acute discomfort"
        summary = f"Daily wellness check-in completed. Senior appeared {mood_str.lower()}, {med_str}, and noted: {discomfort_str}."

    follow_ups = []
    if payload.physical_comfort and "knee" in payload.physical_comfort.lower():
        follow_ups.append("Check knee comfort during evening conversation")
    if payload.medication_confirmed:
        follow_ups.append("Evening calcium tablet reminder at 8:00 PM")
    else:
        follow_ups.append("Follow up on morning blood pressure medication")

    checkin_doc = {
        "_id": checkin_id,
        "user_id": user_id,
        "session_type": payload.session_type,
        "timestamp": now,
        "status": "completed",
        "mood": payload.mood or "Peaceful",
        "medication_confirmed": payload.medication_confirmed,
        "medication_details": payload.medication_details,
        "physical_comfort": payload.physical_comfort,
        "summary": summary,
        "dialogue": [d.model_dump() for d in payload.dialogue],
        "follow_ups": follow_ups,
    }

    try:
        checkins_col.insert_one(checkin_doc)
    except PyMongoError as e:
        logger.error(f"Error saving check-in to MongoDB: {e}")

    # Generate caregiver alert if discomfort or missed medication is detected
    if payload.physical_comfort and any(
        term in payload.physical_comfort.lower()
        for term in ["pain", "hurt", "stiff", "ache", "knee"]
    ):
        alert_doc = {
            "_id": str(uuid.uuid4()),
            "elderly_user_id": user_id,
            "category": "discomfort",
            "severity": "attention",
            "title": "Mild Physical Discomfort Logged",
            "message": f"Senior reported: '{payload.physical_comfort}' during morning check-in.",
            "status": "new",
            "source": "checkin",
            "created_at": now,
            "updated_at": now,
        }
        try:
            alerts_col.insert_one(alert_doc)
        except Exception as e:
            logger.warning(f"Could not persist alert: {e}")

    return format_checkin_doc(checkin_doc)


def get_today_checkin_summary(
    checkins_col: Collection, user_id: str
) -> TodayCheckinSummary:
    """Retrieve today's check-in status and wellness overview for elderly user."""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    today_record = None
    recent_records = []

    try:
        # Fetch today's check-in if exists
        today_record = checkins_col.find_one(
            {"user_id": user_id, "timestamp": {"$gte": today_start}}
        )

        # Fetch up to 5 recent check-ins
        cursor = (
            checkins_col.find({"user_id": user_id})
            .sort("timestamp", -1)
            .limit(5)
        )
        for doc in cursor:
            recent_records.append(format_checkin_doc(doc))
    except PyMongoError as e:
        logger.warning(f"Error querying checkins: {e}")

    if today_record:
        formatted_today = format_checkin_doc(today_record)
        return TodayCheckinSummary(
            hasCheckedInToday=True,
            todayCheckin=formatted_today,
            mood=formatted_today.mood,
            medicationStatus=formatted_today.medication_details
            or "Medication Confirmed",
            wellnessNotes=formatted_today.summary,
            followUp=(
                formatted_today.follow_ups[0]
                if formatted_today.follow_ups
                else None
            ),
            recentCheckins=recent_records,
        )

    # If no check-in today yet, provide helpful friendly status
    sample_recent = recent_records if recent_records else []
    return TodayCheckinSummary(
        hasCheckedInToday=False,
        todayCheckin=None,
        mood="Ready for Morning Check-in",
        medicationStatus="Pending Morning Confirmation",
        wellnessNotes="Saanidhya is ready to listen whenever you'd like to talk today.",
        followUp="Press 'Talk to Saanidhya' to start today's conversation.",
        recentCheckins=sample_recent,
    )


def get_checkin_history(
    checkins_col: Collection, user_id: str, limit: int = 15
) -> List[CheckinResponse]:
    """Retrieve full check-in history."""
    records = []
    try:
        cursor = (
            checkins_col.find({"user_id": user_id})
            .sort("timestamp", -1)
            .limit(limit)
        )
        for doc in cursor:
            records.append(format_checkin_doc(doc))
    except Exception as e:
        logger.warning(f"Could not load checkin history: {e}")

    return records


def get_family_dashboard_data(
    users_col: Collection,
    checkins_col: Collection,
    alerts_col: Collection,
    reminders_col: Collection,
    family_user_id: str,
    family_user_name: str,
    elderly_user_id: str,
    include_reminders: bool = False,
) -> FamilyDashboardResponse:
    """Assemble complete Family Dashboard overview."""
    senior = users_col.find_one({"_id": elderly_user_id, "account_type": "elderly"})
    if not senior:
        raise ValueError("Linked elderly account not found.")
    senior_name = senior.get("full_name", "")

    # Recent checkins
    recent_checkins = []
    try:
        cursor = checkins_col.find({"user_id": elderly_user_id}).sort("timestamp", -1).limit(5)
        for doc in cursor:
            recent_checkins.append(format_checkin_doc(doc))
    except Exception:
        pass


    # Alerts
    alerts = []
    try:
        cursor = alerts_col.find({"elderly_user_id": elderly_user_id}).sort("created_at", -1).limit(6)
        for doc in cursor:
            alerts.append(
                AlertItem(
                    id=str(doc.get("_id")),
                    type=doc.get("category", doc.get("type", "observation")),
                    severity=doc.get("severity", "attention"),
                    title=doc.get("title", "Observation"),
                    message=doc.get("message", ""),
                    timestamp=str(doc.get("timestamp") or doc.get("created_at") or ""),
                    isAcknowledged=doc.get("status") == "acknowledged" or doc.get("is_acknowledged", False),
                )
            )
    except Exception:
        pass

    reminders = []
    if include_reminders:
        try:
            for doc in reminders_col.find({"user_id": elderly_user_id}).sort("next_occurrence", 1).limit(20):
                reminders.append(
                    ReminderItem(
                        id=str(doc["_id"]),
                        title=doc["title"],
                        time=doc["reminder_time"].strftime("%I:%M %p"),
                        frequency=doc["frequency"],
                        status=doc.get("status", "scheduled"),
                    )
                )
        except Exception:
            logger.warning("Could not load linked senior reminders", exc_info=True)

    senior_profile = SeniorProfile(
        name=senior_name,
        relationship="Father",
        age=0,
        preferredLanguage=senior.get("preferred_language") or "Not provided",
        lastCheckinTime=(
            recent_checkins[0].timestamp.isoformat() if recent_checkins else "No check-ins yet"
        ),
        todayStatus="Completed" if recent_checkins else "Pending",
    )

    wellness_overview = {
        "adherenceRate": None,
        "checkinStreak": None,
        "currentMood": recent_checkins[0].mood if recent_checkins else None,
        "medicationCompliance": None,
        "keyObservation": recent_checkins[0].summary if recent_checkins else None,
    }

    return FamilyDashboardResponse(
        familyMemberName=family_user_name,
        seniorProfile=senior_profile,
        wellnessOverview=wellness_overview,
        recentCheckins=recent_checkins,
        alerts=alerts,
        reminders=reminders,
    )
