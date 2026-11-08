"""Google Gemini provider for Saanidhya conversation generation."""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.schemas.voice import VoiceResponse
from app.services.saanidhya_prompt import build_saanidhya_messages
from app.services.llm_errors import GnaniIntegrationUnavailable

logger = logging.getLogger("saanidhya.gemini")


class GeminiService:
    provider = "gemini"

    def __init__(self) -> None:
        self._client: Any = None
        self._client_lock = asyncio.Lock()
        self._inference_semaphore = asyncio.Semaphore(
            max(1, settings.GEMINI_MAX_CONCURRENT_REQUESTS)
        )

    async def respond(
        self,
        transcript: str,
        conversation: List[Dict[str, Any]],
        language: Optional[str] = None,
        memory_context: Optional[List[Dict[str, Any]]] = None,
    ) -> VoiceResponse:
        if not transcript.strip():
            raise ValueError("Transcript is empty.")
        if not settings.GEMINI_API_KEY:
            raise GnaniIntegrationUnavailable(
                "Gemini API key is not configured."
            )
        messages = build_saanidhya_messages(
            conversation, memory_context or [], transcript
        )
        system_instruction = "\n\n".join(
            item["content"] for item in messages if item["role"] == "system"
        )
        contents = [
            {
                "role": "model" if item["role"] == "assistant" else item["role"],
                "parts": [{"text": item["content"]}],
            }
            for item in messages
            if item["role"] != "system"
        ]
        try:
            async with self._inference_semaphore:
                client = await self._get_client()
                started = time.perf_counter()
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=settings.GEMINI_MODEL,
                        contents=contents,
                        config={
                            "system_instruction": system_instruction,
                            "temperature": settings.GEMINI_TEMPERATURE,
                            "max_output_tokens": settings.GEMINI_MAX_OUTPUT_TOKENS,
                        },
                    ),
                    timeout=settings.GEMINI_INFERENCE_TIMEOUT_SECONDS,
                )
                logger.info(
                    "Gemini inference completed in %.2fs",
                    time.perf_counter() - started,
                )
        except asyncio.TimeoutError as exc:
            raise GnaniIntegrationUnavailable("Gemini inference timed out.") from exc
        except GnaniIntegrationUnavailable:
            raise
        except Exception as exc:
            raise GnaniIntegrationUnavailable(
                _gemini_error_message(exc)
            ) from exc

        text = getattr(response, "text", None)
        if not isinstance(text, str) or not text.strip():
            raise GnaniIntegrationUnavailable("Gemini returned an empty response.")
        return VoiceResponse(response_text=text.strip(), language=language)

    async def status(self) -> Dict[str, Any]:
        if not settings.GEMINI_API_KEY:
            return {
                "provider": self.provider,
                "available": False,
                "configured": False,
                "model": settings.GEMINI_MODEL,
            }
        return {
            "provider": self.provider,
            "available": True,
            "configured": True,
            "model": settings.GEMINI_MODEL,
        }

    async def _get_client(self) -> Any:
        if self._client is not None:
            return self._client
        async with self._client_lock:
            if self._client is not None:
                return self._client
            try:
                from google import genai
                from google.genai import types
            except ImportError as exc:
                raise GnaniIntegrationUnavailable(
                    "The google-genai package is not installed."
                ) from exc
            try:
                self._client = genai.Client(
                    api_key=settings.GEMINI_API_KEY,
                    http_options=types.HttpOptions(
                        async_client_args={
                            "timeout": httpx.Timeout(
                                settings.GEMINI_INFERENCE_TIMEOUT_SECONDS,
                                connect=settings.GEMINI_CONNECT_TIMEOUT_SECONDS,
                            )
                        }
                    ),
                )
            except Exception as exc:
                raise GnaniIntegrationUnavailable(
                    "Gemini client initialization failed."
                ) from exc
            return self._client


def _gemini_error_message(error: Exception) -> str:
    name = type(error).__name__.lower()
    message = str(error).lower()
    if "authentication" in name or "api key" in message or "401" in message:
        return "Gemini API authentication failed."
    if "resourceexhausted" in name or "quota" in message or "429" in message:
        return "Gemini API quota or rate limit was exceeded."
    if "deadline" in message or "timeout" in name:
        return "Gemini API request timed out."
    return "Gemini API request failed."
