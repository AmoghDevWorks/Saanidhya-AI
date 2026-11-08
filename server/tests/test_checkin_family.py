import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import (
    get_users_collection,
    get_checkins_collection,
    get_alerts_collection,
    get_reminders_collection,
    get_relationships_collection,
    get_notifications_collection,
)


class MockCollection:

    def __init__(self):
        self.data = {}

    def find_one(self, filter_dict):
        if "_id" in filter_dict:
            return self.data.get(filter_dict["_id"])
        if "email" in filter_dict:
            target_email = filter_dict["email"]
            for d in self.data.values():
                if d.get("email") == target_email:
                    return d.copy()
        if "user_id" in filter_dict:
            target_uid = filter_dict["user_id"]
            for d in self.data.values():
                if d.get("user_id") == target_uid:
                    return d.copy()
        return None

    def insert_one(self, doc):
        doc_id = doc.get("_id", "mock-id-1")
        self.data[doc_id] = doc.copy()
        return type("InsertResult", (), {"inserted_id": doc_id})()

    def update_one(self, filter_dict, update_dict):
        doc_id = filter_dict.get("_id")
        if doc_id in self.data:
            if "$set" in update_dict:
                self.data[doc_id].update(update_dict["$set"])
        return type("UpdateResult", (), {"modified_count": 1})()

    def find(self, filter_dict=None):
        items = list(self.data.values())

        class MockCursor:

            def __init__(self, data_list):
                self._data = data_list

            def sort(self, *args, **kwargs):
                return self

            def limit(self, count):
                self._data = self._data[:count]
                return self

            def __iter__(self):
                return iter(self._data)

        return MockCursor(items)


@pytest.fixture
def mock_db():
    users_col = MockCollection()
    checkins_col = MockCollection()
    alerts_col = MockCollection()
    reminders_col = MockCollection()
    relationships_col = MockCollection()
    notifications_col = MockCollection()

    app.dependency_overrides[get_users_collection] = lambda: users_col
    app.dependency_overrides[get_checkins_collection] = lambda: checkins_col
    app.dependency_overrides[get_alerts_collection] = lambda: alerts_col
    app.dependency_overrides[get_reminders_collection] = lambda: reminders_col
    app.dependency_overrides[get_relationships_collection] = lambda: relationships_col
    app.dependency_overrides[get_notifications_collection] = lambda: notifications_col

    yield {
        "users": users_col,
        "checkins": checkins_col,
        "alerts": alerts_col,
        "reminders": reminders_col,
        "relationships": relationships_col,
        "notifications": notifications_col,
    }
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(mock_db):
    with TestClient(app) as test_client:
        # Register a test senior
        reg_res = test_client.post(
            "/api/auth/register",
            json={
                "fullName": "Senior Ramesh",
                "email": "ramesh@example.com",
                "password": "Password123#",
                "confirmPassword": "Password123#",
                "accountType": "elderly",
                "termsAccepted": True,
            },
        )
        token = reg_res.json()["accessToken"]
        test_client.headers = {"Authorization": f"Bearer {token}"}
        yield test_client


def test_get_today_summary(auth_client):
    """Verify today's checkin summary is returned for senior."""
    res = auth_client.get("/api/checkin/today")
    assert res.status_code == 200
    data = res.json()
    assert "hasCheckedInToday" in data
    assert "mood" in data


def test_save_voice_checkin(auth_client):
    """Verify saving a completed voice check-in."""
    payload = {
        "sessionType": "daily_morning",
        "dialogue": [
            {
                "speaker": "saanidhya",
                "text": "Good morning! How did you sleep?",
                "timestamp": "09:00 AM",
            },
            {
                "speaker": "user",
                "text": "I slept well, my knees were hurting a little.",
                "timestamp": "09:01 AM",
            },
        ],
        "mood": "Peaceful",
        "medicationConfirmed": True,
        "medicationDetails": "Morning BP tablet confirmed",
        "physicalComfort": "Mild knee ache",
        "summary": "Ramesh slept well, reported mild knee ache, took BP tablet.",
    }
    res = auth_client.post("/api/checkin/save", json=payload)
    assert res.status_code == 201
    saved = res.json()
    assert saved["status"] == "completed"
    assert saved["mood"] == "Peaceful"
    assert saved["medicationConfirmed"] is True


def test_get_history(auth_client):
    """Verify history endpoint returns past check-ins."""
    res = auth_client.get("/api/checkin/history")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_family_dashboard_requires_family_relationship(auth_client):
    """An elderly account cannot access the caregiver dashboard."""
    res = auth_client.get("/api/family/dashboard")
    assert res.status_code == 403


def test_family_acknowledge_alert_requires_family_relationship(auth_client):
    """An elderly account cannot acknowledge caregiver alerts."""
    res = auth_client.post("/api/family/alerts/test-alert-1/acknowledge")
    assert res.status_code == 403


def test_family_create_reminder_requires_family_relationship(auth_client):
    """Legacy caregiver reminder creation cannot bypass relationship checks."""
    res = auth_client.post(
        "/api/family/reminders",
        json={
            "title": "Evening Walk & Calcium Pill",
            "time": "06:30 PM",
            "frequency": "Daily",
        },
    )
    assert res.status_code == 403
