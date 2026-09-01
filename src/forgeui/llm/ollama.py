"""Ollama implementation of the fixed ForgeUI provider boundary."""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from forgeui.config import Settings
from forgeui.llm.types import (
    ChatMessage,
    ProviderInvalidResponseError,
    ProviderResponse,
    ProviderTimeoutError,
    ProviderUnavailableError,
)


class OllamaProvider:
    """Call one configured Ollama host; requests cannot redirect or override it."""

    def __init__(self, settings: Settings, *, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._semaphore = asyncio.Semaphore(settings.ollama_max_concurrency)
        self._owns_client = client is None
        self._client = client or httpx.AsyncClient(
            base_url=str(settings.ollama_base_url).rstrip("/"),
            follow_redirects=False,
            timeout=httpx.Timeout(
                settings.ollama_response_timeout_seconds,
                connect=settings.ollama_connect_timeout_seconds,
            ),
        )

    async def __aenter__(self) -> OllamaProvider:
        return self

    async def __aexit__(self, *_args: object) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def health(self) -> bool:
        try:
            response = await self._client.get("/api/tags")
            response.raise_for_status()
        except httpx.HTTPError:
            return False
        return True

    async def complete(
        self,
        messages: tuple[ChatMessage, ...],
        *,
        schema: dict[str, Any],
    ) -> ProviderResponse:
        payload: dict[str, Any] = {
            "model": self._settings.ollama_model,
            "messages": [
                {"role": message.role, "content": message.content} for message in messages
            ],
            "stream": False,
            "format": schema,
            "keep_alive": self._settings.ollama_keep_alive,
            "options": {
                "temperature": self._settings.ollama_temperature,
            },
        }
        if self._settings.ollama_seed is not None:
            payload["options"]["seed"] = self._settings.ollama_seed

        try:
            async with self._semaphore:
                response = await self._client.post("/api/chat", json=payload)
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise ProviderTimeoutError(
                "Ollama did not respond before the configured timeout"
            ) from exc
        except (httpx.ConnectError, httpx.NetworkError) as exc:
            raise ProviderUnavailableError("ForgeUI could not connect to Ollama") from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code >= 500:
                raise ProviderUnavailableError("Ollama returned a server error") from exc
            raise ProviderInvalidResponseError(
                f"Ollama rejected the structured generation request ({exc.response.status_code})"
            ) from exc

        response_cap = self._settings.max_manifest_bytes * 2
        if len(response.content) > response_cap:
            raise ProviderInvalidResponseError("Ollama response envelope exceeds the byte limit")
        try:
            body = response.json()
            message = body["message"]
            content = message["content"]
        except (ValueError, KeyError, TypeError) as exc:
            raise ProviderInvalidResponseError(
                "Ollama response is missing message.content"
            ) from exc
        if not isinstance(content, str) or not content.strip():
            raise ProviderInvalidResponseError("Ollama returned an empty candidate")
        if len(content.encode("utf-8")) > self._settings.max_manifest_bytes:
            raise ProviderInvalidResponseError("Ollama candidate exceeds the manifest byte limit")

        return ProviderResponse(
            content=content,
            model=str(body.get("model") or self._settings.ollama_model),
            prompt_tokens=_optional_int(body.get("prompt_eval_count")),
            completion_tokens=_optional_int(body.get("eval_count")),
            total_duration_ns=_optional_int(body.get("total_duration")),
        )


def _optional_int(value: object) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) else None
