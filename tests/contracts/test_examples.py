from __future__ import annotations

import json
from pathlib import Path

import pytest

from forgeui.domain.device_health import DeviceHealthSnapshot
from forgeui.validation import validate_manifest

ROOT = Path(__file__).parents[2]


@pytest.mark.parametrize("path", sorted((ROOT / "examples" / "data").glob("*.json")))
def test_device_health_fixtures_match_the_trusted_contract(path: Path) -> None:
    snapshot = DeviceHealthSnapshot.model_validate_json(path.read_text(), strict=True)
    assert snapshot.contract == "device-health/1"


@pytest.mark.parametrize("path", sorted((ROOT / "examples" / "manifests").glob("*.json")))
def test_example_manifests_pass_full_semantic_validation(path: Path) -> None:
    report = validate_manifest(json.loads(path.read_text()))
    assert report.valid, [issue.as_dict() for issue in report.issues]
