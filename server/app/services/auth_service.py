import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    AuthResponse,
)
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token,
)

logger = logging.getLogger("saanidhya.auth_service")


def user_doc_to_response(doc: Dict[str, Any]) -> UserResponse:
    """Convert a MongoDB user document into a safe UserResponse (without password hash)."""
    return UserResponse(
        id=str(doc.get("_id")),
        fullName=doc.get("full_name", ""),
        email=doc.get("email", ""),
        accountType=doc.get("account_type", "elderly"),
        isActive=doc.get("is_active", True),
        createdAt=doc.get("created_at") or datetime.now(timezone.utc),
    )


def register_user(
    users_collection: Collection, payload: RegisterRequest
) -> AuthResponse:
    """Register a new user in MongoDB and issue an initial access token."""
    normalized_email = payload.email.strip().lower()

    # Check for existing email before insertion
    try:
        existing_user = users_collection.find_one({"email": normalized_email})
    except PyMongoError as e:
        logger.error(f"Database query error during user check: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error. Please verify MongoDB connection string.",
        )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    # Hash the password with Argon2
    hashed_pw = hash_password(payload.password)
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_doc = {
        "_id": user_id,
        "full_name": payload.full_name.strip(),
        "email": normalized_email,
        "hashed_password": hashed_pw,
        "account_type": payload.account_type.value,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "memory_consent": False,
    }

    try:
        users_collection.insert_one(user_doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )
    except PyMongoError as e:
        logger.error(f"Database insertion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account due to a database error.",
        )

    # Issue JWT access token
    token = create_access_token(
        data={
            "sub": user_id,
            "email": normalized_email,
            "account_type": payload.account_type.value,
        }
    )

    user_resp = user_doc_to_response(user_doc)
    return AuthResponse(
        success=True,
        message="Account created successfully.",
        accessToken=token,
        tokenType="bearer",
        user=user_resp,
    )


def authenticate_user(
    users_collection: Collection, payload: LoginRequest
) -> AuthResponse:
    """Authenticate user credentials against Argon2 hash and return access token."""
    normalized_email = payload.email.strip().lower()

    try:
        user = users_collection.find_one({"email": normalized_email})
    except PyMongoError as e:
        logger.error(f"Database query error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error. Please verify MongoDB connection string.",
        )

    # Unified 401 error message for non-existent user or invalid password
    invalid_creds_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not user:
        raise invalid_creds_exception

    if not verify_password(payload.password, user.get("hashed_password", "")):
        raise invalid_creds_exception

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support.",
        )

    # Optional extended session for 'rememberMe'
    expires_delta = None
    if payload.remember_me:
        expires_delta = timedelta(days=7)

    token = create_access_token(
        data={
            "sub": str(user["_id"]),
            "email": user["email"],
            "account_type": user.get("account_type", "elderly"),
        },
        expires_delta=expires_delta,
    )

    user_resp = user_doc_to_response(user)
    return AuthResponse(
        success=True,
        message="Logged in successfully.",
        accessToken=token,
        tokenType="bearer",
        user=user_resp,
    )


def get_user_by_id(
    users_collection: Collection, user_id: str
) -> Optional[UserResponse]:
    """Retrieve user by ID."""
    try:
        user = users_collection.find_one({"_id": user_id})
    except PyMongoError as e:
        logger.error(f"Database query error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection error.",
        )

    if not user:
        return None
    return user_doc_to_response(user)
