import asyncio

import pytest

from app.services.gemini_service import GeminiService
from app.services.llm_errors import GnaniIntegrationUnavailable


class FakeGeminiResponse:
    text = "I hope you are feeling comfortable today."


class FakeModels:
    response = FakeGeminiResponse()
    calls = []

    async def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        return self.response


class FakeAio:
    def __init__(self):
        self.models = FakeModels()


class FakeClient:
    instances = []

    def __init__(self, api_key, **kwargs):
        self.api_key = api_key
        self.kwargs = kwargs
        self.aio = FakeAio()
        self.instances.append(self)


def test_gemini_generation_preserves_system_history_and_memory(monkeypatch):
    from app.config import settings
    from google import genai

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
    FakeClient.instances = []
    FakeModels.calls = []
    monkeypatch.setattr(genai, "Client", FakeClient)

    result = asyncio.run(
        GeminiService().respond(
            "How are you feeling?",
            [{"speaker": "saanidhya", "text": "Good morning."}],
            "en-IN",
            [{"key": "grandson_exam", "value": "next Friday"}],
        )
    )

    assert result.response_text.startswith("I hope")
    call = FakeModels.calls[-1]
    assert call["model"] == "gemini-2.5-flash"
    assert "elderly user" in call["config"]["system_instruction"]
    assert "grandson_exam" in call["config"]["system_instruction"]
    assert call["contents"][0]["role"] == "model"
    assert call["contents"][-1]["role"] == "user"


def test_gemini_requires_api_key(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    with pytest.raises(GnaniIntegrationUnavailable, match="not configured"):
        asyncio.run(GeminiService().respond("Hello", [], "en"))


def test_gemini_maps_auth_and_quota_errors(monkeypatch):
    from app.config import settings
    from google import genai

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")

    class FailingModels:
        async def generate_content(self, **kwargs):
            raise RuntimeError("429 quota exceeded")

    class FailingClient:
        def __init__(self, api_key, **kwargs):
            self.aio = type("Aio", (), {"models": FailingModels()})()

    monkeypatch.setattr(genai, "Client", FailingClient)
    with pytest.raises(GnaniIntegrationUnavailable, match="quota"):
        asyncio.run(GeminiService().respond("Hello", [], "en"))


def test_gemini_maps_timeout(monkeypatch):
    from app.config import settings
    from google import genai

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "GEMINI_INFERENCE_TIMEOUT_SECONDS", 0.001)

    class SlowModels:
        async def generate_content(self, **kwargs):
            await asyncio.sleep(1)

    class SlowClient:
        def __init__(self, api_key, **kwargs):
            self.aio = type("Aio", (), {"models": SlowModels()})()

    monkeypatch.setattr(genai, "Client", SlowClient)
    with pytest.raises(GnaniIntegrationUnavailable, match="timed out"):
        asyncio.run(GeminiService().respond("Hello", [], "en"))


def test_gemini_generates_short_conversation_summary(monkeypatch):
    from app.config import settings
    from google import genai

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    FakeModels.calls = []
    monkeypatch.setattr(genai, "Client", FakeClient)

    summary = asyncio.run(
        GeminiService().summarize(
            [
                {"speaker": "user", "text": "I slept well last night."},
                {"speaker": "saanidhya", "text": "That is good to hear."},
            ]
        )
    )

    assert summary.startswith("I hope")
    call = FakeModels.calls[-1]
    assert call["config"]["max_output_tokens"] == 128
    assert "Summarize this elderly care conversation" in call["config"]["system_instruction"]
