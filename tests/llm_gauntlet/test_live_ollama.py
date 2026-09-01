from __future__ import annotations

import os

import pytest

from forgeui.config import Settings
from forgeui.llm import GenerationRequest, OllamaProvider, generate_manifest


@pytest.mark.ollama
@pytest.mark.slow
@pytest.mark.skipif(
    os.getenv("FORGEUI_RUN_OLLAMA_GAUNTLET") != "1",
    reason="set FORGEUI_RUN_OLLAMA_GAUNTLET=1 to exercise a configured Ollama model",
)
@pytest.mark.asyncio
async def test_live_model_returns_a_valid_device_dashboard() -> None:
    settings = Settings()
    async with OllamaProvider(settings) as provider:
        result = await generate_manifest(
            provider,
            GenerationRequest(
                brief="Create a compact fleet overview with health counts and a device table.",
                profile="ops-compact",
            ),
            deadline_seconds=settings.generation_job_timeout_seconds,
        )
    assert result.succeeded, (result.error_code, result.error_message, result.attempts)
