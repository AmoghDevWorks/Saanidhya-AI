import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

from app.main import app
from app.database import get_users_collection


class MockUsersCollection:
    """In-memory collection mock for PyMongo users collection."""

    def __init__(self):
        self.users = {}

    def find_one(self, filter_dict):
        if "_id" in filter_dict:
            return self.users.get(filter_dict["_id"])
        if "email" in filter_dict:
            target_email = filter_dict["email"]
            for u in self.users.values():
                if u.get("email") == target_email:
                    return u.copy()
        return None

    def insert_one(self, doc):
        doc_id = doc.get("_id")
        email = doc.get("email")
        for u in self.users.values():
            if u.get("email") == email:
                raise DuplicateKeyError(
                    f"E11000 duplicate key error collection: index: email dup key: {email}"
                )
        self.users[doc_id] = doc.copy()
        return type("InsertResult", (), {"inserted_id": doc_id})()


@pytest.fixture
def mock_collection():
    mock_col = MockUsersCollection()
    app.dependency_overrides[get_users_collection] = lambda: mock_col
    yield mock_col
    app.dependency_overrides.clear()


@pytest.fixture
def client(mock_collection):
    with TestClient(app) as test_client:
        yield test_client


def test_1_register_elderly_user(client):
    """Scenario 1: Register a new elderly user."""
    payload = {
        "fullName": "Sita Ram",
        "email": "sita.ram@example.com",
        "password": "Password123#",
        "confirmPassword": "Password123#",
        "accountType": "elderly",
        "termsAccepted": True,
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "accessToken" in data
    assert data["user"]["accountType"] == "elderly"
    assert data["user"]["email"] == "sita.ram@example.com"
    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]


def test_2_register_family_member(client):
    """Scenario 2: Register a new family member/caregiver."""
    payload = {
        "fullName": "Ananya Rao",
        "email": "ananya.rao@example.com",
        "password": "SecurePassword456!",
        "confirmPassword": "SecurePassword456!",
        "accountType": "family",
        "termsAccepted": True,
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["user"]["accountType"] == "family"
    assert data["user"]["fullName"] == "Ananya Rao"


def test_3_register_duplicate_email(client):
    """Scenario 3: Attempt registration with an existing email."""
    payload = {
        "fullName": "First User",
        "email": "duplicate@example.com",
        "password": "Password123#",
        "confirmPassword": "Password123#",
        "accountType": "elderly",
        "termsAccepted": True,
    }
    # First registration
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email (case-insensitive test)
    payload["email"] = "DUPLICATE@example.com"
    payload["fullName"] = "Duplicate User"
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"].lower()


def test_4_register_mismatched_passwords(client):
    """Scenario 4: Attempt registration with mismatched passwords."""
    payload = {
        "fullName": "Mismatch Test",
        "email": "mismatch@example.com",
        "password": "Password123#",
        "confirmPassword": "DifferentPassword123#",
        "accountType": "elderly",
        "termsAccepted": True,
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_5_login_valid_credentials(client):
    """Scenario 5: Login with valid credentials."""
    # First create user
    reg_payload = {
        "fullName": "Login Tester",
        "email": "login.valid@example.com",
        "password": "CorrectPassword123!",
        "confirmPassword": "CorrectPassword123!",
        "accountType": "elderly",
        "termsAccepted": True,
    }
    client.post("/api/auth/register", json=reg_payload)

    # Now login
    login_payload = {
        "email": "login.valid@example.com",
        "password": "CorrectPassword123!",
        "rememberMe": True,
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "accessToken" in data
    assert data["user"]["email"] == "login.valid@example.com"


def test_6_login_incorrect_credentials(client):
    """Scenario 6: Login with incorrect credentials."""
    # User does not exist
    res1 = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "WrongPassword1!"},
    )
    assert res1.status_code == 401

    # Existing user with wrong password
    reg_payload = {
        "fullName": "User One",
        "email": "user.one@example.com",
        "password": "CorrectPassword123!",
        "confirmPassword": "CorrectPassword123!",
        "accountType": "family",
        "termsAccepted": True,
    }
    client.post("/api/auth/register", json=reg_payload)

    res2 = client.post(
        "/api/auth/login",
        json={"email": "user.one@example.com", "password": "IncorrectPassword123!"},
    )
    assert res2.status_code == 401
    assert "Invalid email or password" in res2.json()["detail"]


def test_7_fetch_current_user_profile(client):
    """Scenario 7: Fetch the current user profile from GET /api/auth/me."""
    reg_payload = {
        "fullName": "Profile User",
        "email": "profile@example.com",
        "password": "Password123#",
        "confirmPassword": "Password123#",
        "accountType": "elderly",
        "termsAccepted": True,
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    token = reg_res.json()["accessToken"]

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "profile@example.com"
    assert profile["fullName"] == "Profile User"
    assert profile["accountType"] == "elderly"
    assert "password" not in profile


def test_8_protected_endpoint_without_token(client):
    """Scenario 8: Access protected endpoint without a token."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "missing" in response.json()["detail"].lower()


def test_9_protected_endpoint_with_invalid_token(client):
    """Scenario 9: Access protected endpoint with an invalid token."""
    response = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer invalid.token.signature"}
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_10_logout(client):
    """Scenario 10: Logout and verify the stateless token response."""
    response = client.post(
        "/api/auth/logout", headers={"Authorization": "Bearer some.token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_11_role_based_attributes(client):
    """Scenario 11: Verify backend accurately assigns and returns user role."""
    # Elderly user
    res_elderly = client.post(
        "/api/auth/register",
        json={
            "fullName": "Elderly Senior",
            "email": "senior@example.com",
            "password": "Password123#",
            "confirmPassword": "Password123#",
            "accountType": "elderly",
            "termsAccepted": True,
        },
    )
    assert res_elderly.json()["user"]["accountType"] == "elderly"

    # Family caregiver
    res_family = client.post(
        "/api/auth/register",
        json={
            "fullName": "Family Caregiver",
            "email": "caregiver@example.com",
            "password": "Password123#",
            "confirmPassword": "Password123#",
            "accountType": "family",
            "termsAccepted": True,
        },
    )
    assert res_family.json()["user"]["accountType"] == "family"
