from __future__ import annotations

import copy
import math
import re

import pytest
from bs4 import BeautifulSoup

from forgeui.catalog.registry import component_registry
from forgeui.renderer import HtmlRendererAdapter, RenderContext, RenderOptions
from forgeui.renderer.sankey import sankey_extra
from forgeui.validation import manifest_json_schema, validate_manifest


def props():
    return {
        "title": "Material flow",
        "description": "Synthetic · September 2026",
        "unit": "kg",
        "nodes": [
            {"id": "a", "label": "Intake"},
            {"id": "b", "label": "Used"},
            {"id": "c", "label": "Recovered"},
        ],
        "links": [
            {"source": "a", "target": "b", "value": 75, "label": "Production"},
            {"source": "a", "target": "c", "value": 25},
        ],
    }


def candidate(properties=None):
    return {
        "metadata": {"title": "Flow"},
        "design": {"name": "calm-neutral"},
        "root": "page",
        "elements": {
            "page": {"type": "page", "children": ["flow", "sibling"]},
            "flow": {"type": "sankey", "props": properties if properties is not None else props()},
            "sibling": {"type": "heading", "props": {"text": "Still available"}},
        },
    }


@pytest.mark.parametrize("value", [-1, True, "12", None, math.nan, math.inf, 1e10])
def test_invalid_static_quantities_fail_before_rendering(value):
    raw = candidate()
    raw["elements"]["flow"]["props"]["links"][0]["value"] = value
    assert not validate_manifest(raw).valid


@pytest.mark.parametrize("mutation", ["duplicate", "dangling", "cycle", "self", "parallel"])
def test_graph_structure_is_rejected(mutation):
    p = props()
    if mutation == "duplicate":
        p["nodes"].append(p["nodes"][0])
    elif mutation == "dangling":
        p["links"][0]["target"] = "missing"
    elif mutation == "cycle":
        p["links"].append({"source": "b", "target": "a", "value": 1})
    elif mutation == "self":
        p["links"][0]["target"] = "a"
    else:
        p["links"].append(p["links"][0])
    assert not validate_manifest(candidate(p)).valid


@pytest.mark.parametrize("field", ["description", "unit", "title"])
def test_annotations_are_required(field):
    p = props()
    del p[field]
    assert not validate_manifest(candidate(p)).valid


def test_catalog_schema_prompt_and_profile_agree():
    schema = manifest_json_schema()["$defs"]["Props_sankey"]
    assert {"title", "description", "unit", "nodes"} <= set(schema["required"])
    assert schema["properties"]["nodes"]["maxItems"] == 40
    assert schema["properties"]["links"]["maxItems"] == 80
    docs = next(entry for entry in component_registry.prompt_docs() if entry["type"] == "sankey")
    assert "no cycles or self links" in docs["note"]
    assert docs["props"]["properties"]["links"]["maxItems"] == 80
    assert component_registry.is_compatible("sankey", "ops-compact")
    raw = candidate()
    raw["design"]["name"] = "executive-summary"
    assert not validate_manifest(raw).valid


@pytest.mark.parametrize("value", [-1, True, "12", None, math.nan, math.inf, 1e10, 10**1000])
def test_bad_provider_values_are_local_errors(value):
    raw = candidate()
    raw["elements"]["flow"]["props"]["links"][0]["value"] = {
        "kind": "ref",
        "path": "data.summary.total",
    }
    assert validate_manifest(raw).valid
    result = HtmlRendererAdapter().render(raw, RenderContext(data={"summary": {"total": value}}))
    assert not result.ok
    assert result.issues
    assert "Still available" in result.output
    assert "forge-render-error" in result.output


def test_unknown_provider_path_and_executable_props_fail_validation():
    raw = candidate()
    raw["elements"]["flow"]["props"]["links"][0]["value"] = {
        "kind": "ref",
        "path": "data.private.quantity",
    }
    assert not validate_manifest(raw).valid
    for field, value in [
        ("style", "fill:red"),
        ("url", "https://example.com"),
        ("on_click", "run()"),
    ]:
        raw = candidate()
        raw["elements"]["flow"]["props"][field] = value
        assert not validate_manifest(raw).valid


def test_provider_values_and_declared_actions_use_existing_runtime_boundary():
    raw = candidate()
    raw["elements"]["flow"]["props"]["links"][0]["value"] = {
        "kind": "ref",
        "path": "data.summary.total",
    }
    raw["actions"] = {"inspect": {"type": "navigate", "destination": "devices"}}
    raw["elements"]["flow"]["action"] = "inspect"
    for interaction in ("inert", "events"):
        result = HtmlRendererAdapter().render(
            raw, RenderContext(data={"summary": {"total": 250}}), RenderOptions(interaction)
        )
        assert result.ok
        assert "250 kg" in result.output
        assert ('data-forge-action="inspect"' in result.output) == (interaction == "events")
    result = HtmlRendererAdapter().render(
        raw, RenderContext(data={"summary": {"total": {"kind": "literal", "value": 250}}})
    )
    assert not result.ok  # Provider data cannot inject a second expression evaluation.


