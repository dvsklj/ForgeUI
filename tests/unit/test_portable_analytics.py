from __future__ import annotations

import math

import pytest

from forgeui.analytics import aggregate, filter_rows
from forgeui.catalog.registry import DiagramProps
from forgeui.mermaid import MermaidImportError, export_mermaid, import_mermaid
from forgeui.renderer import HtmlRendererAdapter, RenderContext, RendererCapabilities, RenderOptions
from forgeui.validation import manifest_json_schema, validate_manifest


def candidate(props=None, component="aggregate-metric"):
    return {
        "metadata": {"title": "Analytics"},
        "design": {"name": "ops-compact"},
        "state": {
            "values": {"query": "", "selection": "all"},
            "writable": ["state.query", "state.selection"],
        },
        "root": "root",
        "elements": {
            "root": {
                "type": component,
                "props": props
                or {
                    "label": "Devices",
                    "data": {"kind": "ref", "path": "data.devices"},
                    "filters": [
                        {"key": "name", "state_path": "state.query", "operator": "contains"}
                    ],
                },
            }
        },
    }


@pytest.mark.parametrize(
    ("operator", "selected", "expected"),
    [
        ("eq", 0, [0]),
        ("gte", 1, [1, 2]),
        ("lte", 1, [0, 1]),
        ("in", [0, 2], [0, 2]),
        ("eq", False, []),
        ("eq", "all", [0, 1, 2]),
        ("eq", [], [0, 1, 2]),
        ("gte", math.nan, []),
        ("in", "0", []),
    ],
)
def test_filters(operator, selected, expected):
    result = filter_rows(
        [{"n": n} for n in range(3)],
        {"filters": [{"key": "n", "state_path": "state.pick", "operator": operator}]},
        {"pick": selected},
    )
    assert [row["n"] for row in result] == expected


def test_search_combines_with_legacy_and_handles_collection_state():
    props = {
        "filter_state": "state.region",
        "filter_key": "region",
        "filters": [{"key": "name", "state_path": "state.search", "operator": "contains"}],
    }
    rows = [{"name": "Straße", "region": "eu"}, {"name": "Street", "region": "us"}]
    assert filter_rows(rows, props, {"region": "eu", "search": "STRASSE"}) == rows[:1]
    assert filter_rows(rows, props, {"region": ["eu"]}) == []


@pytest.mark.parametrize(
    ("operation", "value"), [("count", 6), ("sum", 4), ("mean", 2), ("min", -2), ("max", 6)]
)
def test_aggregates_ignore_missing_boolean_and_nonfinite(operation, value):
    rows = [{"n": n} for n in [-2, 6, None, True, math.nan, math.inf]]
    assert aggregate(rows, operation, "n") == value
    assert aggregate([], operation, "n") == (0 if operation == "count" else None)


def test_validation_and_sample_kpi():
    adapter = HtmlRendererAdapter()
    result = adapter.render(
        candidate(),
        RenderContext(
            data={"devices": [{"name": "Alpha"}, {"name": "Beta"}]}, state={"query": "alpha"}
        ),
    )
    assert result.ok
    assert "<strong>1</strong>" in result.output
    assert "inert" in result.output
    assert "Filtered sample" in result.output
    raw = candidate()
    raw["elements"]["root"]["props"]["filters"][0]["state_path"] = "state.secret"
    assert not adapter.render(raw).ok
    raw["elements"]["root"]["props"]["filters"][0]["key"] = "secret"
    assert any(issue.code == "unknown_collection_field" for issue in adapter.render(raw).issues)


def test_adapter_capabilities_and_mutated_models():
    class Limited(HtmlRendererAdapter):
        def capabilities(self):
            return RendererCapabilities("limited", "1", frozenset())

    result = Limited().render(candidate(), options=RenderOptions(interaction="events"))
    assert {issue.code for issue in result.issues} == {
        "unsupported_component",
        "unsupported_interaction",
    }
    assert not result.output
    report = validate_manifest(candidate())
    report.manifest.elements["root"].props["html"] = "bad"
    assert not HtmlRendererAdapter().render(report.manifest).ok


