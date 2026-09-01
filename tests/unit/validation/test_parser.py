from __future__ import annotations

import pytest

from forgeui.validation.parser import ManifestParseError, parse_manifest_candidate


def test_parser_accepts_raw_fence_and_balanced_prose() -> None:
    assert parse_manifest_candidate('{"spec":"forgeui/1"}')["spec"] == "forgeui/1"
    assert parse_manifest_candidate('```json\n{"spec":"forgeui/1"}\n```')["spec"] == "forgeui/1"
    assert parse_manifest_candidate('Here it is: {"spec":"forgeui/1"}.')["spec"] == "forgeui/1"


@pytest.mark.parametrize("candidate", ["not json", "[]", "```json\n[]\n```", '{"__proto__": {}}'])
def test_parser_rejects_non_objects_and_poison_keys(candidate: str) -> None:
    with pytest.raises(ManifestParseError):
        parse_manifest_candidate(candidate)
