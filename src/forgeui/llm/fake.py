"""Deterministic provider used by tests and embedding applications."""

from __future__ import annotations

from collections import deque
from typing import Any

from forgeui.llm.types import ChatMessage, ProviderInvalidResponseError, ProviderResponse


class ScriptedProvider:
    """Return pre-scripted candidates and retain calls for assertions."""

    def __init__(self, candidates: list[str], *, model: str = "scripted-test-model") -> None:
        self._candidates = deque(candidates)
        self.model = model
        self.calls: list[tuple[tuple[ChatMessage, ...], dict[str, Any]]] = []

    async def health(self) -> bool:
        return True

    async def complete(
        self,
        messages: tuple[ChatMessage, ...],
        *,
        schema: dict[str, Any],
    ) -> ProviderResponse:
        self.calls.append((messages, schema))
        if not self._candidates:
            raise ProviderInvalidResponseError("scripted provider has no candidate left")
        return ProviderResponse(self._candidates.popleft(), self.model)
