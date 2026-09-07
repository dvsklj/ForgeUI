from __future__ import annotations

import json
from pathlib import Path

import pytest

from forgeui.renderer import HtmlRendererAdapter
from forgeui.validation import manifest_json_schema, validate_manifest


def candidate(elements):
    return {
        "metadata": {"title": "Layout"},
        "design": {"name": "calm-neutral"},
        "root": "root",
        "elements": elements,
    }


@pytest.mark.parametrize(
    "props",
    [
        {"responsive": {"small": 0}},
        {"responsive": {"large": 5}},
        {"responsive": {"medium": "2"}},
        {"responsive": {"640px": 2}},
        {"columns": "auto", "responsive": {}},
        {"columns": 3, "ratio": "main-start"},
        {"responsive": {"large": 3}, "ratio": "main-end"},
        {"columns": "auto", "min_item_width": "250px"},
        {"min_item_width": "lg"},
        {"gap_x": "calc(2rem)"},
        {"padding": {"kind": "literal", "value": "sm"}},
        {"density": "dense"},
        {"align": "baseline"},
        {"equal_height": True, "align": "start"},
    ],
)
def test_invalid_layout_props_are_rejected(props):
    report = validate_manifest(candidate({"root": {"type": "grid", "props": props}}))
    assert not report.valid
    assert report.manifest is None
    assert report.errors[0].code == "schema"


@pytest.mark.parametrize(
    "props",
    [
        {"column_span": 0},
        {"row_span": 5},
        {"column_span": True},
        {"row_span": 1.5},
    ],
)
def test_spans_are_strict_bounded_integers(props):
    report = validate_manifest(
        candidate(
            {
                "root": {"type": "grid", "children": ["item"]},
                "item": {"type": "grid-item", "props": props},
            }
        )
    )
    assert not report.valid


@pytest.mark.parametrize("kind", ["card-header", "card-body", "card-footer", "grid-item"])
def test_slot_and_span_components_require_their_layout_parent(kind):
    report = validate_manifest(candidate({"root": {"type": kind}}))
    assert not report.valid
    assert report.errors[0].code == "layout_parent"


@pytest.mark.parametrize(
    "children",
    [
        ["body", "header"],
        ["header"],
        ["body", "body"],
        ["body", "loose"],
    ],
)
def test_card_slots_require_unique_ordered_slots_with_a_body(children):
    kinds = {"body": "card-body", "header": "card-header", "loose": "text"}
    report = validate_manifest(
        candidate(
            {
                "root": {"type": "card", "children": children},
                **{
                    key: {"type": kinds[key], "props": {"text": "Loose"} if key == "loose" else {}}
                    for key in children
                },
            }
        )
    )
    assert not report.valid
    assert any(issue.code == "card_slots" for issue in report.errors)


def test_auto_grid_rejects_ambiguous_column_spans():
    report = validate_manifest(
        candidate(
            {
                "root": {"type": "grid", "props": {"columns": "auto"}, "children": ["item"]},
                "item": {"type": "grid-item", "props": {"column_span": 2}},
            }
        )
    )
    assert not report.valid
    assert report.errors[0].code == "auto_grid_span"
    assert report.errors[0].path == "$.elements.item.props.column_span"


def test_annotation_requires_one_child_and_disclosure_rejects_actions():
    report = validate_manifest(
        candidate(
            {
                "root": {"type": "content-group", "props": {"caption": "Context"}},
            }
        )
    )
    assert report.errors[0].code == "content_group_child"
    raw = candidate({"root": {"type": "disclosure", "props": {"title": "Read"}, "action": "go"}})
    raw["actions"] = {"go": {"type": "navigate", "destination": "overview"}}
    report = validate_manifest(raw)
    assert any(issue.code == "action_not_supported" for issue in report.errors)


def test_empty_layout_warnings_preserve_validation_dry_render_and_export():
    raw = candidate(
        {
            "root": {
                "type": "card",
                "props": {"title": "Decoration"},
                "children": ["space", "hidden"],
            },
            "space": {"type": "divider"},
            "hidden": {
                "type": "text",
                "props": {"text": "Invisible"},
                "visible": {"kind": "literal", "value": False},
            },
        }
    )
    calls = []
    report = validate_manifest(raw, dry_render=calls.append)
    assert report.valid
    assert report.manifest is not None
    assert calls == [report.manifest]
    assert report.issues[0].severity == "warning"
    assert report.issues[0].code == "empty_layout"
    result = HtmlRendererAdapter().render(raw)
    assert result.ok
    assert result.output
    assert result.issues[0].severity == "warning"
    failed = validate_manifest(
        raw, dry_render=lambda _: (_ for _ in ()).throw(ValueError("failure"))
    )
    assert not failed.valid
    assert failed.manifest is None
    assert any(issue.code == "dry_render_failed" for issue in failed.errors)


def test_dynamic_visibility_is_not_misreported_as_empty():
    raw = candidate(
        {
            "root": {"type": "card", "children": ["later"]},
            "later": {
                "type": "text",
                "props": {"text": "Later"},
                "visible": {"kind": "ref", "path": "state.show"},
            },
        }
    )
    raw["state"] = {"values": {"show": False}}
    report = validate_manifest(raw)
    assert report.valid
    assert not report.issues


def test_reference_layout_validates_and_schema_contains_nested_tokens():
    raw = json.loads(
        (Path(__file__).parents[3] / "examples/manifests/layout-controls.json").read_text()
    )
    report = validate_manifest(raw)
    assert report.valid
    assert not report.issues
    result = HtmlRendererAdapter().render(raw)
    assert result.ok
    assert "forge-render-error" not in result.output
    schema = manifest_json_schema()
    assert schema["$defs"]["ResponsiveColumns"]["properties"]["large"]["enum"] == [1, 2, 3, 4]
    assert schema["$defs"]["Props_grid_item"]["properties"]["column_span"]["maximum"] == 4
