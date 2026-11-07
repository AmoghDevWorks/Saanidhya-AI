from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from pymongo.collection import Collection

from app.database import get_users_collection
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    AuthResponse,
    MessageResponse,
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    get_user_by_id,
)
from app.utils.security import decode_access_token

router = APIRouter(prefix="", tags=["Authentication"])
security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        security_bearer
    ),
    users_collection: Collection = Depends(get_users_collection),
) -> UserResponse:
    """Dependency that extracts and validates the Bearer token and returns the current authenticated user."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(users_collection, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    return user


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers an Elderly User or Family Member with Argon2 password hashing and returns an access token.",
)
async def register(
    payload: RegisterRequest,
    users_collection: Collection = Depends(get_users_collection),
):
    return register_user(users_collection, payload)


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user",
    description="Validates user email and password against Argon2 hash, issuing a JWT access token.",
)
async def login(
    payload: LoginRequest,
    users_collection: Collection = Depends(get_users_collection),
):
    return authenticate_user(users_collection, payload)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Returns the profile information of the currently authenticated user.",
)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Log out user",
    description="Stateless token logout endpoint. Client removes stored token; note that stateless JWTs cannot be revoked server-side without a persistent blocklist.",
)
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        security_bearer
    ),
):
    return MessageResponse(
        success=True,
        message="Logged out successfully. Please remove the access token from client storage.",
    )
