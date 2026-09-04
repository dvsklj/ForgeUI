from __future__ import annotations

from collections.abc import Mapping

import pytest

from forgeui.catalog import component_registry
from forgeui.domain.models import ForgeManifest
from forgeui.renderer import Renderer, render_manifest
from forgeui.surfaces import PersistenceMode, SurfaceMode
from forgeui.validation import validate_manifest


def _manifest(
    elements: Mapping[str, object],
    root: str = "root",
    actions: Mapping[str, object] | None = None,
) -> ForgeManifest:
    candidate = {
        "metadata": {"title": "Fleet report"},
        "design": {"name": "ops-compact"},
        "root": root,
        "elements": elements,
        "actions": actions or {},
    }
    report = validate_manifest(candidate)
    assert report.valid, report.issues
    assert report.manifest is not None
    return report.manifest


def test_renderer_uses_stable_boundaries_and_evaluates_data() -> None:
    manifest = _manifest(
        {
            "root": {"type": "page", "children": ["heading"]},
            "heading": {
                "type": "heading",
                "props": {"text": {"kind": "ref", "path": "data.summary.total"}, "level": 1},
            },
        }
    )
    output = render_manifest(manifest, data={"summary": {"total": 12}})
    assert 'id="forge-element-root"' in output
    assert 'id="forge-element-heading"' in output
    assert ">12</h1>" in output


def test_renderer_can_compose_one_safe_manifest_subtree() -> None:
    manifest = _manifest(
        {
            "root": {"type": "page", "children": ["summary", "details"]},
            "summary": {"type": "card", "props": {"title": "Health"}, "children": ["value"]},
            "value": {"type": "text", "props": {"text": "Healthy"}},
            "details": {"type": "text", "props": {"text": "Full dashboard detail"}},
        }
    )

    output = render_manifest(manifest, element_id="summary")
    assert 'id="forge-element-summary"' in output
    assert "Healthy" in output
    assert "Full dashboard detail" not in output
    with pytest.raises(KeyError, match="does not exist"):
        render_manifest(manifest, element_id="missing")


def test_repeat_has_isolated_item_context_and_is_bounded() -> None:
    manifest = _manifest(
        {
            "root": {
                "type": "repeat",
                "props": {"data": {"kind": "ref", "path": "data.devices"}},
                "children": ["row"],
            },
            "row": {"type": "text", "props": {"text": {"kind": "ref", "path": "item.name"}}},
        }
    )
    devices = [{"name": f"Device {number}"} for number in range(140)]
    output = render_manifest(manifest, data={"devices": devices})
    assert "Device 99" in output
    assert "Device 100" not in output


def test_expression_failure_is_an_inert_visible_fallback() -> None:
    manifest = _manifest(
        {
            "root": {
                "type": "text",
                "props": {
                    "text": {
                        "kind": "op",
                        "op": "div",
                        "args": [{"kind": "literal", "value": 1}, {"kind": "literal", "value": 0}],
                    }
                },
            }
        }
    )
    output = Renderer().render(manifest)
    assert "Dashboard component unavailable." in output
    assert "division by zero" not in output


def test_document_shell_has_theme_controls() -> None:
    manifest = _manifest({"root": {"type": "text", "props": {"text": "Ready"}}})
    output = Renderer().render_document(manifest)
    assert 'data-theme="system"' in output
    assert "forgeui.css" in output
    assert "forge-main" in output
    assert output.count('class="forge-theme-icon"') == 3
    assert output.count('class="forge-theme-button"') == 1
    assert "data-forge-theme-toggle" in output
    assert 'aria-label="Switch color theme"' in output
    assert 'title="System theme"' in output
    assert 'data-forge-theme-icon="light"' in output
    assert 'data-forge-theme-icon="system"' in output
    assert 'data-forge-theme-icon="dark"' in output
    assert "<script>" not in output


