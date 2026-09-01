"""Provider-independent manifest generation."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from forgeui.llm.fake import ScriptedProvider
from forgeui.llm.generation import GenerationEngine, generate_manifest
from forgeui.llm.types import (
    AttemptRecord,
    GenerationProgress,
    GenerationRequest,
    GenerationResult,
    LLMProvider,
    ProviderError,
    ProviderInvalidResponseError,
    ProviderResponse,
    ProviderTimeoutError,
    ProviderUnavailableError,
)

if TYPE_CHECKING:
    from forgeui.llm.ollama import OllamaProvider


def __getattr__(name: str) -> Any:
    """Load the HTTP-backed provider only when the Ollama extra is used."""

    if name == "OllamaProvider":
        from forgeui.llm.ollama import OllamaProvider

        return OllamaProvider
    raise AttributeError(name)


__all__ = [
    "AttemptRecord",
    "GenerationEngine",
    "GenerationProgress",
    "GenerationRequest",
    "GenerationResult",
    "LLMProvider",
    "OllamaProvider",
    "ProviderError",
    "ProviderInvalidResponseError",
    "ProviderResponse",
    "ProviderTimeoutError",
    "ProviderUnavailableError",
    "ScriptedProvider",
    "generate_manifest",
]
