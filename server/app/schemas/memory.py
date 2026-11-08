from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MemoryCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    key: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=500)
    source: str = "checkin"
    confidence: float = Field(default=1.0, ge=0, le=1)
    expires_at: Optional[datetime] = None


class MemoryUpdate(BaseModel):
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    key: Optional[str] = Field(default=None, min_length=1, max_length=100)
    value: Optional[str] = Field(default=None, min_length=1, max_length=500)
    expires_at: Optional[datetime] = None


class MemoryResponse(BaseModel):
    id: str
    category: str
    key: str
    value: str
    source: str
    confidence: float
    created_at: datetime
    last_referenced_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class MemoryListResponse(BaseModel):
    memories: List[MemoryResponse]
    memory_consent: bool


class MemoryConsentRequest(BaseModel):
    enabled: bool


class MemoryConsentResponse(BaseModel):
    enabled: bool
    deleted_count: int = 0
