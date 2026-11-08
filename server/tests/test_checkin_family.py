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
    get_memories_collection,
)


class MockCollection:

    def __init__(self):
        self.data = {}

    def find_one(self, filter_dict, sort=None):
        for d in self.data.values():
            if all(d.get(key) == value for key, value in filter_dict.items()):
                return d.copy()
        return None

    def find_one_and_update(
        self, filter_dict, update_dict, upsert=False, return_document=None
    ):
        existing = self.find_one(filter_dict)
        if existing:
            return existing
        if not upsert:
            return None
        document = update_dict.get("$setOnInsert", {}).copy()
        self.insert_one(document)
        return document.copy()

    def insert_one(self, doc):
        doc_id = doc.get("_id", "mock-id-1")
        self.data[doc_id] = doc.copy()
        return type("InsertResult", (), {"inserted_id": doc_id})()

    def update_one(self, filter_dict, update_dict):
        doc_id = filter_dict.get("_id")
        document = self.data.get(doc_id)
        if not document or any(
            document.get(key) != value
            for key, value in filter_dict.items()
            if key != "_id"
        ):
            return type("UpdateResult", (), {"modified_count": 0})()
        if "$set" in update_dict:
            document.update(update_dict["$set"])
        if "$push" in update_dict:
            for field, push in update_dict["$push"].items():
                document.setdefault(field, []).extend(push["$each"])
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
    memories_col = MockCollection()

    app.dependency_overrides[get_users_collection] = lambda: users_col
    app.dependency_overrides[get_checkins_collection] = lambda: checkins_col
    app.dependency_overrides[get_alerts_collection] = lambda: alerts_col
    app.dependency_overrides[get_reminders_collection] = lambda: reminders_col
    app.dependency_overrides[get_relationships_collection] = lambda: relationships_col
    app.dependency_overrides[get_notifications_collection] = lambda: notifications_col
    app.dependency_overrides[get_memories_collection] = lambda: memories_col

    yield {
        "users": users_col,
        "checkins": checkins_col,
        "alerts": alerts_col,
        "reminders": reminders_col,
        "relationships": relationships_col,
        "notifications": notifications_col,
        "memories": memories_col,
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


def test_repeated_checkin_start_reuses_active_session(auth_client, mock_db):
    first = auth_client.post("/api/checkin/start")
    second = auth_client.post("/api/checkin/start")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["session_id"] == second.json()["session_id"]
    assert len(mock_db["checkins"].data) == 1
    assert next(iter(mock_db["checkins"].data.values()))["active_key"].endswith(
        ":daily_morning"
    )


def test_completed_checkin_can_be_followed_by_new_session(auth_client, mock_db):
    first = auth_client.post("/api/checkin/start")
    session_id = first.json()["session_id"]
    ended = auth_client.post(f"/api/checkin/{session_id}/end")
    second = auth_client.post("/api/checkin/start")

    assert ended.status_code == 200
    assert second.status_code == 200
    assert second.json()["session_id"] != session_id
    assert len(mock_db["checkins"].data) == 2


def test_different_users_get_independent_active_sessions(auth_client, mock_db):
    first = auth_client.post("/api/checkin/start")
    second_client = TestClient(app)
    registration = second_client.post(
        "/api/auth/register",
        json={
            "fullName": "Senior Meera",
            "email": "meera@example.com",
            "password": "Password123#",
            "confirmPassword": "Password123#",
            "accountType": "elderly",
            "termsAccepted": True,
        },
    )
    second_token = registration.json()["accessToken"]
    second_client.headers = {
        "Authorization": f"Bearer {second_token}"
    }
    second = second_client.post("/api/checkin/start")

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["session_id"] != second.json()["session_id"]
    assert len(mock_db["checkins"].data) == 2


def test_message_persistence_appends_without_replacing_history(
    auth_client, mock_db, monkeypatch
):
    import app.routes.checkin as checkin_route
    from app.schemas.voice import VoiceResponse

    async def fake_response(*args, **kwargs):
        return VoiceResponse(response_text="I am glad to hear that.")

    monkeypatch.setattr(checkin_route, "generate_llm_response", fake_response)
    started = auth_client.post("/api/checkin/start")
    session_id = started.json()["session_id"]
    first = auth_client.post(
        f"/api/checkin/{session_id}/message",
        json={"transcript": "I slept well.", "conversation": []},
    )
    second = auth_client.post(
        f"/api/checkin/{session_id}/message",
        json={"transcript": "My knees feel better.", "conversation": []},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    stored = mock_db["checkins"].data[session_id]["messages"]
    assert [item["speaker"] for item in stored] == [
        "user",
        "saanidhya",
        "user",
        "saanidhya",
    ]

    async def failed_response(*args, **kwargs):
        raise RuntimeError("Gemini unavailable")

    monkeypatch.setattr(checkin_route, "generate_llm_response", failed_response)
    failed = auth_client.post(
        f"/api/checkin/{session_id}/message",
        json={"transcript": "This request should not be stored.", "conversation": []},
    )

    assert failed.status_code == 502
    assert len(mock_db["checkins"].data[session_id]["messages"]) == 4


def test_end_checkin_stores_gemini_summary_and_messages(
    auth_client, mock_db, monkeypatch
):
    import app.routes.checkin as checkin_route

    async def fake_summary(messages):
        assert len(messages) == 2
        return "The user slept well and felt comfortable."

    monkeypatch.setattr(checkin_route.gemini_service, "summarize", fake_summary)
    started = auth_client.post("/api/checkin/start")
    session_id = started.json()["session_id"]
    mock_db["checkins"].data[session_id]["messages"] = [
        {"speaker": "user", "text": "I slept well."},
        {"speaker": "saanidhya", "text": "I am glad to hear that."},
    ]

    ended = auth_client.post(f"/api/checkin/{session_id}/end")
    history = auth_client.get("/api/checkin/history")

    assert ended.status_code == 200
    assert history.status_code == 200
    record = history.json()[0]
    assert record["summary"] == "The user slept well and felt comfortable."
    assert len(record["messages"]) == 2
    assert len(record["dialogue"]) == 2


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
