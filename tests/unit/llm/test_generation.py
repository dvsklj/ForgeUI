from __future__ import annotations

import asyncio
import json
from pathlib import Path

import pytest

from forgeui.llm import GenerationEngine, GenerationRequest, ScriptedProvider
from forgeui.llm.types import GenerationProgress

ROOT = Path(__file__).parents[3]


def candidate(name: str = "fleet-overview.json") -> str:
    return (ROOT / "examples" / "manifests" / name).read_text()


def request() -> GenerationRequest:
    sample = json.loads((ROOT / "examples" / "data" / "device-health.json").read_text())
    return GenerationRequest(
        brief="Build an exception-first fleet health dashboard.",
        profile="ops-compact",
        sample_data=sample,
    )


@pytest.mark.asyncio
async def test_first_valid_candidate_succeeds() -> None:
    provider = ScriptedProvider([candidate()])

    result = await GenerationEngine(provider).generate(request())

    assert result.succeeded
    assert result.manifest is not None
    assert result.manifest.metadata.title == "Fleet Overview"
    assert len(provider.calls) == 1
    assert provider.calls[0][1]["$defs"]["Element"]["properties"]["type"]["enum"]


@pytest.mark.asyncio
async def test_invalid_candidate_is_repaired_with_machine_errors() -> None:
    provider = ScriptedProvider(['{"spec":"forgeui/1"}', candidate()])
    progress: list[GenerationProgress] = []

    result = await GenerationEngine(provider).generate(request(), progress=progress.append)

    assert result.succeeded
    assert len(result.attempts) == 2
    assert "schema" in result.attempts[0].issue_codes
    repair_message = provider.calls[1][0][1].content
    assert '"code":"schema"' in repair_message
    assert [item.phase for item in progress] == [
        "generating",
        "validating",
        "repairing",
        "validating",
        "succeeded",
    ]


@pytest.mark.asyncio
async def test_repeated_candidate_stops_without_a_third_call() -> None:
    invalid = '{"spec":"forgeui/1"}'
    provider = ScriptedProvider([invalid, invalid, candidate()])

    result = await GenerationEngine(provider).generate(request())

    assert result.status == "failed"
    assert result.error_code == "repeated_candidate"
    assert result.manifest is None
    assert len(provider.calls) == 2


@pytest.mark.asyncio
async def test_generation_is_bounded_to_three_distinct_attempts() -> None:
    provider = ScriptedProvider(
        [
            '{"spec":"forgeui/1"}',
            '{"spec":"forgeui/1","root":"missing"}',
            '{"spec":"forgeui/1","metadata":{}}',
            candidate(),
        ]
    )

    result = await GenerationEngine(provider).generate(request())

    assert result.status == "failed"
    assert result.manifest is None
    assert len(result.attempts) == 3
    assert len(provider.calls) == 3


@pytest.mark.asyncio
async def test_dry_render_failure_can_be_repaired() -> None:
    render_calls = 0

    def dry_render(_manifest: object) -> None:
        nonlocal render_calls
        render_calls += 1
        if render_calls == 1:
            raise RuntimeError("template failed")

    provider = ScriptedProvider([candidate(), candidate() + "\n"])
    result = await GenerationEngine(provider, dry_render=dry_render).generate(request())

    assert result.succeeded
    assert result.attempts[0].issue_codes == ("dry_render_failed",)
    assert render_calls == 2


@pytest.mark.asyncio
async def test_pre_cancelled_job_never_calls_provider() -> None:
    provider = ScriptedProvider([candidate()])
    cancel_event = asyncio.Event()
    cancel_event.set()

    result = await GenerationEngine(provider).generate(request(), cancel_event=cancel_event)

    assert result.status == "cancelled"
    assert provider.calls == []
