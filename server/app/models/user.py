from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class AccountType(str, Enum):
    ELDERLY = "elderly"
    FAMILY = "family"


class UserModel(BaseModel):
    """Internal MongoDB User Document Representation."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., alias="_id", description="Unique User Identifier")
    full_name: str = Field(..., description="User's full name")
    email: str = Field(..., description="Normalized lowercase unique email")
    hashed_password: str = Field(..., description="Argon2 hashed password")
    account_type: AccountType = Field(
        ..., description="Account role: elderly or family"
    )
    is_active: bool = Field(default=True, description="Account active status")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    # Optional profile metadata for future modules
    preferred_language: Optional[str] = "en"
    emergency_contacts: Optional[List[Dict[str, Any]]] = []

    def to_mongo_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary suitable for MongoDB insertion."""
        return self.model_dump(by_alias=True)
