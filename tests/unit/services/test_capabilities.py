from __future__ import annotations

import pytest
from pydantic import BaseModel, ConfigDict

from forgeui.security import Principal
from forgeui.services.capabilities import (
    CapabilityContext,
    CapabilityRegistry,
    CapabilityResult,
)


class NoteInput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    text: str


def context(**changes: object) -> CapabilityContext:
    values: dict[str, object] = {
        "app_id": "app-1",
        "action_id": "create-note",
        "capability": "note.create",
        "payload": {"text": "hello"},
        "event": {},
        "principal": Principal("user-1", "tenant-1", frozenset({"operator"}), True),
        "request_id": "request-1",
    }
    values.update(changes)
    return CapabilityContext(**values)  # type: ignore[arg-type]


def test_registry_requires_explicit_authorization_and_freezes() -> None:
    registry = CapabilityRegistry()
    with pytest.raises(ValueError, match="authorizer"):
        registry.register("note.create", handler=lambda _: CapabilityResult("ok"))
    with pytest.raises(ValueError, match="identifier"):
        registry.register("https://example.test")

    registry.register("note.create")
    with pytest.raises(ValueError, match="already"):
        registry.register("note.create")
    registry.freeze()
    with pytest.raises(RuntimeError, match="frozen"):
        registry.register("note.delete")


def test_invocation_is_authorized_confirmed_and_strictly_typed() -> None:
    calls: list[CapabilityContext] = []

    def handler(invocation: CapabilityContext) -> CapabilityResult:
        calls.append(invocation)
        return CapabilityResult("ok", refresh=True)

    registry = CapabilityRegistry()
    registry.register(
        "note.create",
        handler=handler,
        authorize=lambda invocation: "operator" in invocation.principal.roles,
        input_model=NoteInput,
        requires_confirmation=True,
    )
    registry.freeze()

    assert registry.invoke(context()).status == "denied"
    invalid = context(confirmed=True, payload={"text": "hello", "extra": 1})
    assert registry.invoke(invalid).status == "denied"
    assert (
        registry.invoke(
            context(
                confirmed=True,
                principal=Principal("user-2", "tenant-1", frozenset(), True),
            )
        ).status
        == "denied"
    )
    result = registry.invoke(context(confirmed=True))
    assert result.status == "ok"
    assert result.refresh
    assert calls[0].payload == {"text": "hello"}


def test_unknown_and_declaration_only_capabilities_never_execute() -> None:
    registry = CapabilityRegistry()
    registry.register("note.create")
    registry.freeze()
    assert registry.invoke(context()).status == "denied"
    assert registry.invoke(context(capability="missing.read")).status == "denied"
