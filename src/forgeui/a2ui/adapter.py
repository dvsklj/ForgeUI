"""Import a safe snapshot subset of Google A2UI v0.9.1 into ``forgeui/1``.

This module is an import gateway, not a general A2UI renderer. It deliberately
does not implement progressive updates, interaction return channels, custom
catalogs, functions, templates, or arbitrary actions.
"""

from __future__ import annotations

import json
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from itertools import islice
from typing import TypeVar, cast

from pydantic import BaseModel, ValidationError

from forgeui.a2ui.errors import (
    A2UIAdapterError,
    A2UIManifestValidationError,
    InvalidA2UIMessageError,
    UnsupportedA2UIFeatureError,
    UnsupportedA2UIVersionError,
)
from forgeui.a2ui.models import (
    A2UI_BASIC_CATALOG_ID,
    A2UI_VERSION,
    MAX_A2UI_BYTES,
    MAX_A2UI_MESSAGES,
    SUPPORTED_COMPONENT_MODELS,
    A2UICard,
    A2UIColumn,
    A2UICreateSurface,
    A2UIDataBinding,
    A2UIDivider,
    A2UIIcon,
    A2UIRow,
    A2UIText,
    A2UIUpdateComponents,
    A2UIUpdateDataModel,
    SupportedA2UIComponent,
)
from forgeui.domain.device_health import DeviceHealthSnapshot
from forgeui.domain.models import ForgeManifest
from forgeui.validation import validate_manifest

_ModelT = TypeVar("_ModelT", bound=BaseModel)

_DATA_BINDINGS = {
    "/generated_at": "data.generated_at",
    "/stale": "data.stale",
    "/summary/total": "data.summary.total",
    "/summary/healthy": "data.summary.healthy",
    "/summary/warning": "data.summary.warning",
    "/summary/critical": "data.summary.critical",
    "/summary/offline": "data.summary.offline",
    "/summary/fleet_cpu": "data.summary.fleet_cpu",
    "/summary/fleet_memory": "data.summary.fleet_memory",
    "/summary/fleet_disk": "data.summary.fleet_disk",
}

_ICON_NAMES = {
    "check": "check",
    "error": "alert",
    "search": "search",
    "warning": "warning",
}

_ACTIVE_CONTENT_FRAGMENTS = (
    "://",
    "javascript:",
    "vbscript:",
    "data:",
    "mailto:",
    "tel:",
    "file:",
    "blob:",
    "url(",
    "@import",
    "expression(",
    "var(--",
    "<script",
    "</",
    "onerror=",
    "onload=",
    "](",
)


@dataclass(frozen=True, slots=True)
class A2UIAdaptation:
    """A validated ForgeUI snapshot and optional validated device data."""

    surface_id: str
    manifest: ForgeManifest
    data_model: DeviceHealthSnapshot | None


def _raise_schema_error(
    error: ValidationError,
    *,
    code: str,
    path: str,
) -> InvalidA2UIMessageError:
    detail = error.errors(include_url=False, include_input=False)[0]
    suffix = ".".join(str(part) for part in detail["loc"])
    issue_path = f"{path}.{suffix}" if suffix else path
    return InvalidA2UIMessageError(code, str(detail["msg"]), path=issue_path)


def _validate_model(
    model: type[_ModelT],
    value: object,
    *,
    code: str,
    path: str,
) -> _ModelT:
    try:
        return model.model_validate(value, strict=True)
    except ValidationError as exc:
        raise _raise_schema_error(exc, code=code, path=path) from exc


def _scan_active_content(value: object, path: str = "$") -> None:
    """Reject active-content shaped strings even when they would only render as text."""

    if isinstance(value, str):
        if value == A2UI_BASIC_CATALOG_ID:
            return
        lowered = value.casefold()
        if (
            any(fragment in lowered for fragment in _ACTIVE_CONTENT_FRAGMENTS)
            or any(character in value for character in "<>{}")
            or value.startswith("//")
            or (value.startswith("/") and not path.endswith(".path") and value != "/")
            or lowered.startswith("www.")
        ):
            raise InvalidA2UIMessageError(
                "active_content",
                "URLs, HTML, CSS, scripts, and markup-shaped content are not importable",
                path=path,
            )
        return
    if isinstance(value, Mapping):
        for key, child in value.items():
            _scan_active_content(child, f"{path}.{key}")
        return
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        for index, child in enumerate(value):
            _scan_active_content(child, f"{path}[{index}]")


def _parse_component(raw: object, *, path: str) -> SupportedA2UIComponent:
    if not isinstance(raw, Mapping):
        raise InvalidA2UIMessageError("invalid_component", "component must be an object", path=path)
    component_name = raw.get("component")
    if not isinstance(component_name, str):
        raise InvalidA2UIMessageError(
            "invalid_component",
            "component must have a string component discriminator",
            path=f"{path}.component",
        )
    model = SUPPORTED_COMPONENT_MODELS.get(component_name)
    if model is None:
        raise UnsupportedA2UIFeatureError(
            "unsupported_component",
            f"{component_name!r} is outside the fixed ForgeUI A2UI allowlist",
            path=f"{path}.component",
        )
    parsed = _validate_model(model, raw, code="invalid_component", path=path)
    return cast(SupportedA2UIComponent, parsed)


