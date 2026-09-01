"""Bounded, provider-independent manifest generation."""

from __future__ import annotations

import asyncio
import inspect
from collections.abc import Awaitable, Callable
from hashlib import sha256

from forgeui.domain.models import ForgeManifest
from forgeui.llm.prompting import build_generation_messages, build_repair_messages
from forgeui.llm.types import (
    AttemptRecord,
    GenerationProgress,
    GenerationRequest,
    GenerationResult,
    LLMProvider,
    ProviderError,
)
from forgeui.validation import (
    DEFAULT_MANIFEST_POLICY,
    ManifestPolicy,
    manifest_json_schema,
    parse_manifest_candidate,
    validate_manifest,
)
from forgeui.validation.parser import ManifestParseError
from forgeui.validation.validator import ValidationReport

ProgressCallback = Callable[[GenerationProgress], Awaitable[None] | None]
DryRender = Callable[[ForgeManifest], None]
MAX_ATTEMPTS = 3


class GenerationEngine:
    """Generate, validate, and repair without persistence side effects."""

    def __init__(
        self,
        provider: LLMProvider,
        *,
        dry_render: DryRender | None = None,
        deadline_seconds: float = 180.0,
        policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY,
    ) -> None:
        self._provider = provider
        self._dry_render = dry_render
        self._deadline_seconds = deadline_seconds
        self._policy = policy

    async def generate(
        self,
        request: GenerationRequest,
        *,
        progress: ProgressCallback | None = None,
        cancel_event: asyncio.Event | None = None,
    ) -> GenerationResult:
        try:
            async with asyncio.timeout(self._deadline_seconds):
                return await self._generate(request, progress=progress, cancel_event=cancel_event)
        except TimeoutError:
            await _notify(progress, GenerationProgress("failed", 0))
            return GenerationResult(
                "failed",
                None,
                error_code="generation_deadline",
                error_message="Generation exceeded the total job deadline.",
            )

    async def _generate(
        self,
        request: GenerationRequest,
        *,
        progress: ProgressCallback | None,
        cancel_event: asyncio.Event | None,
    ) -> GenerationResult:
        if self._policy.sources.get(
            request.data_source
        ) != request.data_contract or not self._policy.paths_for(request.data_contract):
            return GenerationResult(
                "failed",
                None,
                error_code="generation_context_forbidden",
                error_message="The requested data contract and source are not registered.",
            )
        schema = manifest_json_schema(self._policy)
        messages = build_generation_messages(request, self._policy)
        attempts: list[AttemptRecord] = []
        seen: set[str] = set()
        previous_candidate = ""
        previous_report = ValidationReport.invalid("not_started", "$", "No candidate evaluated")

        for attempt in range(1, MAX_ATTEMPTS + 1):
            if cancel_event is not None and cancel_event.is_set():
                await _notify(progress, GenerationProgress("cancelled", attempt))
                return GenerationResult("cancelled", None, tuple(attempts), "cancelled")

            await _notify(
                progress,
                GenerationProgress("generating" if attempt == 1 else "repairing", attempt),
            )
            if attempt > 1:
                messages = build_repair_messages(
                    request,
                    previous_candidate,
                    [issue.as_dict() for issue in previous_report.issues],
                    self._policy,
                )
            try:
                provider_response = await self._provider.complete(messages, schema=schema)
            except ProviderError as exc:
                await _notify(progress, GenerationProgress("failed", attempt))
                return GenerationResult(
                    "failed",
                    None,
                    tuple(attempts),
                    exc.code,
                    str(exc),
                )

            candidate = provider_response.content
            digest = sha256(candidate.encode("utf-8")).hexdigest()
            if digest in seen:
                attempts.append(
                    AttemptRecord(
                        attempt,
                        digest,
                        False,
                        ("repeated_candidate",),
                        provider_response.model,
                        provider_response.prompt_tokens,
                        provider_response.completion_tokens,
                        provider_response.total_duration_ns,
                    )
                )
                await _notify(
                    progress,
                    GenerationProgress("failed", attempt, issue_codes=("repeated_candidate",)),
                )
                return GenerationResult(
                    "failed",
                    None,
                    tuple(attempts),
                    "repeated_candidate",
                    "The model repeated a previously invalid candidate.",
                )
            seen.add(digest)
            await _notify(progress, GenerationProgress("validating", attempt))

            report = _validate_candidate(candidate, self._dry_render, self._policy)
            attempts.append(
                AttemptRecord(
                    attempt,
                    digest,
                    report.valid,
                    tuple(issue.code for issue in report.issues),
                    provider_response.model,
                    provider_response.prompt_tokens,
                    provider_response.completion_tokens,
                    provider_response.total_duration_ns,
                )
            )
            if report.valid and report.manifest is not None:
                await _notify(progress, GenerationProgress("succeeded", attempt))
                return GenerationResult("succeeded", report.manifest, tuple(attempts))

            previous_candidate = candidate
            previous_report = report

        issue_codes = tuple(issue.code for issue in previous_report.issues)
        await _notify(progress, GenerationProgress("failed", MAX_ATTEMPTS, issue_codes=issue_codes))
        return GenerationResult(
            "failed",
            None,
            tuple(attempts),
            issue_codes[0] if issue_codes else "invalid_manifest",
            "The model did not return a valid manifest within three attempts.",
        )


def _validate_candidate(
    candidate: str,
    dry_render: DryRender | None,
    policy: ManifestPolicy,
) -> ValidationReport:
    try:
        parsed = parse_manifest_candidate(candidate)
    except ManifestParseError as exc:
        return ValidationReport.invalid("parse_error", "$", str(exc))
    return validate_manifest(parsed, dry_render=dry_render, policy=policy)


async def _notify(callback: ProgressCallback | None, value: GenerationProgress) -> None:
    if callback is None:
        return
    result = callback(value)
    if inspect.isawaitable(result):
        await result


async def generate_manifest(
    provider: LLMProvider,
    request: GenerationRequest,
    *,
    dry_render: DryRender | None = None,
    deadline_seconds: float = 180.0,
    progress: ProgressCallback | None = None,
    cancel_event: asyncio.Event | None = None,
    policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY,
) -> GenerationResult:
    """Convenience function for embedding ForgeUI without constructing an engine."""

    return await GenerationEngine(
        provider,
        dry_render=dry_render,
        deadline_seconds=deadline_seconds,
        policy=policy,
    ).generate(request, progress=progress, cancel_event=cancel_event)
