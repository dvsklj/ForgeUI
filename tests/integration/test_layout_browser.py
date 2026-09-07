from pathlib import Path

import pytest

from forgeui.renderer import render_manifest
from forgeui.validation import validate_manifest


@pytest.mark.browser
@pytest.mark.parametrize("theme", ["light", "dark"])
def test_auto_grid_reflows_with_container_width_and_visible_children(page, theme):
    report = validate_manifest(
        {
            "metadata": {"title": "Fluid layout"},
            "design": {"name": "ops-compact"},
            "root": "root",
            "elements": {
                "root": {
                    "type": "grid",
                    "props": {"columns": "auto"},
                    "children": ["one", "two", "three"],
                },
                **{
                    key: {"type": "card", "props": {"title": key}}
                    for key in ("one", "two", "three")
                },
            },
        }
    )
    assert report.valid, report.issues
    page.set_viewport_size({"width": 1280, "height": 900})
    page.set_content(
        f'<html data-theme="{theme}"><body><div id="host">'
        + render_manifest(report.manifest)
        + "</div></body></html>"
    )
    css = Path(__file__).parents[2] / "src/forgeui/web/static/forgeui.css"
    page.add_style_tag(content=css.read_text())
    page.add_style_tag(content=css.with_name("forgeui-layout.css").read_text())
    host = page.locator("#host")
    cards = page.locator(".forge-grid--auto > *")

    def set_width(width):
        host.evaluate("(element, width) => element.style.width = width + 'px'", width)

    set_width(900)
    boxes = [card.bounding_box() for card in cards.all()]
    assert len({box["y"] for box in boxes}) == 1
    initial_width = boxes[0]["width"]
    cards.last.evaluate("element => element.remove()")
    assert cards.first.bounding_box()["width"] > initial_width
    host.evaluate("(element, html) => element.innerHTML = html", render_manifest(report.manifest))

    for width in (450, 180):
        set_width(width)
        boxes = [card.bounding_box() for card in cards.all()]
        assert len({box["y"] for box in boxes}) == 3
        assert all(box["width"] <= width for box in boxes)
        assert host.evaluate("element => element.scrollWidth <= element.clientWidth")

    set_width(900)
    host.evaluate("element => element.dataset.forgeSurface = 'mobile'")
    assert len({card.bounding_box()["y"] for card in cards.all()}) == 3


@pytest.mark.browser
@pytest.mark.parametrize("theme", ["light", "dark"])
@pytest.mark.parametrize("surface", ["fragment", "export", "standalone"])
def test_layout_slots_spans_and_native_disclosure_without_runtime(page, theme, surface, tmp_path):
    import json

    from playwright.sync_api import expect

    from forgeui.renderer import HtmlRendererAdapter, Renderer
    from forgeui.surfaces import SurfaceMode

    root = Path(__file__).parents[2]
    raw = json.loads((root / "examples/manifests/layout-controls.json").read_text())
    report = validate_manifest(raw)
    assert report.valid
    assert report.manifest is not None
    renderer = Renderer(interactive=False)
    if surface == "export":
        result = HtmlRendererAdapter().render(raw)
        assert result.ok
        output = result.output
    elif surface == "standalone":
        output = renderer.render_document(report.manifest, surface=SurfaceMode.STANDALONE)
    else:
        output = renderer.render(report.manifest)
    page.set_viewport_size({"width": 1440, "height": 1100})
    page.set_content(output)
    page.add_style_tag(content=(root / "src/forgeui/web/static/forgeui.css").read_text())
    page.add_style_tag(content=(root / "src/forgeui/web/static/forgeui-layout.css").read_text())
    page.locator("html").evaluate("(element, theme) => element.dataset.theme = theme", theme)
    page.emulate_media(reduced_motion="reduce")
    composition = page.locator("#forge-element-composition")
    frame = composition.locator("..")
    main = page.locator("#forge-element-main")
    side = page.locator("#forge-element-side")
    for width in (1100, 800, 350):
        frame.evaluate("(element, width) => element.style.width = width + 'px'", width)
        tracks = composition.evaluate(
            "element => getComputedStyle(element).gridTemplateColumns.split(' ')"
        )
        effective_width = frame.bounding_box()["width"]
        expected_columns = 3 if effective_width >= 1024 else 2 if effective_width >= 640 else 1
        assert len(tracks) == expected_columns
        main_box, side_box = main.bounding_box(), side.bounding_box()
        assert main_box["width"] <= width
        assert composition.evaluate("element => element.scrollWidth <= element.clientWidth")
        if expected_columns == 3:
            assert main_box["y"] == side_box["y"]
            assert main_box["width"] > 1.9 * side_box["width"]
            assert abs(main_box["height"] - side_box["height"]) < 1
        else:
            assert side_box["y"] > main_box["y"]

    summary = page.locator("#forge-element-disclosure > summary")
    guidance = page.get_by_text(
        "Confirm the maintenance window with the service owner.", exact=True
    )
    expect(guidance).not_to_be_visible()
    summary.focus()
    assert summary.evaluate("element => getComputedStyle(element).outlineStyle") == "solid"
    summary.press("Enter")
    expect(guidance).to_be_visible()
    summary.press("Space")
    expect(guidance).not_to_be_visible()
    assert summary.bounding_box()["height"] >= 44
    assert page.locator("[data-forge-action]").count() == 0
    annotation = page.locator("#forge-element-annotation")
    assert annotation.get_attribute("aria-describedby") == "forge-element-annotation-annotation"
    expect(annotation.locator("figcaption")).to_contain_text("Service handbook")
    expect(page.locator("#forge-element-service-footer")).to_contain_text(
        "Keep the service owner informed."
    )
    frame.evaluate("element => element.style.width = '100%'")
    page.screenshot(path=tmp_path / f"layout-{surface}-{theme}.png", full_page=True)