def _translate_text(value: str | A2UIDataBinding, *, path: str) -> object:
    if isinstance(value, str):
        return value
    target = _DATA_BINDINGS.get(value.path)
    if target is None:
        raise UnsupportedA2UIFeatureError(
            "unsupported_data_binding",
            "only fixed device-health summary bindings are importable",
            path=path,
        )
    return {"kind": "ref", "path": target}


def _translate_component(component: SupportedA2UIComponent) -> dict[str, object]:
    if isinstance(component, A2UIText):
        text = _translate_text(component.text, path=f"$.components.{component.id}.text")
        if component.variant in {"h1", "h2", "h3", "h4"}:
            return {
                "type": "heading",
                "props": {"text": text, "level": int(component.variant[1])},
            }
        tone = "muted" if component.variant == "caption" else "default"
        return {"type": "text", "props": {"text": text, "tone": tone}}
    if isinstance(component, A2UIColumn):
        return {
            "type": "stack",
            "props": {"gap": "md", "align": component.align},
            "children": component.children,
        }
    if isinstance(component, A2UIRow):
        return {
            "type": "inline",
            "props": {"gap": "md", "align": component.align, "wrap": True},
            "children": component.children,
        }
    if isinstance(component, A2UICard):
        return {
            "type": "card",
            "props": {"tone": "default"},
            "children": [component.child],
        }
    if isinstance(component, A2UIDivider):
        return {"type": "divider", "props": {}}
    if isinstance(component, A2UIIcon):
        return {
            "type": "icon",
            "props": {"name": _ICON_NAMES[component.name]},
        }
    raise AssertionError(f"unhandled component model: {type(component).__name__}")


def _encoded_size(messages: Sequence[Mapping[str, object]]) -> int:
    try:
        return sum(
            len(json.dumps(message, ensure_ascii=False, separators=(",", ":")).encode("utf-8")) + 1
            for message in messages
        )
    except (TypeError, ValueError) as exc:
        raise InvalidA2UIMessageError("non_json", str(exc)) from exc


def _materialize_messages(
    messages: Iterable[Mapping[str, object]],
) -> list[Mapping[str, object]]:
    materialized = list(islice(messages, MAX_A2UI_MESSAGES + 1))
    if not materialized:
        raise InvalidA2UIMessageError("empty_stream", "at least one A2UI message is required")
    if len(materialized) > MAX_A2UI_MESSAGES:
        raise InvalidA2UIMessageError(
            "message_limit",
            f"message count exceeds {MAX_A2UI_MESSAGES}",
        )
    for index, message in enumerate(materialized):
        if not isinstance(message, Mapping):
            raise InvalidA2UIMessageError(
                "invalid_message",
                "each message must be an object",
                path=f"$[{index}]",
            )
    if _encoded_size(materialized) > MAX_A2UI_BYTES:
        raise InvalidA2UIMessageError(
            "byte_limit",
            f"message stream exceeds {MAX_A2UI_BYTES} bytes",
        )
    return materialized


def _message_operation(message: Mapping[str, object], *, index: int) -> str:
    path = f"$[{index}]"
    if "version" not in message:
        raise InvalidA2UIMessageError(
            "missing_version", "every message must declare version", path=path
        )
    if message["version"] != A2UI_VERSION:
        raise UnsupportedA2UIVersionError(message["version"])
    operation_keys = set(message) - {"version"}
    if len(operation_keys) != 1:
        raise InvalidA2UIMessageError(
            "invalid_envelope",
            "message must contain exactly one operation",
            path=path,
        )
    operation = operation_keys.pop()
    if operation not in {"createSurface", "updateComponents", "updateDataModel"}:
        raise UnsupportedA2UIFeatureError(
            "unsupported_message",
            f"{operation!r} is outside the snapshot import subset",
            path=path,
        )
    return operation