def test_document_shell_applies_trusted_surface_and_persistence_modes() -> None:
    manifest = _manifest({"root": {"type": "text", "props": {"text": "Ready"}}})
    output = Renderer().render_document(
        manifest,
        surface=SurfaceMode.CHAT,
        persistence=PersistenceMode.STATELESS,
        initial_state_json='{"query":"edge"}',
    )
    assert 'data-forge-surface="chat"' in output
    assert 'data-forge-persistence="stateless"' in output
    assert 'data-forge-state="{&#34;query&#34;:&#34;edge&#34;}"' in output
    assert "forge-shell-header" not in output
    assert "Temporary view" in output


def test_dialog_close_control_uses_a_trusted_outline_icon() -> None:
    manifest = _manifest({"root": {"type": "modal", "props": {"title": "Details"}}})
    output = Renderer().render(manifest)
    assert 'class="forge-dialog-close"' in output
    assert 'class="forge-button-icon"' in output
    assert "M6 18 18 6M6 6l12 12" in output
    assert ">\u00d7</button>" not in output


def test_table_filter_and_pagination_are_bounded_by_declared_state() -> None:
    report = validate_manifest(
        {
            "metadata": {"title": "Fleet report"},
            "design": {"name": "ops-compact"},
            "state": {
                "values": {"status": "all", "page": 1},
                "writable": ["state.status", "state.page"],
            },
            "root": "root",
            "elements": {
                "root": {"type": "page", "children": ["devices", "pages"]},
                "devices": {
                    "type": "table",
                    "props": {
                        "data": {"kind": "ref", "path": "data.devices"},
                        "columns": [{"key": "name", "label": "Device"}],
                        "filter_state": "state.status",
                        "filter_key": "status",
                        "page_state": "state.page",
                        "page_size": 5,
                    },
                },
                "pages": {
                    "type": "pagination",
                    "props": {
                        "page_state": "state.page",
                        "page_size": 5,
                        "data": {"kind": "ref", "path": "data.devices"},
                        "filter_state": "state.status",
                        "filter_key": "status",
                    },
                },
            },
        }
    )
    assert report.valid
    assert report.manifest is not None
    devices = [{"name": f"Healthy {index}", "status": "healthy"} for index in range(1, 6)] + [
        {"name": "Critical 6", "status": "critical"}
    ]

    first = render_manifest(
        report.manifest, data={"devices": devices}, state={"status": "all", "page": 1}
    )
    assert "Healthy 5" in first
    assert "Critical 6" not in first
    assert "Page 1 of 2" in first

    second = render_manifest(
        report.manifest, data={"devices": devices}, state={"status": "all", "page": 2}
    )
    assert "Healthy 1" not in second
    assert "Critical 6" in second
    assert "Page 2 of 2" in second

    filtered = render_manifest(
        report.manifest,
        data={"devices": devices},
        state={"status": "critical", "page": 2},
    )
    assert "Healthy 1" not in filtered
    assert "Critical 6" in filtered
    assert "Page 1 of 1" in filtered


