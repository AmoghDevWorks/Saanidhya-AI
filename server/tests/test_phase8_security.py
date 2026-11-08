from datetime import date, datetime, time, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.services.family_link_service import accept_invitation, create_invitation
from app.services.reminder_service import next_occurrence


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
