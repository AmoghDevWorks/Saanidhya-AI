import asyncio

import pytest

from app.services.gnani_service import (
    EvonService,
    GnaniIntegrationUnavailable,
    PrismaService,
    TimbreService,
)


def test_prisma_rejects_empty_audio():
    with pytest.raises(ValueError, match="empty"):
        asyncio.run(PrismaService().transcribe(b"", "checkin.webm", "audio/webm"))


def test_provider_adapters_fail_explicitly_without_official_contracts():
    with pytest.raises(GnaniIntegrationUnavailable):
        asyncio.run(
            PrismaService().transcribe(b"audio", "checkin.webm", "audio/webm")
        )
    with pytest.raises(GnaniIntegrationUnavailable):
        asyncio.run(EvonService().respond("I slept well.", [], "en"))
    with pytest.raises(GnaniIntegrationUnavailable):
        asyncio.run(TimbreService().synthesize("Good morning.", "en"))