@pytest.mark.parametrize("component_type", sorted(component_registry.names))
def test_every_catalog_component_has_a_meaningful_render(component_type: str) -> None:
    props: dict[str, object] = {
        "page": {},
        "page-header": {"title": "Title"},
        "container": {},
        "stack": {},
        "inline": {},
        "grid": {},
        "card": {},
        "section": {},
        "divider": {},
        "heading": {"text": "Heading"},
        "text": {"text": "Text"},
        "badge": {"label": "Healthy"},
        "icon": {"name": "activity"},
        "key-value": {"items": [{"label": "Name", "value": "One"}]},
        "metric": {"label": "Total", "value": 1},
        "aggregate-metric": {"label": "Total", "data": {"kind": "ref", "path": "data.devices"}},
        "mermaid": {"title": "Flow", "nodes": [{"id": "start", "label": "Start"}]},
        "alert": {"title": "Note", "message": "Detail"},
        "progress": {"label": "Usage", "value": 4},
        "empty-state": {"title": "Empty", "message": "None"},
        "table": {
            "data": {"kind": "ref", "path": "data.devices"},
            "columns": [{"key": "name", "label": "Name"}],
        },
        "status-list": {"data": {"kind": "ref", "path": "data.devices"}},
        "timeline": {"data": {"kind": "ref", "path": "data.incidents"}},
        "sparkline": {
            "data": {"kind": "ref", "path": "data.series"},
            "value": "cpu",
            "label": "CPU",
        },
        "line-chart": {
            "title": "CPU",
            "data": {"kind": "ref", "path": "data.series"},
            "series": [{"label": "CPU", "value": "cpu"}],
        },
        "bar-chart": {
            "title": "CPU",
            "data": {"kind": "ref", "path": "data.series"},
            "series": [{"label": "CPU", "value": "cpu"}],
        },
        "donut-chart": {
            "title": "CPU",
            "data": {"kind": "ref", "path": "data.series"},
            "series": [{"label": "CPU", "value": "cpu"}],
        },
        "button": {"label": "Save"},
        "modal": {"title": "Modal"},
        "form": {"title": "Form"},
        "field-group": {"legend": "Details"},
        "field": {"label": "Name"},
        "text-input": {"state_path": "state.query"},
        "textarea": {"state_path": "state.query"},
        "number-input": {"state_path": "state.page"},
        "select": {"state_path": "state.choice", "options": [{"value": "one", "label": "One"}]},
        "radio-group": {
            "state_path": "state.choice",
            "options": [{"value": "one", "label": "One"}, {"value": "two", "label": "Two"}],
        },
        "checkbox": {"state_path": "state.enabled", "label": "Enabled"},
        "toggle": {"state_path": "state.enabled", "label": "Enabled"},
        "search": {"state_path": "state.query"},
        "tabs": {"label": "Views"},
        "date-range": {"state_path": "state.range"},
        "breadcrumbs": {"items": [{"label": "Overview", "destination": "overview"}]},
        "pagination": {"page_state": "state.page"},
        "toast": {"message": "Saved"},
        "image": {"asset_id": "device-outline", "alt": "Device outline"},
        "file-upload": {"state_path": "state.upload"},
    }
    elements: dict[str, object] = {
        "root": {"type": component_type, "props": props.get(component_type, {})}
    }
    if component_type == "repeat":
        elements["root"] = {
            "type": "repeat",
            "props": {"data": {"kind": "ref", "path": "data.devices"}},
            "children": ["row"],
        }
        elements["row"] = {"type": "text", "props": {"text": {"kind": "ref", "path": "item.name"}}}
    state = {"query": "", "page": 1, "choice": "one", "enabled": True, "range": "24h", "upload": ""}
    manifest = ForgeManifest.model_validate(
        {
            "metadata": {"title": "Fixture"},
            "design": {"name": "ops-compact"},
            "state": {"values": state},
            "root": "root",
            "elements": elements,
        }
    )
    output = render_manifest(
        manifest,
        data={"devices": [{"name": "North"}], "incidents": [], "series": [{"cpu": 0.5}]},
        state=state,
    )
    assert 'id="forge-element-root"' in output
    assert "Dashboard component unavailable." not in output


def test_single_point_chart_has_a_visible_theme_owned_marker() -> None:
    manifest = _manifest(
        {
            "root": {
                "type": "line-chart",
                "props": {
                    "title": "CPU",
                    "data": {"kind": "ref", "path": "data.series"},
                    "x_key": "timestamp",
                    "x_axis_label": "Report time",
                    "y_axis_label": "Utilization",
                    "value_format": "percent",
                    "series": [{"label": "CPU", "value": "cpu"}],
                },
            }
        }
    )

    output = render_manifest(
        manifest,
        data={"series": [{"timestamp": "2026-07-24T08:30:00+00:00", "cpu": 0.5}]},
    )

    assert "forge-chart-point" in output
    assert "forge-chart-series--1" in output
    assert "forge-chart-axis-title" in output
    assert "Report time" in output
    assert "Utilization" in output
    assert "08:30" in output
    assert "50%" in output
    assert 'data-forge-chart-label="CPU — 08:30: 50%"' in output
    assert output.count("data-forge-chart-point") == 1
    assert 'tabindex="0" role="img" aria-label="CPU — 08:30: 50%"' in output
    assert "data-forge-chart-tooltip" in output
    assert 'stroke="#' not in output


