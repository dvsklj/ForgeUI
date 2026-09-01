from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from forgeui.config import Settings
from forgeui.llm.ollama import OllamaProvider
from forgeui.llm.types import (
    ChatMessage,
    ProviderInvalidResponseError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)


def settings(**overrides: object) -> Settings:
    return Settings(
        _env_file=None,
        ollama_base_url="http://ollama.internal:11434",
        ollama_model="qwen-test:9b",
        **overrides,
    )


@pytest.mark.asyncio
async def test_ollama_request_uses_fixed_structured_chat_contract() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["body"] = json.loads(request.content)
        return httpx.Response(
            200,
            json={
                "model": "qwen-test:9b",
                "message": {"role": "assistant", "content": '{"spec":"forgeui/1"}'},
                "prompt_eval_count": 123,
                "eval_count": 45,
                "total_duration": 9_000,
            },
        )

    schema = {"type": "object", "required": ["spec"]}
    async with httpx.AsyncClient(
        base_url="http://ollama.internal:11434",
        transport=httpx.MockTransport(handler),
    ) as client:
        provider = OllamaProvider(settings(), client=client)
        result = await provider.complete(
            (ChatMessage("system", "rules"), ChatMessage("user", "brief")),
            schema=schema,
        )

    assert captured["url"] == "http://ollama.internal:11434/api/chat"
    assert captured["body"]["model"] == "qwen-test:9b"
    assert captured["body"]["stream"] is False
    assert captured["body"]["format"] == schema
    assert captured["body"]["options"] == {"temperature": 0.1, "seed": 42}
    assert result.prompt_tokens == 123
    assert result.completion_tokens == 45


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("exception_type", "expected"),
    [
        (httpx.ConnectError, ProviderUnavailableError),
        (httpx.ReadTimeout, ProviderTimeoutError),
    ],
)
async def test_ollama_maps_network_failures(
    exception_type: type[httpx.RequestError],
    expected: type[Exception],
) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise exception_type("provider failed", request=request)

    async with httpx.AsyncClient(
        base_url="http://ollama.internal:11434",
        transport=httpx.MockTransport(handler),
    ) as client:
        provider = OllamaProvider(settings(), client=client)
        with pytest.raises(expected):
            await provider.complete((ChatMessage("user", "brief"),), schema={"type": "object"})


@pytest.mark.asyncio
async def test_ollama_rejects_missing_or_oversized_content() -> None:
    responses = iter(
        [
            httpx.Response(200, json={"model": "qwen-test:9b"}),
            httpx.Response(
                200,
                json={"message": {"content": "x" * 16_385}},
            ),
        ]
    )

    def handler(_request: httpx.Request) -> httpx.Response:
        return next(responses)

    async with httpx.AsyncClient(
        base_url="http://ollama.internal:11434",
        transport=httpx.MockTransport(handler),
    ) as client:
        provider = OllamaProvider(settings(max_manifest_bytes=16_384), client=client)
        with pytest.raises(ProviderInvalidResponseError, match=r"message\.content"):
            await provider.complete((ChatMessage("user", "brief"),), schema={"type": "object"})
        with pytest.raises(ProviderInvalidResponseError, match="candidate exceeds"):
            await provider.complete((ChatMessage("user", "brief"),), schema={"type": "object"})


@pytest.mark.asyncio
async def test_health_degrades_without_raising() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, request=request)

    async with httpx.AsyncClient(
        base_url="http://ollama.internal:11434",
        transport=httpx.MockTransport(handler),
    ) as client:
        assert not await OllamaProvider(settings(), client=client).health()
