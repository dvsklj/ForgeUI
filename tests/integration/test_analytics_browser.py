from __future__ import annotations

import json
from pathlib import Path

import pytest
from examples.analytics_host import DEMO_SNAPSHOT, build_runtime
from playwright.sync_api import expect

from forgeui.renderer import HtmlRendererAdapter, RenderContext, Renderer, RenderOptions
from forgeui.validation import validate_manifest

ROOT = Path(__file__).parents[2]
STATIC = ROOT / "src/forgeui/web/static"


@pytest.mark.browser
@pytest.mark.parametrize(("theme", "width"), [("light", 1280), ("dark", 1280), ("light", 390)])
def test_analytics_filters_and_diagram_selection_with_reference_script(
    page, theme, width, tmp_path
):
    page.set_default_timeout(5000)
    runtime = build_runtime(lambda _: DEMO_SNAPSHOT, lambda _: True)
    raw = json.loads((ROOT / "examples/manifests/sales-analytics.json").read_text())
    manifest = validate_manifest(raw, policy=runtime.policy).manifest
    renderer = Renderer()
    state = dict(manifest.state.values)

    def render():
        return renderer.render(manifest, RenderContext(data=DEMO_SNAPSHOT, state=state))

    def route(request_route):
        request = request_route.request
        if "/state/" in request.url:
            key = request.url.rsplit("/", 1)[1]
            state[key] = request.post_data_json["value"]
            request_route.fulfill(json={"html": render(), "state": state})
        else:
            request_route.fulfill(body="<html><body></body></html>", content_type="text/html")

    page.route("http://forge.test/**", route)
    page.set_viewport_size({"width": width, "height": 900})
    page.goto("http://forge.test/")
    page.set_content(
        f'<html data-theme="{theme}"><body><main id="forge-main" '
        'data-forge-state-url="/state/__STATE_KEY__">' + render() + "</main></body></html>"
    )
    page.add_style_tag(content=STATIC.joinpath("forgeui.css").read_text())
    page.evaluate("theme => localStorage.setItem('forgeui-theme', theme)", theme)
    page.add_script_tag(content=STATIC.joinpath("forgeui.js").read_text())
    expect(page.locator("#forge-element-sample strong")).to_have_text("476,000")
    page.get_by_label("Region", exact=True).select_option("emea")
    expect(page.locator("#forge-element-sample strong")).to_have_text("158,000")
    expect(page.locator("#forge-element-rows tbody tr")).to_have_count(3)
    expect(page.locator("#forge-element-revenue strong")).to_have_text("185,000")
    page.get_by_label("Select node", exact=True).select_option("emea")
    expect(page.get_by_label("Select node", exact=True)).to_have_value("emea")
    assert page.locator(".forge-render-error").count() == 0
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.screenshot(path=tmp_path / f"forgeui-analytics-{theme}-{width}.png", full_page=True)


@pytest.mark.browser
@pytest.mark.parametrize(("theme", "width"), [("light", 1280), ("dark", 390)])
def test_adapter_exports_are_accessible_and_donut_inspection_works(page, theme, width, tmp_path):
    runtime = build_runtime(lambda _: DEMO_SNAPSHOT, lambda _: True)
    raw = json.loads((ROOT / "examples/manifests/sales-analytics.json").read_text())
    raw["elements"]["trend"]["type"] = "donut-chart"
    raw["elements"]["page"]["children"].append("apply")
    raw["elements"]["apply"] = {
        "type": "button",
        "props": {"label": "Apply region"},
        "action": "apply_region",
    }
    raw["actions"] = {
        "apply_region": {
            "type": "set_state",
            "path": "state.region",
            "value": {"kind": "literal", "value": "emea"},
        }
    }
    adapter = HtmlRendererAdapter(policy=runtime.policy)
    context = RenderContext(data=DEMO_SNAPSHOT)
    page.set_viewport_size({"width": width, "height": 900})

    for interaction in ("inert", "events"):
        result = adapter.render(raw, context, RenderOptions(interaction))
        assert result.ok
        page.set_content(f'<html data-theme="{theme}"><body>{result.output}</body></html>')
        page.add_style_tag(content=STATIC.joinpath("forgeui.css").read_text())
        # Role lookup excludes nodes hidden by HTML's inert attribute, unlike visibility checks.
        expect(page.get_by_role("heading", name=DEMO_SNAPSHOT["title"], exact=True)).to_be_visible()
        expect(page.get_by_role("table")).to_have_count(2)
        controls = page.locator("button, select")
        for control in controls.all():
            if interaction == "inert":
                expect(control).to_be_disabled()
            else:
                expect(control).to_be_enabled()
        expect(page.locator("[data-forge-action]")).to_have_count(
            0 if interaction == "inert" else 1
        )
        page.locator(".forge-chart-summary summary").focus()
        page.keyboard.press("Enter")
        expect(page.locator(".forge-chart-summary table")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        if width < 640:
            heading = page.get_by_role("heading", name=DEMO_SNAPSHOT["title"], exact=True)
            assert heading.bounding_box()["width"] >= width * 0.7
            subtitle = page.locator(".forge-subtitle")
            assert (
                subtitle.bounding_box()["y"]
                >= heading.bounding_box()["y"] + heading.bounding_box()["height"]
            )
        if interaction == "events":
            page.add_script_tag(content=STATIC.joinpath("forgeui.js").read_text())
            point = page.locator("circle[data-forge-chart-point]").last
            point.focus()
            tooltip = page.locator("[data-forge-chart-tooltip]").first
            expect(tooltip).to_have_text("Revenue — August: 120,000")
            expect(tooltip).to_be_visible()
            page.keyboard.press("Escape")
            expect(tooltip).to_be_hidden()
        page.screenshot(
            path=tmp_path / f"forgeui-adapter-{interaction}-{theme}-{width}.png", full_page=True
        )
