from __future__ import annotations

from forgeui.renderer import render_manifest
from forgeui.validation import validate_manifest


def test_data_values_are_autoescaped_and_never_marked_safe() -> None:
    candidate = {
        "metadata": {"title": "Fleet"},
        "design": {"name": "ops-compact"},
        "root": "table",
        "elements": {
            "table": {
                "type": "table",
                "props": {
                    "data": {"kind": "ref", "path": "data.devices"},
                    "columns": [{"key": "name", "label": "Name"}],
                },
            }
        },
    }
    report = validate_manifest(candidate)
    assert report.valid
    assert report.manifest is not None
    output = render_manifest(
        report.manifest, data={"devices": [{"name": "<img src=x onerror=alert(1)>"}]}
    )
    assert "<img src=x" not in output
    assert "&lt;img src=x onerror=alert(1)&gt;" in output


def test_manifest_cannot_select_template_or_classes() -> None:
    candidate = {
        "metadata": {"title": "Fleet"},
        "design": {"name": "ops-compact"},
        "root": "x",
        "elements": {"x": {"type": "../../base", "props": {}}},
    }
    report = validate_manifest(candidate)
    assert not report.valid
    assert all(issue.code == "schema" for issue in report.issues)
