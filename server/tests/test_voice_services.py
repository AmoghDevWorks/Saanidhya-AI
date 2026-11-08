import asyncio

import httpx
import pytest

from app.services.gnani_service import (
    PrismaService,
    TimbreService,
)
from app.services.gemini_service import GeminiService
from app.services.llm_errors import GnaniIntegrationUnavailable


def test_prisma_rejects_empty_audio():
    with pytest.raises(ValueError, match="empty"):
        asyncio.run(PrismaService().transcribe(b"", "checkin.webm", "audio/webm"))


def test_provider_adapters_fail_explicitly_without_official_contracts(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "PRISMA_API_KEY", "")
    monkeypatch.setattr(settings, "TIMBRE_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    with pytest.raises(GnaniIntegrationUnavailable):
        asyncio.run(
            PrismaService().transcribe(b"audio", "checkin.ogg", "audio/ogg")
        )
    with pytest.raises(GnaniIntegrationUnavailable, match="Gemini"):
        asyncio.run(GeminiService().respond("I slept well.", [], "en"))
    with pytest.raises(GnaniIntegrationUnavailable):
        asyncio.run(TimbreService().synthesize("Good morning.", "en"))


class FakeResponse:
    def __init__(self, status_code, body=None, content=b"", headers=None):
        self.status_code = status_code
        self._body = body or {}
        self.content = content
        self.headers = headers or {}

    def json(self):
        return self._body


class FakeAsyncClient:
    response = None
    calls = []

    def __init__(self, *args, **kwargs):
        self.calls.append((args, kwargs))

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, *args, **kwargs):
        self.calls.append((args, kwargs))
        return self.response


def test_prisma_uses_documented_multipart_contract(monkeypatch):
    from app.config import settings
    import app.services.gnani_service as module

    monkeypatch.setattr(settings, "PRISMA_API_KEY", "test-key")
    FakeAsyncClient.response = FakeResponse(
        200, {"transcript": "नमस्ते", "detected_language_code": "hi-IN"}
    )
    FakeAsyncClient.calls = []
    monkeypatch.setattr(module.httpx, "AsyncClient", FakeAsyncClient)

    result = asyncio.run(
        PrismaService().transcribe(b"audio", "checkin.ogg", "audio/ogg")
    )

    assert result == {"transcript": "नमस्ते", "language": "hi-IN"}
    _, request = FakeAsyncClient.calls[-1]
    assert request["headers"] == {"X-API-Key-ID": "test-key"}
    assert request["files"]["audio_file"][0] == "checkin.ogg"
    assert request["data"]["model"] == "prisma-v3.0"


def test_timbre_returns_binary_audio_as_base64(monkeypatch):
    from app.config import settings
    import app.services.gnani_service as module

    monkeypatch.setattr(settings, "TIMBRE_API_KEY", "test-key")
    FakeAsyncClient.response = FakeResponse(
        200, content=b"RIFF", headers={"content-type": "audio/wav"}
    )
    FakeAsyncClient.calls = []
    monkeypatch.setattr(module.httpx, "AsyncClient", FakeAsyncClient)

    result = asyncio.run(TimbreService().synthesize("नमस्ते", "hi-IN"))

    assert result.audio_base64 == "UklGRg=="
    assert result.media_type == "audio/wav"
    _, request = FakeAsyncClient.calls[-1]
    assert request["headers"]["X-API-Key-ID"] == "test-key"
    assert request["json"]["model"] == "timbre-v2.5"
