from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ObservationSet(BaseModel):
    mood: Optional[str] = None
    sleep: Optional[str] = None
    discomfort: Optional[str] = None
    medication_status: Optional[str] = None
    loneliness: Optional[str] = None
    follow_up_information: List[str] = Field(default_factory=list)


class VoiceResponse(BaseModel):
    response_text: str
    language: Optional[str] = None
    observations: ObservationSet = Field(default_factory=ObservationSet)
    follow_up_required: bool = False
    alert_level: str = "normal"


class TranscriptionResponse(BaseModel):
    transcript: str
    language: Optional[str] = None
    provider: str = "prisma"


class SynthesisResponse(BaseModel):
    audio_base64: str
    media_type: str
    provider: str = "timbre"


class RespondRequest(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=10000)
    language: Optional[str] = None
    conversation: List[Dict[str, Any]] = Field(default_factory=list)
    memory_context: List[Dict[str, Any]] = Field(default_factory=list)


class SynthesizeRequest(BaseModel):
    response_text: str = Field(..., min_length=1, max_length=10000)
    language: Optional[str] = None
    voice: Optional[str] = None


class CheckinStartResponse(BaseModel):
    session_id: str
    started_at: datetime
    relevant_memories: List[Dict[str, Any]] = Field(default_factory=list)


class CheckinMessageRequest(BaseModel):
    transcript: Optional[str] = Field(default=None, min_length=1, max_length=10000)
    audio: Optional[bool] = False
    language: Optional[str] = None
    conversation: List[Dict[str, Any]] = Field(default_factory=list)


class CheckinMessageResponse(BaseModel):
    session_id: str
    transcript: str
    response: VoiceResponse
    audio: Optional[SynthesisResponse] = None


class CheckinEndResponse(BaseModel):
    session_id: str
    ended_at: datetime
    summary: Optional[str] = None
