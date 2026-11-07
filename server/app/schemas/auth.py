import email_validator
from datetime import datetime
from typing import Optional
from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    ValidationInfo,
    ConfigDict,
)
from app.models.user import AccountType

# Disable DNS MX deliverability lookups to avoid slow/hanging network calls during validation
email_validator.CHECK_DELIVERABILITY = False


class RegisterRequest(BaseModel):
    """Payload for user registration."""

    model_config = ConfigDict(populate_by_name=True)

    full_name: str = Field(
        ...,
        alias="fullName",
        min_length=2,
        max_length=100,
        description="Full Name",
    )
    email: EmailStr = Field(..., description="Unique email address")
    password: str = Field(
        ..., min_length=8, max_length=128, description="Password (min 8 chars)"
    )
    confirm_password: str = Field(
        ..., alias="confirmPassword", description="Password confirmation"
    )
    account_type: AccountType = Field(
        ...,
        alias="accountType",
        description="User role: elderly or family",
    )
    terms_accepted: bool = Field(
        ...,
        alias="termsAccepted",
        description="Consent to terms and privacy policy",
    )

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info: ValidationInfo) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v

    @field_validator("terms_accepted")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError(
                "You must accept the Terms of Service & Privacy Policy to create an account."
            )
        return v


class LoginRequest(BaseModel):
    """Payload for user authentication."""

    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")
    remember_me: Optional[bool] = Field(
        default=False,
        alias="rememberMe",
        description="Whether to extend session lifetime",
    )


class UserResponse(BaseModel):
    """Sanitized user profile response (NEVER exposes password hashes)."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="Unique user identifier")
    full_name: str = Field(
        ..., alias="fullName", description="Full display name"
    )
    email: EmailStr = Field(..., description="Verified email address")
    account_type: AccountType = Field(
        ..., alias="accountType", description="Account type"
    )
    is_active: bool = Field(
        default=True, alias="isActive", description="Account status"
    )
    created_at: datetime = Field(
        ..., alias="createdAt", description="Account creation timestamp"
    )


class AuthResponse(BaseModel):
    """Response returned upon successful authentication or registration."""

    model_config = ConfigDict(populate_by_name=True)

    success: bool = True
    message: str
    access_token: str = Field(..., alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    user: UserResponse


class MessageResponse(BaseModel):
    """Generic status response."""

    model_config = ConfigDict(populate_by_name=True)

    success: bool = True
    message: str
