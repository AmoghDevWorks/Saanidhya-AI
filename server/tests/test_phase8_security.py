from datetime import date, datetime, time, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.services.family_link_service import accept_invitation, create_invitation
from app.services.reminder_service import next_occurrence
from app.repositories.notification_repository import NotificationRepository
from app.services.alert_service import generate_alert


class Collection:
    def __init__(self):
        self.items = {}

    def find_one(self, query):
        for item in self.items.values():
            matches = True
            for key, value in query.items():
                actual = item.get(key)
                if isinstance(value, dict):
                    if "$in" in value and actual not in value["$in"]:
                        matches = False
                    if "$gt" in value and not (actual and actual > value["$gt"]):
                        matches = False
                elif actual != value:
                    matches = False
            if matches:
                return item.copy()
        return None

    def insert_one(self, document):
        self.items[document["_id"]] = document.copy()

    def find_one_and_update(self, query, update):
        item = self.find_one(query)
        if not item:
            return None
        self.items[item["_id"]].update(update["$set"])
        return item


class User:
    def __init__(self, user_id, account_type):
        self.id = user_id
        self.account_type = type("Role", (), {"value": account_type})()


class IterableCollection:
    def __init__(self, items=None):
        self.items = items or []

    def find(self, query):
        return list(self.items)

    def find_one(self, query):
        for item in self.items:
            if all(
                item.get(key) == value
                for key, value in query.items()
                if not isinstance(value, dict)
            ):
                if "status" in query and isinstance(query["status"], dict):
                    if item.get("status") not in query["status"]["$in"]:
                        continue
                return item
        return None

    def insert_one(self, document):
        self.items.append(document)


def test_invitation_stores_only_hash_and_is_one_time():
    users = Collection()
    invitations = Collection()
    relationships = Collection()
    users.insert_one({"_id": "family-1", "email": "family@example.com", "account_type": "family"})

    invitation = create_invitation(
        User("elderly-1", "elderly"),
        "family@example.com",
        "child",
        users,
        invitations,
        relationships,
    )
    stored = next(iter(invitations.items.values()))
    assert "token" not in stored
    assert stored["token_hash"] != invitation["token"]

    accepted = accept_invitation(
        User("family-1", "family"), invitation["token"], invitations, relationships
    )
    assert accepted["status"] == "accepted"
    with pytest.raises(HTTPException) as error:
        accept_invitation(
            User("family-1", "family"), invitation["token"], invitations, relationships
        )
    assert error.value.status_code == 400


def test_invitation_rejects_expired_token():
    users = Collection()
    invitations = Collection()
    relationships = Collection()
    users.insert_one({"_id": "family-1", "email": "family@example.com", "account_type": "family"})
    invitation = create_invitation(
        User("elderly-1", "elderly"),
        "family@example.com",
        "child",
        users,
        invitations,
        relationships,
    )
    stored = next(iter(invitations.items.values()))
    stored["expires_at"] = datetime.now(timezone.utc) - timedelta(minutes=1)
    with pytest.raises(HTTPException) as error:
        accept_invitation(
            User("family-1", "family"), invitation["token"], invitations, relationships
        )
    assert error.value.status_code == 400


def test_recurrence_is_timezone_aware_and_respects_end_date():
    current = datetime(2026, 11, 8, 5, 0, tzinfo=timezone.utc)
    occurrence = next_occurrence(
        date(2026, 11, 8),
        time(11, 0),
        "daily",
        "Asia/Kolkata",
        current,
        date(2026, 11, 8),
    )
    assert occurrence == datetime(2026, 11, 8, 5, 30, tzinfo=timezone.utc)
    assert next_occurrence(
        date(2026, 11, 8),
        time(11, 0),
        "once",
        "Asia/Kolkata",
        current + timedelta(days=1),
    ) is None


def test_alert_service_deduplicates_and_notifies_authorized_family():
    relationships = IterableCollection([{
        "family_user_id": "family-1",
        "elderly_user_id": "elderly-1",
        "status": "accepted",
        "permissions": {"notifications_enabled": True},
    }])
    users = IterableCollection([{
        "_id": "elderly-1",
        "family_sharing_enabled": True,
        "family_preferences": {"notifications_enabled": True},
    }])
    alerts = IterableCollection()
    notifications = IterableCollection()
    repository = NotificationRepository(relationships, alerts, notifications, users)

    first = generate_alert(
        repository, "elderly-1", "discomfort", "attention",
        "Discomfort", "Knee ache", "checkin", "same-event",
    )
    second = generate_alert(
        repository, "elderly-1", "discomfort", "attention",
        "Discomfort", "Knee ache", "checkin", "same-event",
    )

    assert first["_id"] == second["_id"]
    assert len(alerts.items) == 1
    assert len(notifications.items) == 1


def test_alert_service_excludes_family_without_current_consent():
    relationships = IterableCollection([{
        "family_user_id": "family-1",
        "elderly_user_id": "elderly-1",
        "status": "accepted",
        "permissions": {"notifications_enabled": True},
    }])
    users = IterableCollection([{
        "_id": "elderly-1",
        "family_sharing_enabled": False,
        "family_preferences": {"notifications_enabled": True},
    }])
    repository = NotificationRepository(
        relationships, IterableCollection(), IterableCollection(), users
    )
    assert repository.family_ids_for_elderly("elderly-1", "notifications_enabled") == []
