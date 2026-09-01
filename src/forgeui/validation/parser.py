"""Strict extraction of a JSON manifest from model output."""

from __future__ import annotations

import json
import re
from typing import Any

from forgeui.domain.models import MAX_MANIFEST_BYTES

_FENCE = re.compile(r"^\s*```(?:json)?\s*\n(?P<body>.*?)\n```\s*$", re.DOTALL | re.IGNORECASE)


class ManifestParseError(ValueError):
    """The provider response is not one bounded JSON object candidate."""


def _balanced_object(text: str) -> str | None:
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    quote = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quote = False
            continue
        if char == '"':
            quote = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]
            if depth < 0:
                return None
    return None


def _reject_poison_keys(value: Any, path: str = "$") -> None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"__proto__", "prototype", "constructor"}:
                raise ManifestParseError(f"unsafe object key at {path}.{key}")
            _reject_poison_keys(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            _reject_poison_keys(child, f"{path}[{index}]")


def parse_manifest_candidate(candidate: str | bytes) -> dict[str, object]:
    """Parse raw JSON, one exact Markdown fence, or one balanced object in prose."""

    raw = candidate.decode("utf-8", errors="strict") if isinstance(candidate, bytes) else candidate
    if len(raw.encode("utf-8")) > MAX_MANIFEST_BYTES:
        raise ManifestParseError("candidate exceeds manifest byte limit")
    candidate_text = raw.strip()
    match = _FENCE.fullmatch(candidate_text)
    if match:
        candidate_text = match.group("body").strip()
    try:
        parsed = json.loads(candidate_text)
    except json.JSONDecodeError:
        extracted = _balanced_object(candidate_text)
        if extracted is None:
            raise ManifestParseError("response does not contain a balanced JSON object") from None
        try:
            parsed = json.loads(extracted)
        except json.JSONDecodeError as exc:
            raise ManifestParseError(f"invalid JSON object: {exc.msg}") from exc
    if not isinstance(parsed, dict):
        raise ManifestParseError("manifest candidate must be a JSON object")
    _reject_poison_keys(parsed)
    return parsed