def test_chart_filter_and_row_budget_match_kpi():
    raw = candidate(
        {
            "title": "CPU",
            "data": {"kind": "ref", "path": "data.series"},
            "series": [{"label": "CPU", "value": "cpu"}],
            "filters": [{"key": "cpu", "state_path": "state.query", "operator": "gte"}],
        },
        "line-chart",
    )
    result = HtmlRendererAdapter().render(
        raw, RenderContext(data={"series": [{"cpu": 0.2}, {"cpu": 0.8}]}, state={"query": 0.5})
    )
    assert result.ok
    assert "0.8" in result.output
    assert "0.2" not in result.output


@pytest.mark.parametrize("direction", ["TB", "BT", "LR", "RL"])
def test_mermaid_render_filter_cycles_selection_and_roundtrip(direction):
    diagram = DiagramProps(
        title="Flow",
        direction=direction,
        nodes=[
            {"id": "a", "label": 'A "quoted" [value]', "group": "one"},
            {"id": "b", "label": "B", "group": "two"},
        ],
        edges=[
            {"source": "a", "target": "b", "label": "works & continues"},
            {"source": "a", "target": "a"},
        ],
        state_path="state.query",
        filter_state="state.selection",
    )
    imported = import_mermaid(export_mermaid(diagram))
    assert [node.label for node in imported.diagram.nodes] == [node.label for node in diagram.nodes]
    assert imported.diagram.edges[0].label == diagram.edges[0].label
    raw = candidate(diagram.model_dump(mode="json"), "mermaid")
    result = HtmlRendererAdapter().render(
        raw, RenderContext(state={"selection": "one"}), RenderOptions("events")
    )
    assert result.ok
    assert "<svg" in result.output
    assert 'name="state.query"' in result.output
    assert ">B<" not in result.output
    empty = HtmlRendererAdapter().render(raw, RenderContext(state={"selection": "missing"}))
    assert empty.ok
    assert "No nodes match" in empty.output


def test_mermaid_corrections_and_rejections():
    imported = import_mermaid("```mermaid\ngraph TD; A[Start] --> B[Finish]\n```")
    assert len(imported.corrections) == 3
    for source in [
        "flowchart TB\nclick a callback",
        "flowchart TB\na --> b --> c",
        "flowchart TB\na[https://evil.test]",
        "flowchart TB\n%%{init: x}%%",
        "sequenceDiagram\na->>b: hello",
        "",
        "x" * 32769,
    ]:
        with pytest.raises(MermaidImportError):
            import_mermaid(source)
    with pytest.raises(ValueError, match="declared nodes"):
        DiagramProps(
            title="Flow", nodes=[{"id": "a", "label": "A"}], edges=[{"source": "a", "target": "b"}]
        )


def test_schema_references_resolve():
    schema = manifest_json_schema()

    def walk(value):
        if isinstance(value, dict):
            if "$ref" in value:
                target = schema
                for part in value["$ref"].removeprefix("#/").split("/"):
                    target = target[part]
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(schema)


def test_metric_comparison_is_absolute_and_formatted():
    raw = candidate(
        {"label": "Revenue", "value": 12500, "comparison": 10000, "format": "number"}, "metric"
    )
    result = HtmlRendererAdapter().render(raw)
    assert result.ok
    assert "12,500" in result.output
    assert "+2,500 vs comparison" in result.output


def test_signed_bar_geometry_and_donut_proportions():
    from bs4 import BeautifulSoup

    from forgeui.renderer import Renderer

    renderer = Renderer()
    signed = renderer._chart_svg(
        "bar", [[-10, 10]], ["Value"], 10, ["Loss", "Gain"], "Period", "Value", "number"
    )
    bars = BeautifulSoup(str(signed), "html.parser").select("rect")
    assert len(bars) == 2
    assert float(bars[0]["height"]) == float(bars[1]["height"])
    assert float(bars[0]["y"]) > float(bars[1]["y"])
    donut = renderer._chart_svg(
        "donut", [[25, 75]], ["Share"], 75, ["A", "B"], "Category", "Share", "number"
    )
    circles = BeautifulSoup(str(donut), "html.parser").select("circle")
    lengths = [float(circle["stroke-dasharray"].split()[0]) for circle in circles]
    assert lengths[1] / lengths[0] == pytest.approx(3, abs=0.001)
    with pytest.raises(ValueError, match="non-negative"):
        renderer._chart_svg("donut", [[-1]], ["Share"], 1, [], "Category", "Share", "number")


def test_oversized_numbers_are_not_valid_aggregates():
    assert aggregate([{"n": 10**1000}], "sum", "n") is None
