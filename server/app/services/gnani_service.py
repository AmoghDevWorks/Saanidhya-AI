"""Provider boundaries for Gnani AI integrations.

The repository does not contain Gnani API documentation. These adapters therefore
fail explicitly until the official endpoint, authentication, and payload contracts
are supplied rather than guessing a provider request.
"""

from typing import Any, Dict, List, Optional

from app.schemas.voice import SynthesisResponse, VoiceResponse


class GnaniIntegrationUnavailable(RuntimeError):
    """Raised when an official Gnani integration contract is not configured."""


class PrismaService:
    provider = "prisma"

    async def transcribe(
        self, audio: bytes, filename: str, content_type: str
    ) -> Dict[str, Optional[str]]:
        if not audio:
            raise ValueError("Audio payload is empty.")
        raise GnaniIntegrationUnavailable(
            "Prisma integration is unavailable: official API documentation is required."
        )


class EvonService:
    provider = "evon"

    async def respond(
        self,
        transcript: str,
        conversation: List[Dict[str, Any]],
        language: Optional[str] = None,
        memory_context: Optional[List[Dict[str, Any]]] = None,
    ) -> VoiceResponse:
        if not transcript.strip():
            raise ValueError("Transcript is empty.")
        raise GnaniIntegrationUnavailable(
            "Evon integration is unavailable: official API documentation is required."
        )


class TimbreService:
    provider = "timbre"

    async def synthesize(
        self, response_text: str, language: Optional[str] = None
    ) -> SynthesisResponse:
        if not response_text.strip():
            raise ValueError("Response text is empty.")
        raise GnaniIntegrationUnavailable(
            "Timbre integration is unavailable: official API documentation is required."
        )


prisma_service = PrismaService()
evon_service = EvonService()
timbre_service = TimbreService()