def adapt_a2ui_messages(
    messages: Iterable[Mapping[str, object]],
) -> A2UIAdaptation:
    """Translate one bounded v0.9.1 snapshot, then call ``validate_manifest``.

    The stream must start with one ``createSurface`` and may then contain
    ``updateComponents`` batches with globally unique component IDs plus at
    most one root ``updateDataModel`` containing ``device-health/1`` data.
    """

    materialized = _materialize_messages(messages)
    components: dict[str, SupportedA2UIComponent] = {}
    surface_id: str | None = None
    data_model: DeviceHealthSnapshot | None = None

    for index, message in enumerate(materialized):
        _scan_active_content(message, f"$[{index}]")
        operation = _message_operation(message, index=index)
        payload = message[operation]
        path = f"$[{index}].{operation}"

        if operation == "createSurface":
            if index != 0 or surface_id is not None:
                raise InvalidA2UIMessageError(
                    "surface_order",
                    "exactly one createSurface must be the first message",
                    path=path,
                )
            create = _validate_model(
                A2UICreateSurface,
                payload,
                code="invalid_create_surface",
                path=path,
            )
            surface_id = create.surface_id
            continue

        if surface_id is None:
            raise InvalidA2UIMessageError(
                "surface_order",
                "createSurface must precede surface updates",
                path=path,
            )

        if operation == "updateComponents":
            update = _validate_model(
                A2UIUpdateComponents,
                payload,
                code="invalid_update_components",
                path=path,
            )
            if update.surface_id != surface_id:
                raise InvalidA2UIMessageError(
                    "surface_mismatch",
                    "all messages must target the created surface",
                    path=f"{path}.surfaceId",
                )
            for component_index, raw_component in enumerate(update.components):
                component_path = f"{path}.components[{component_index}]"
                component = _parse_component(raw_component, path=component_path)
                if component.id in components:
                    raise InvalidA2UIMessageError(
                        "duplicate_component",
                        f"component ID {component.id!r} is defined more than once",
                        path=f"{component_path}.id",
                    )
                components[component.id] = component
            continue

        if data_model is not None:
            raise UnsupportedA2UIFeatureError(
                "unsupported_data_update",
                "only one full root data-model snapshot is importable",
                path=path,
            )
        update_data = _validate_model(
            A2UIUpdateDataModel,
            payload,
            code="invalid_update_data_model",
            path=path,
        )
        if update_data.surface_id != surface_id:
            raise InvalidA2UIMessageError(
                "surface_mismatch",
                "all messages must target the created surface",
                path=f"{path}.surfaceId",
            )
        try:
            data_model = DeviceHealthSnapshot.model_validate(
                update_data.value,
                strict=True,
            )
        except ValidationError as exc:
            raise _raise_schema_error(
                exc,
                code="invalid_device_health_data",
                path=f"{path}.value",
            ) from exc

    if surface_id is None:
        raise InvalidA2UIMessageError("missing_surface", "stream does not create a surface")
    if "root" not in components:
        raise InvalidA2UIMessageError(
            "missing_root",
            "the component snapshot must define exactly one component with ID 'root'",
            path="$.components",
        )

    candidate: dict[str, object] = {
        "spec": "forgeui/1",
        "metadata": {
            "title": "Imported A2UI device health",
            "description": "Validated A2UI v0.9.1 snapshot.",
            "version": "1",
        },
        "design": {"name": "ops-compact", "color_mode": "system"},
        "context": {"locale": "en-US", "timezone": "UTC", "refresh_seconds": 60},
        "data": {"contract": "device-health/1", "source": "device-health"},
        "state": {"values": {}, "writable": []},
        "root": "root",
        "elements": {
            component_id: _translate_component(component)
            for component_id, component in components.items()
        },
        "actions": {},
    }
    report = validate_manifest(candidate)
    if not report.valid or report.manifest is None:
        raise A2UIManifestValidationError(report.issues)
    return A2UIAdaptation(
        surface_id=surface_id,
        manifest=report.manifest,
        data_model=data_model,
    )


def _reject_duplicate_json_keys(pairs: list[tuple[str, object]]) -> dict[str, object]:
    value: dict[str, object] = {}
    for key, child in pairs:
        if key in value:
            raise InvalidA2UIMessageError(
                "duplicate_json_key",
                f"JSON object key {key!r} appears more than once",
            )
        value[key] = child
    return value


def adapt_a2ui_jsonl(payload: str | bytes) -> A2UIAdaptation:
    """Parse strict UTF-8 JSONL and adapt it without accepting duplicate keys."""

    if isinstance(payload, bytes):
        if len(payload) > MAX_A2UI_BYTES:
            raise InvalidA2UIMessageError(
                "byte_limit",
                f"message stream exceeds {MAX_A2UI_BYTES} bytes",
            )
        try:
            text = payload.decode("utf-8", errors="strict")
        except UnicodeDecodeError as exc:
            raise InvalidA2UIMessageError("invalid_utf8", "payload must be UTF-8") from exc
    else:
        text = payload
        if len(text.encode("utf-8")) > MAX_A2UI_BYTES:
            raise InvalidA2UIMessageError(
                "byte_limit",
                f"message stream exceeds {MAX_A2UI_BYTES} bytes",
            )

    lines = text.splitlines()
    if any(not line.strip() for line in lines):
        raise InvalidA2UIMessageError(
            "invalid_jsonl",
            "blank JSONL records are not allowed",
        )
    if len(lines) > MAX_A2UI_MESSAGES:
        raise InvalidA2UIMessageError(
            "message_limit",
            f"message count exceeds {MAX_A2UI_MESSAGES}",
        )

    messages: list[Mapping[str, object]] = []
    for index, line in enumerate(lines):
        try:
            parsed = json.loads(line, object_pairs_hook=_reject_duplicate_json_keys)
        except A2UIAdapterError:
            raise
        except json.JSONDecodeError as exc:
            raise InvalidA2UIMessageError(
                "invalid_json",
                f"record is not valid JSON: {exc.msg}",
                path=f"$[{index}]",
            ) from exc
        if not isinstance(parsed, dict):
            raise InvalidA2UIMessageError(
                "invalid_message",
                "each JSONL record must be an object",
                path=f"$[{index}]",
            )
        messages.append(parsed)
    return adapt_a2ui_messages(messages)