@pytest.mark.browser
def test_ratios_rows_spacing_alignment_and_nested_grid_queries(page):
    from forgeui.renderer import HtmlRendererAdapter

    raw = {
        "metadata": {"title": "Layout controls"},
        "design": {"name": "ops-compact"},
        "root": "root",
        "elements": {
            "root": {
                "type": "grid",
                "props": {
                    "responsive": {"small": 1, "medium": 2, "large": 2},
                    "ratio": "main-end",
                    "gap_x": "lg",
                    "gap_y": "sm",
                    "density": "compact",
                },
                "children": ["one", "two", "three"],
            },
            "one": {"type": "grid-item", "props": {"row_span": 2}, "children": ["card"]},
            "card": {"type": "card", "props": {"padding": "lg"}, "children": ["label"]},
            "label": {"type": "text", "props": {"text": "Main content"}},
            "two": {
                "type": "grid",
                "props": {"responsive": {"small": 1, "medium": 2, "large": 4}},
                "children": ["a", "b"],
            },
            "a": {"type": "text", "props": {"text": "Nested A"}},
            "b": {"type": "text", "props": {"text": "Nested B"}},
            "three": {"type": "text", "props": {"text": "Third"}},
        },
    }
    result = HtmlRendererAdapter().render(raw)
    assert result.ok
    page.set_viewport_size({"width": 1280, "height": 900})
    page.set_content(result.output)
    page.add_style_tag(
        content=(Path(__file__).parents[2] / "src/forgeui/web/static/forgeui.css").read_text()
    )
    page.add_style_tag(
        content=(
            Path(__file__).parents[2] / "src/forgeui/web/static/forgeui-layout.css"
        ).read_text()
    )
    grid = page.locator("#forge-element-root")
    frame = grid.locator("..")
    frame.evaluate("element => element.style.width = '900px'")
    tracks = grid.evaluate(
        "element => getComputedStyle(element).gridTemplateColumns.split(' ').map(parseFloat)"
    )
    assert tracks[1] / tracks[0] == pytest.approx(2, rel=0.01)
    assert grid.evaluate("element => getComputedStyle(element).columnGap") == "16px"
    assert grid.evaluate("element => getComputedStyle(element).rowGap") == "8px"
    assert (
        page.locator("#forge-element-card").evaluate(
            "element => getComputedStyle(element).paddingTop"
        )
        == "16px"
    )
    assert (
        page.locator("#forge-element-one").evaluate(
            "element => getComputedStyle(element).gridRowEnd"
        )
        == "auto"
    )
    assert (
        page.locator("#forge-element-one").evaluate(
            "element => getComputedStyle(element).gridRowStart"
        )
        == "span 2"
    )
    nested = page.locator("#forge-element-two")
    assert (
        len(nested.evaluate("element => getComputedStyle(element).gridTemplateColumns.split(' ')"))
        == 1
    )
    frame.evaluate("element => element.style.width = '1100px'")
    assert (
        len(nested.evaluate("element => getComputedStyle(element).gridTemplateColumns.split(' ')"))
        == 2
    )
    # A narrow container overrides ratios regardless of viewport width.
    frame.evaluate("element => element.style.width = '350px'")
    assert (
        len(grid.evaluate("element => getComputedStyle(element).gridTemplateColumns.split(' ')"))
        == 1
    )
