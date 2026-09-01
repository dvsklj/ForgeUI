from __future__ import annotations

import pytest

from forgeui.catalog.registry import component_registry
from forgeui.validation import manifest_json_schema


def test_catalog_is_the_source_for_prompt_props_and_templates() -> None:
    docs = component_registry.prompt_docs()
    table = next(item for item in docs if item["type"] == "table")
    assert table["children"] is False
    assert component_registry.get("table").template == "components/_component.html"
    assert component_registry.is_compatible("table", "ops-compact")
    assert not component_registry.is_compatible("table", "executive-summary")


def test_catalog_rejects_unknown_props_and_types() -> None:
    with pytest.raises(ValueError, match="unknown component"):
        component_registry.parse_props("raw-html", {})
    with pytest.raises(ValueError, match="invalid props"):
        component_registry.parse_props("heading", {"text": "Hi", "class": "text-red-500"})


def test_generated_schema_has_per_component_prop_branches() -> None:
    schema = manifest_json_schema()
    assert schema["$defs"]["Element"]["properties"]["type"]["enum"] == sorted(
        component_registry.names
    )
    assert "Props_heading" in schema["$defs"]


def test_planned_dashboard_form_and_extended_surfaces_are_registered() -> None:
    expected = {
        "page",
        "page-header",
        "container",
        "stack",
        "inline",
        "grid",
        "card",
        "section",
        "divider",
        "repeat",
        "heading",
        "text",
        "badge",
        "icon",
        "key-value",
        "empty-state",
        "metric",
        "progress",
        "table",
        "status-list",
        "timeline",
        "sparkline",
        "line-chart",
        "bar-chart",
        "donut-chart",
        "tabs",
        "button",
        "select",
        "toggle",
        "alert",
        "form",
        "field-group",
        "text-input",
        "textarea",
        "number-input",
        "radio-group",
        "checkbox",
        "date-range",
        "breadcrumbs",
        "pagination",
        "modal",
        "toast",
        "image",
        "file-upload",
    }
    assert expected <= component_registry.names
    with pytest.raises(ValueError, match="invalid props"):
        component_registry.parse_props("image", {"url": "https://unsafe.invalid", "alt": "x"})