def test_safe_labels_are_escaped_and_markup_is_rejected():
    p = props()
    p["nodes"][0]["label"] = 'Intake <img src=x onerror="bad">'
    output = HtmlRendererAdapter().render(candidate(p)).output
    soup = BeautifulSoup(output, "html.parser")
    assert not soup.select("img, script")
    assert '<img src=x onerror="bad">' in soup.get_text()
    p["links"][0]["label"] = "<script>alert(1)</script>"
    assert not validate_manifest(candidate(p)).valid


@pytest.mark.parametrize("interaction", ["inert", "events"])
def test_exact_annotations_and_accessible_data_survive_export(interaction):
    raw = candidate()
    original = copy.deepcopy(raw)
    result = HtmlRendererAdapter().render(raw, options=RenderOptions(interaction))
    assert result.ok
    assert "forgeui-charts.css" in result.assets
    soup = BeautifulSoup(result.output, "html.parser")
    assert len(soup.select(".forge-sankey-link[tabindex='0']")) == 2
    assert (
        soup.select_one(".forge-sankey-link")["aria-label"] == "Intake → Used: 75 kg · Production"
    )
    assert "Flow data" in soup.get_text()
    assert "Balance = inflow minus outflow" in soup.get_text()
    assert raw == original


@pytest.mark.parametrize("factor", [1.0, 1e-320, 1e7])
def test_ribbon_widths_are_proportional_and_geometry_is_finite(factor):
    p = props()
    p["links"][0]["value"] = 75 * factor
    p["links"][1]["value"] = 25 * factor
    extra = sankey_extra(p)
    soup = BeautifulSoup(extra["svg"], "html.parser")
    paths = soup.select(".forge-sankey-link")
    widths = []
    for path in paths:
        numbers = [float(n) for n in re.findall(r"[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?", path["d"])]
        assert all(math.isfinite(n) for n in numbers)
        # M x y C cx cy cx cy x y L x y: lower target edge minus upper target edge.
        widths.append(numbers[9] - numbers[7])
    assert widths[0] / widths[1] == pytest.approx(3)
    assert "nan" not in extra["svg"].lower()
    assert "inf" not in " ".join(path["d"] for path in paths).lower()


def test_gradient_endpoints_match_nodes_and_composed_fragments_have_unique_paint_ids():
    first = sankey_extra(props())["svg"]
    second = sankey_extra(props())["svg"]
    soup = BeautifulSoup(first + second, "html.parser")
    gradients = soup.find_all("lineargradient")
    assert len(gradients) == 4
    assert len({gradient["id"] for gradient in gradients}) == 4
    for svg in soup.select("svg"):
        links = svg.select(".forge-sankey-link")
        nodes = svg.select(".forge-sankey-node")
        for index, link in enumerate(links):
            gradient_id = link["fill"].removeprefix("url(#").removesuffix(")")
            gradient = svg.find(id=gradient_id)
            assert gradient["gradientunits"] == "userSpaceOnUse"
            assert float(gradient["x2"]) > float(gradient["x1"])
            stops = gradient.select("stop")
            assert stops[0]["class"][-1] == nodes[0]["class"][-1]
            assert stops[1]["class"][-1] == nodes[index + 1]["class"][-1]
            assert all(stop["stop-color"] == "currentColor" for stop in stops)
    # Only paint identifiers vary; the same flow keeps identical geometry.
    shapes = [svg.select(".forge-sankey-link") for svg in soup.select("svg")]
    assert [path["d"] for path in shapes[0]] == [path["d"] for path in shapes[1]]


def test_imbalance_and_zero_flows_are_explicit_and_not_normalized():
    p = props()
    p["links"] = [
        {"source": "a", "target": "b", "value": 100},
        {"source": "b", "target": "c", "value": 60},
    ]
    extra = sankey_extra(p)
    assert extra["nodes"][1] == {
        "label": "Used",
        "incoming": "100",
        "outgoing": "60",
        "balance": "40",
    }
    p["links"][0]["value"] = 0
    p["links"][1]["value"] = 0
    result = HtmlRendererAdapter().render(candidate(p))
    assert result.ok
    assert "No positive flow" in result.output
    assert "0 kg" in result.output
    assert "<svg" not in result.output


def test_boundaries_disconnected_graph_and_long_chain():
    p = props()
    p["nodes"] = [{"id": f"n{i}", "label": f"Node {i}"} for i in range(40)]
    p["links"] = [{"source": f"n{i}", "target": f"n{i + 1}", "value": 1} for i in range(38)]
    result = HtmlRendererAdapter().render(candidate(p))
    assert result.ok
    assert len(BeautifulSoup(result.output, "html.parser").select(".forge-sankey-node")) == 40
    p["nodes"].append({"id": "extra", "label": "Too many"})
    assert not validate_manifest(candidate(p)).valid
    p = props()
    p["links"] *= 41
    assert not validate_manifest(candidate(p)).valid
