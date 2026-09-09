from __future__ import annotations

import json
from pathlib import Path

import pytest
from examples.analytics_host import DEMO_SNAPSHOT, build_runtime
from playwright.sync_api import expect

from forgeui.renderer import HtmlRendererAdapter, RenderContext, RenderOptions

ROOT = Path(__file__).parents[2]
STATIC = ROOT / "src/forgeui/web/static"


@pytest.mark.browser
@pytest.mark.parametrize(
    ("theme", "width"),
    [("light", 1280), ("dark", 1280), ("light", 390), ("dark", 390), ("system", 1280)],
)
def test_sankey_annotations_keyboard_themes_and_mobile(page, theme, width, tmp_path):
    runtime = build_runtime(lambda _: DEMO_SNAPSHOT, lambda _: True)
    raw = json.loads((ROOT / "examples/manifests/sales-analytics.json").read_text())
    raw["root"] = "revenue_flow"
    raw["elements"] = {"revenue_flow": raw["elements"]["revenue_flow"]}
    adapter = HtmlRendererAdapter(policy=runtime.policy)
    page.set_viewport_size({"width": width, "height": 1000})
    page.emulate_media(
        reduced_motion="reduce", color_scheme="dark" if theme != "light" else "light"
    )
    for interaction in ("inert", "events"):
        result = adapter.render(raw, RenderContext(data=DEMO_SNAPSHOT), RenderOptions(interaction))
        assert result.ok
        page.set_content(f'<html data-theme="{theme}"><body>{result.output}</body></html>')
        for asset in result.assets:
            page.add_style_tag(content=(STATIC / asset).read_text())
        diagram = page.get_by_role("region", name="August revenue flow diagram", exact=True)
        expect(diagram).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert page.locator(".forge-sankey-link").count() == 4
        svg = page.locator(".forge-sankey-svg")
        if width == 1280:
            assert svg.bounding_box()["width"] == pytest.approx(diagram.bounding_box()["width"])
            assert diagram.evaluate("el => el.scrollHeight <= el.clientHeight")
            # Both outer bars reach the canvas edges with equal, modest insets.
            bounds = page.locator(".forge-sankey-node rect").evaluate_all(
                "nodes => nodes.map(node => { const r = node.getBoundingClientRect(); "
                "return {left: r.left, right: r.right}; })"
            )
            canvas = svg.bounding_box()
            left_gap = min(bar["left"] for bar in bounds) - canvas["x"]
            right_gap = canvas["x"] + canvas["width"] - max(bar["right"] for bar in bounds)
            assert left_gap == pytest.approx(right_gap)
            assert right_gap < canvas["width"] * 0.05
        for viewport in (width, 1600, width):
            page.set_viewport_size({"width": viewport, "height": 1000})
            for selector, size in ((".forge-sankey-label", 13), (".forge-sankey-value", 12)):
                rendered_sizes = page.locator(selector).evaluate_all(
                    "labels => labels.map(el => parseFloat(getComputedStyle(el).fontSize) * "
                    "el.getScreenCTM().a)"
                )
                assert rendered_sizes == pytest.approx([size] * 5)
        node_bar = page.locator(".forge-sankey-node rect").first
        expect(node_bar).to_have_attribute("width", "18")
        node_bar.click()
        assert (
            page.locator(".forge-sankey-node").first.evaluate("el => el.matches(':focus-visible')")
            is False
        )
        page.locator(".forge-sankey-label").first.dblclick()
        assert page.evaluate("window.getSelection().toString()") == ""
        assert (
            page.locator(".forge-sankey-label").first.evaluate("el => getComputedStyle(el).cursor")
            == "default"
        )
        contrast = page.locator(
            ".forge-sankey-node rect, .forge-sankey-annotations text"
        ).evaluate_all("""nodes => {
            const rgb = value => {
                const channels = value.match(/[\\d.]+/g).map(Number).slice(0, 3);
                return value.startsWith('color(srgb') ? channels.map(v => v * 255) : channels;
            };
            const luminance = color => color.map(v => {
                v /= 255;
                return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
            }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
            return nodes.map(node => {
                const style = getComputedStyle(node);
                let surface = node.closest('.forge-sankey-scroll');
                while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') {
                    surface = surface.parentElement;
                }
                const bg = rgb(getComputedStyle(surface).backgroundColor);
                // Pale ribbons are annotated by contrasting node bars and text labels.
                const opacity = Number(style.fillOpacity);
                const edge = rgb(style.fill).map((v, i) => v * opacity + bg[i] * (1 - opacity));
                const a = luminance(edge), b = luminance(bg);
                return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
            });
        }""")
        assert min(contrast[:5]) >= 3
        assert min(contrast[5:]) >= 4.5
        assert page.locator(".forge-sankey-link").first.evaluate(
            "el => Number(getComputedStyle(el).fillOpacity)"
        ) == pytest.approx(0.65 if theme == "light" else 1)
        assert (
            page.locator(".forge-sankey-svg stop").evaluate_all(
                "stops => stops.map(stop => Number(getComputedStyle(stop).stopOpacity))"
            )
            == ([0.16, 0.32] if theme == "light" else [0.3, 0.5]) * 4
        )
        palette = page.locator(".forge-sankey-svg stop").evaluate_all(
            "stops => [...new Set(stops.map(stop => getComputedStyle(stop).stopColor))]"
        )
        assert len(palette) == 5
        if width == 390:
            assert diagram.evaluate("el => el.scrollWidth > el.clientWidth")
            diagram.focus()
            page.keyboard.press("ArrowRight")
            page.wait_for_function("document.querySelector('.forge-sankey-scroll').scrollLeft > 0")
        if interaction == "events":
            page.add_script_tag(content=(STATIC / "forgeui.js").read_text())
            page.keyboard.press("Tab")  # Switch from pointer clicks to keyboard inspection.
            link = page.locator(".forge-sankey-link").first
            link.focus()
            tooltip = page.locator("[data-forge-chart-tooltip]")
            expect(tooltip).to_have_text(
                "EMEA → Booked revenue: 65,000 CHF · Regional contribution"
            )
            assert link.evaluate("el => getComputedStyle(el).strokeWidth") == "2px"
            page.keyboard.press("Escape")
            expect(tooltip).to_be_hidden()
            page.locator(".forge-sankey-header").hover()
            page.locator(".forge-sankey-label").first.hover()
            expect(tooltip).to_have_text("EMEA: inflow 0 CHF; outflow 65,000 CHF")
        disclosure = page.locator(".forge-sankey-data > summary")
        disclosure.focus()
        page.keyboard.press("Enter")
        expect(page.get_by_role("table")).to_have_count(2)
        expect(page.get_by_role("cell", name="65,000 CHF", exact=True)).to_be_visible()
        for table in page.locator(".forge-sankey-data table").all():
            assert table.locator("caption").evaluate(
                "el => getComputedStyle(el).paddingLeft"
            ) == table.locator("tbody tr > :first-child").first.evaluate(
                "el => getComputedStyle(el).paddingLeft"
            )
        row_heading = page.locator(".forge-sankey-totals tbody th").first
        assert row_heading.evaluate("el => getComputedStyle(el).textTransform") == "none"
        assert row_heading.evaluate("el => getComputedStyle(el).borderBottomWidth") == "1px"
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert (
            page.locator(".forge-sankey-link").first.evaluate(
                "el => getComputedStyle(el).animationName"
            )
            == "none"
        )
        page.screenshot(path=tmp_path / f"sankey-{interaction}-{theme}-{width}.png", full_page=True)
        disclosure.focus()
        page.keyboard.press("Enter")
        expect(page.get_by_role("table")).to_have_count(0)
