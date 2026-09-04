from __future__ import annotations

import json
from pathlib import Path

import pytest
from examples.analytics_host import DEMO_SNAPSHOT, build_runtime
from playwright.sync_api import expect

from forgeui.renderer import RenderContext, Renderer
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
