"""Backend adapters for Prisma STT, Gemini conversation, and Timbre TTS."""

import base64
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.schemas.voice import SynthesisResponse, VoiceResponse
from app.services.llm_errors import GnaniIntegrationUnavailable

logger = logging.getLogger("saanidhya.gnani")


class PrismaService:
    provider = "prisma"
    endpoint = "https://api.vachana.ai/stt/v3"

    async def transcribe(
        self,
        audio: bytes,
        filename: str,
        content_type: str,
        language_code: Optional[str] = None,
        model: Optional[str] = None,
        output_format: Optional[str] = None,
    ) -> Dict[str, Optional[str]]:
        if not audio:
            raise ValueError("Audio payload is empty.")
        if not settings.PRISMA_API_KEY:
            raise GnaniIntegrationUnavailable("Prisma API key is not configured.")
        allowed_types = {
            ".wav": "audio/wav",
            ".mp3": "audio/mpeg",
            ".ogg": "audio/ogg",
            ".flac": "audio/flac",
            ".aac": "audio/aac",
            ".m4a": "audio/mp4",
        }
        suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if suffix not in allowed_types:
            raise ValueError(
                "Unsupported audio format. Use WAV, MP3, OGG, FLAC, AAC, or M4A."
            )
        try:
            async with httpx.AsyncClient(
                timeout=settings.GNANI_REQUEST_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(
                    self.endpoint,
                    headers={"X-API-Key-ID": settings.PRISMA_API_KEY},
                    files={
                        "audio_file": (
                            filename,
                            audio,
                            content_type or allowed_types[suffix],
                        )
                    },
                    data={
                        "model": model or settings.PRISMA_MODEL,
                        "language_code": language_code or settings.PRISMA_LANGUAGE_CODE,
                        "format": output_format or settings.PRISMA_FORMAT,
                    },
                )
        except httpx.TimeoutException as exc:
            raise GnaniIntegrationUnavailable("Prisma request timed out.") from exc
        except httpx.HTTPError as exc:
            raise GnaniIntegrationUnavailable(
                "Prisma request could not be completed."
            ) from exc
        if response.status_code != 200:
            raise GnaniIntegrationUnavailable(_provider_error("Prisma", response))
        body = response.json()
        transcript = body.get("transcript")
        if not isinstance(transcript, str):
            raise GnaniIntegrationUnavailable(
                "Prisma returned an invalid transcription response."
            )
        return {
            "transcript": transcript,
            "language": body.get("detected_language_code"),
        }


class TimbreService:
    provider = "timbre"
    endpoint = "https://api.vachana.ai/api/v1/tts/inference"

    async def synthesize(
        self,
        response_text: str,
        language: Optional[str] = None,
        voice: Optional[str] = None,
    ) -> SynthesisResponse:
        if not response_text.strip():
            raise ValueError("Response text is empty.")
        if not settings.TIMBRE_API_KEY:
            raise GnaniIntegrationUnavailable("Timbre API key is not configured.")
        try:
            async with httpx.AsyncClient(
                timeout=settings.GNANI_REQUEST_TIMEOUT_SECONDS
            ) as client:
                response = await client.post(
                    self.endpoint,
                    headers={
                        "X-API-Key-ID": settings.TIMBRE_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "text": response_text,
                        "voice": voice or settings.TIMBRE_VOICE,
                        "model": settings.TIMBRE_MODEL,
                        "language": language or settings.TIMBRE_LANGUAGE,
                        "speed": 1.0,
                        "audio_config": {
                            "sample_rate": 48000,
                            "num_channels": 1,
                            "sample_width": 2,
                            "encoding": "linear_pcm",
                            "container": "wav",
                        },
                    },
                )
        except httpx.TimeoutException as exc:
            raise GnaniIntegrationUnavailable("Timbre request timed out.") from exc
        except httpx.HTTPError as exc:
            raise GnaniIntegrationUnavailable(
                "Timbre request could not be completed."
            ) from exc
        if response.status_code != 200 or not response.content:
            raise GnaniIntegrationUnavailable(_provider_error("Timbre", response))
        return SynthesisResponse(
            audio_base64=base64.b64encode(response.content).decode("ascii"),
            media_type=response.headers.get("content-type", "audio/wav").split(";")[0],
        )


def _provider_error(provider: str, response: httpx.Response) -> str:
    try:
        body = response.json()
        error = body.get("error")
        error_message = error.get("message") if isinstance(error, dict) else error
        detail = body.get("message") or body.get("detail") or error_message
        if detail:
            return f"{provider} request failed: {detail}"
    except (ValueError, TypeError):
        pass
    return f"{provider} request failed with status {response.status_code}."


prisma_service = PrismaService()
timbre_service = TimbreService()


async def generate_llm_response(
    transcript: str,
    conversation: List[Dict[str, Any]],
    language: Optional[str] = None,
    memory_context: Optional[List[Dict[str, Any]]] = None,
) -> VoiceResponse:
    if settings.LLM_PROVIDER.lower() != "gemini":
        raise GnaniIntegrationUnavailable(
            "Gemini is the only supported LLM provider."
        )
    return await gemini_service.respond(
        transcript, conversation, language, memory_context
    )


async def llm_status() -> Dict[str, Any]:
    return await gemini_service.status()


from app.services.gemini_service import GeminiService

gemini_service = GeminiService()
