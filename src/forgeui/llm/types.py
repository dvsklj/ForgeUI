"""Types shared by model providers and the generation pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

from pydantic import BaseModel, ConfigDict, Field

from forgeui.domain.models import ContractId, ForgeManifest, RuntimeIdentifier


class GenerationRequest(BaseModel):
    """A bounded authoring request; provider location and model are never request fields."""

    model_config = ConfigDict(extra="forbid", strict=True)

    brief: str = Field(min_length=4, max_length=4_000)
    profile: Literal[
        "choose", "ops-compact", "signal-cards", "executive-summary", "calm-neutral"
    ] = "choose"
    data_contract: ContractId = "device-health/1"
    data_source: RuntimeIdentifier = "device-health"
    sample_data: dict[str, Any] = Field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ChatMessage:
    role: Literal["system", "user", "assistant"]
    content: str


@dataclass(frozen=True, slots=True)
class ProviderResponse:
    content: str
    model: str
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_duration_ns: int | None = None


class ProviderError(RuntimeError):
    """Base provider failure with a stable public error code."""

    code = "provider_error"


class ProviderUnavailableError(ProviderError):
    code = "provider_unavailable"


class ProviderTimeoutError(ProviderError):
    code = "provider_timeout"


class ProviderInvalidResponseError(ProviderError):
    code = "provider_invalid_response"


class LLMProvider(Protocol):
    """Minimal async boundary implemented by Ollama and deterministic test providers."""

    async def complete(
        self,
        messages: tuple[ChatMessage, ...],
        *,
        schema: dict[str, Any],
    ) -> ProviderResponse: ...

    async def health(self) -> bool: ...


@dataclass(frozen=True, slots=True)
class GenerationProgress:
    phase: Literal["generating", "validating", "repairing", "succeeded", "failed", "cancelled"]
    attempt: int
    max_attempts: int = 3
    issue_codes: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class AttemptRecord:
    attempt: int
    candidate_hash: str
    valid: bool
    issue_codes: tuple[str, ...] = ()
    model: str | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_duration_ns: int | None = None


@dataclass(frozen=True, slots=True)
class GenerationResult:
    status: Literal["succeeded", "failed", "cancelled"]
    manifest: ForgeManifest | None
    attempts: tuple[AttemptRecord, ...] = field(default_factory=tuple)
    error_code: str | None = None
    error_message: str | None = None

    @property
    def succeeded(self) -> bool:
        return self.status == "succeeded" and self.manifest is not None