def test_actionable_dashboard_surfaces_render_explicit_safe_drilldowns() -> None:
    manifest = _manifest(
        {
            "root": {"type": "page", "children": ["metric", "chart"]},
            "metric": {
                "type": "metric",
                "action": "go-devices",
                "props": {"label": "Critical", "value": 2, "status": "critical"},
            },
            "chart": {
                "type": "line-chart",
                "action": "go-devices",
                "props": {
                    "title": "CPU",
                    "data": {"kind": "ref", "path": "data.series"},
                    "series": [{"label": "CPU", "value": "cpu"}],
                },
            },
        },
        actions={"go-devices": {"type": "navigate", "destination": "devices"}},
    )

    output = render_manifest(manifest, data={"series": [{"cpu": 0.5}]})

    assert output.count('data-forge-action="go-devices"') == 2
    assert 'aria-label="View details for Critical"' in output
    assert 'aria-label="View details for CPU"' in output
    assert output.count("forge-surface-action-icon") == 2
    assert "href=" not in output


def test_trusted_display_formats_produce_finished_operational_values() -> None:
    manifest = _manifest(
        {
            "root": {"type": "page", "children": ["capacity", "devices", "timeline"]},
            "capacity": {
                "type": "progress",
                "props": {
                    "label": "CPU",
                    "value": {"kind": "ref", "path": "data.summary.fleet_cpu"},
                    "maximum": 1.0,
                },
            },
            "devices": {
                "type": "table",
                "props": {
                    "data": {"kind": "ref", "path": "data.devices"},
                    "columns": [
                        {"key": "status", "label": "Status", "format": "status"},
                        {"key": "cpu", "label": "CPU", "format": "percent"},
                        {
                            "key": "temperature",
                            "label": "Temperature",
                            "format": "temperature",
                        },
                        {"key": "latency", "label": "Latency", "format": "duration-ms"},
                        {"key": "last_seen", "label": "Last seen", "format": "datetime"},
                    ],
                },
            },
            "timeline": {
                "type": "timeline",
                "props": {"data": {"kind": "ref", "path": "data.incidents"}},
            },
        }
    )
    output = render_manifest(
        manifest,
        data={
            "summary": {"fleet_cpu": 0.47},
            "devices": [
                {
                    "status": "healthy",
                    "cpu": 0.24,
                    "temperature": 43.2,
                    "latency": 12.0,
                    "last_seen": "2026-07-24T08:29:54+00:00",
                }
            ],
            "incidents": [{"opened": "2026-07-24T08:21:00+00:00", "message": "Threshold crossed"}],
        },
    )

    assert "47%" in output
    assert "Healthy" in output
    assert "24%" in output
    assert "43.2 °C" in output
    assert "12 ms" in output
    assert "24 Jul 2026, 08:29 UTC" in output
    assert "24 Jul 2026, 08:21 UTC" in output


def test_repeat_filter_renders_only_the_host_selected_item() -> None:
    manifest = ForgeManifest.model_validate(
        {
            "metadata": {"title": "Selected device"},
            "design": {"name": "calm-neutral"},
            "state": {"values": {"device_id": "edge-2"}},
            "root": "root",
            "elements": {
                "root": {
                    "type": "repeat",
                    "props": {
                        "data": {"kind": "ref", "path": "data.devices"},
                        "filter_state": "state.device_id",
                        "filter_key": "id",
                    },
                    "children": ["name"],
                },
                "name": {
                    "type": "text",
                    "props": {"text": {"kind": "ref", "path": "item.name"}},
                },
            },
        }
    )

    output = render_manifest(
        manifest,
        data={"devices": [{"id": "edge-1", "name": "North"}, {"id": "edge-2", "name": "South"}]},
        state={"device_id": "edge-2"},
    )

    assert "South" in output
    assert "North" not in output
