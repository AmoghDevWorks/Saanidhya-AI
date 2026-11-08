"""Backend adapters for Prisma, local Evon Transformers, and Timbre."""

import asyncio
import base64
import importlib
import logging
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.schemas.voice import SynthesisResponse, VoiceResponse

logger = logging.getLogger("saanidhya.gnani")


class GnaniIntegrationUnavailable(RuntimeError):
    """Raised when a provider is unavailable or not configured."""


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
        fields = {
            "model": model or settings.PRISMA_MODEL,
            "language_code": language_code or settings.PRISMA_LANGUAGE_CODE,
            "format": output_format or settings.PRISMA_FORMAT,
        }
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
                    data=fields,
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


class EvonService:
    """Lazy, process-local Transformers service for the Evon model.

    The model is loaded only on the first inference request. A failed load is
    cached so an unavailable 30B model cannot trigger repeated expensive retries.
    """

    provider = "evon"
    model_id = "gnani/gnani-evon-v3.3-30B-A3B"

    def __init__(self) -> None:
        self._model: Any = None
        self._tokenizer: Any = None
        self._load_lock = Lock()
        self._inference_semaphore = asyncio.Semaphore(
            max(1, settings.EVON_MAX_CONCURRENT_REQUESTS)
        )
        self._load_error: Optional[str] = None
        self._status = "disabled" if not settings.EVON_ENABLED else "not_loaded"

    async def respond(
        self,
        transcript: str,
        conversation: List[Dict[str, Any]],
        language: Optional[str] = None,
        memory_context: Optional[List[Dict[str, Any]]] = None,
    ) -> VoiceResponse:
        if not transcript.strip():
            raise ValueError("Transcript is empty.")
        if not settings.EVON_ENABLED:
            raise GnaniIntegrationUnavailable("Evon is disabled by configuration.")
        if settings.EVON_INFERENCE_MODE != "local":
            raise GnaniIntegrationUnavailable(
                "Evon supports local Transformers inference only."
            )
        messages = _build_evon_messages(
            conversation, memory_context or [], transcript
        )
        try:
            async with asyncio.timeout(settings.EVON_INFERENCE_TIMEOUT_SECONDS):
                async with self._inference_semaphore:
                    return await asyncio.to_thread(
                        self._generate_local, messages, language
                    )
        except TimeoutError as exc:
            raise GnaniIntegrationUnavailable("Evon inference timed out.") from exc

    def status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider,
            "model_id": settings.EVON_MODEL_ID,
            "enabled": settings.EVON_ENABLED,
            "mode": settings.EVON_INFERENCE_MODE,
            "state": self._status,
            "error": self._load_error,
            "cache_dir": settings.EVON_MODEL_CACHE_DIR,
        }

    def _ensure_loaded(self) -> None:
        if self._model is not None and self._tokenizer is not None:
            return
        if self._load_error:
            raise GnaniIntegrationUnavailable(self._load_error)
        with self._load_lock:
            if self._model is not None and self._tokenizer is not None:
                return
            if self._load_error:
                raise GnaniIntegrationUnavailable(self._load_error)
            self._status = "loading"
            try:
                transformers = importlib.import_module("transformers")
                cache_dir = str(Path(settings.EVON_MODEL_CACHE_DIR).resolve())
                self._tokenizer = transformers.AutoTokenizer.from_pretrained(
                    settings.EVON_MODEL_ID,
                    cache_dir=cache_dir,
                )
                self._model = transformers.AutoModelForCausalLM.from_pretrained(
                    settings.EVON_MODEL_ID,
                    cache_dir=cache_dir,
                    device_map=settings.EVON_DEVICE_MAP,
                    torch_dtype="auto",
                )
                self._status = "ready"
            except Exception as exc:
                self._model = None
                self._tokenizer = None
                self._status = "unavailable"
                self._load_error = (
                    "Evon local model initialization failed. "
                    f"{type(exc).__name__}: {exc}"
                )
                logger.warning("Evon initialization failed: %s", type(exc).__name__)
                raise GnaniIntegrationUnavailable(self._load_error) from exc

    def _generate_local(
        self, messages: List[Dict[str, str]], language: Optional[str]
    ) -> VoiceResponse:
        del language
        self._ensure_loaded()
        try:
            inputs = self._tokenizer.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
            )
            input_device = next(self._model.parameters()).device
            inputs = inputs.to(input_device)
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=settings.EVON_MAX_NEW_TOKENS,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
            )
            prompt_length = inputs["input_ids"].shape[-1]
            text = self._tokenizer.decode(
                outputs[0][prompt_length:], skip_special_tokens=True
            ).strip()
            if not text:
                raise RuntimeError("Evon returned an empty response.")
            return VoiceResponse(response_text=text)
        except GnaniIntegrationUnavailable:
            raise
        except Exception as exc:
            raise GnaniIntegrationUnavailable(
                f"Evon local inference failed: {type(exc).__name__}: {exc}"
            ) from exc


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
        payload = {
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
        }
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
                    json=payload,
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


def _build_evon_messages(
    conversation: List[Dict[str, Any]],
    memories: List[Dict[str, Any]],
    transcript: str,
) -> List[Dict[str, str]]:
    messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": (
                "You are Saanidhya, a warm and concise multilingual voice companion "
                "for an elderly user. Use supplied memories only when relevant. "
                "Do not diagnose medical conditions."
            ),
        }
    ]
    if memories:
        context = "; ".join(
            f"{item.get('key', item.get('category', 'memory'))}: "
            f"{item.get('value', '')}"
            for item in memories
        )
        messages.append(
            {"role": "system", "content": f"Relevant remembered context: {context}"}
        )
    for item in conversation[-20:]:
        role = "assistant" if item.get("speaker") in {"assistant", "saanidhya"} else "user"
        content = item.get("text")
        if isinstance(content, str) and content.strip():
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": transcript})
    return messages


prisma_service = PrismaService()
evon_service = EvonService()
timbre_service = TimbreService()
