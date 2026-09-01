"""Host-owned capability declarations and runtime authorization."""

from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Literal, Protocol, cast

from pydantic import BaseModel, ValidationError

from forgeui.data.repositories import JsonValue
from forgeui.security import Principal

_RUNTIME_ID = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$")
CapabilityEffect = Literal["read", "write", "external"]


@dataclass(frozen=True, slots=True)
class CapabilityResult:
    status: str
    message: str | None = None
    refresh: bool = False

    @classmethod
    def denied(cls, message: str = "Capability is not available.") -> CapabilityResult:
        return cls("denied", message)


@dataclass(frozen=True, slots=True)
class CapabilityContext:
    """Final invocation identity and data, assembled only by the trusted host adapter."""

    app_id: str
    action_id: str
    capability: str
    payload: JsonValue
    event: Mapping[str, JsonValue]
    principal: Principal
    request_id: str
    confirmed: bool = False


class CapabilityHandler(Protocol):
    def __call__(self, context: CapabilityContext) -> CapabilityResult: ...


class CapabilityAuthorizer(Protocol):
    def __call__(self, context: CapabilityContext) -> bool: ...


@dataclass(frozen=True, slots=True)
class CapabilitySpec:
    name: str
    effect: CapabilityEffect
    handler: CapabilityHandler | None
    authorize: CapabilityAuthorizer | None
    input_model: type[BaseModel] | None = None
    requires_confirmation: bool = False


class CapabilityRegistry:
    """A frozen allowlist; registering code is an explicit trusted-host operation."""

    def __init__(self) -> None:
        self._specs: dict[str, CapabilitySpec] = {}
        self._frozen = False

    @property
    def names(self) -> frozenset[str]:
        return frozenset(self._specs)

    def register(
        self,
        name: str,
        *,
        effect: CapabilityEffect = "write",
        handler: CapabilityHandler | None = None,
        authorize: CapabilityAuthorizer | None = None,
        input_model: type[BaseModel] | None = None,
        requires_confirmation: bool = False,
    ) -> None:
        if self._frozen:
            raise RuntimeError("capability registry is frozen")
        if not _RUNTIME_ID.fullmatch(name) or len(name) > 120:
            raise ValueError("invalid capability identifier")
        if len(self._specs) >= 256:
            raise ValueError("capability registry exceeds its size limit")
        if name in self._specs:
            raise ValueError(f"capability is already registered: {name}")
        if effect not in {"read", "write", "external"}:
            raise ValueError("invalid capability effect")
        if handler is not None and not callable(handler):
            raise ValueError("capability handler must be callable")
        if authorize is not None and not callable(authorize):
            raise ValueError("capability authorizer must be callable")
        if handler is not None and authorize is None:
            raise ValueError("executable capabilities require an authorizer")
        if input_model is not None and (
            not isinstance(input_model, type) or not issubclass(input_model, BaseModel)
        ):
            raise ValueError("capability input model must be a Pydantic BaseModel type")
        if not isinstance(requires_confirmation, bool):
            raise ValueError("capability confirmation flag must be boolean")
        self._specs[name] = CapabilitySpec(
            name,
            effect,
            handler,
            authorize,
            input_model,
            requires_confirmation,
        )

    def freeze(self) -> CapabilityRegistry:
        self._frozen = True
        return self

    def get(self, name: str) -> CapabilitySpec | None:
        return self._specs.get(name)

    def invoke(self, context: CapabilityContext) -> CapabilityResult:
        spec = self._specs.get(context.capability)
        if spec is None or spec.handler is None or spec.authorize is None:
            return CapabilityResult.denied()
        if spec.requires_confirmation and not context.confirmed:
            return CapabilityResult.denied("Capability requires explicit confirmation.")
        if not spec.authorize(context):
            return CapabilityResult.denied("Capability is not authorized for this actor.")
        invocation = context
        if spec.input_model is not None:
            if not isinstance(context.payload, dict):
                return CapabilityResult.denied("Capability input is invalid.")
            try:
                parsed = spec.input_model.model_validate(context.payload, strict=True)
            except ValidationError:
                return CapabilityResult.denied("Capability input is invalid.")
            invocation = CapabilityContext(
                app_id=context.app_id,
                action_id=context.action_id,
                capability=context.capability,
                payload=cast(JsonValue, parsed.model_dump(mode="json")),
                event=context.event,
                principal=context.principal,
                request_id=context.request_id,
                confirmed=context.confirmed,
            )
        result = spec.handler(invocation)
        if not isinstance(result, CapabilityResult):
            raise RuntimeError("capability handler returned an invalid result")
        return result


def declared_capabilities(names: tuple[str, ...]) -> CapabilityRegistry:
    """Build declarations without executable handlers for safe default manifests."""

    registry = CapabilityRegistry()
    for name in names:
        registry.register(name)
    return registry.freeze()
