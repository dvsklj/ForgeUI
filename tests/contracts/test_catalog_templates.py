from __future__ import annotations

from pathlib import Path

from forgeui.catalog import component_registry
from forgeui.renderer import Renderer


def test_each_catalog_template_is_present_and_compilable() -> None:
    template_root = Path(__file__).resolve().parents[2] / "src" / "forgeui" / "web" / "templates"
    renderer = Renderer(template_root)
    for component_type in component_registry.names:
        template = component_registry.get(component_type).template
        assert (template_root / template).is_file()
        renderer.environment.get_template(template)


def test_default_styles_preserve_the_forgeui_visual_contract() -> None:
    stylesheet = (
        Path(__file__).resolve().parents[2] / "src" / "forgeui" / "web" / "static" / "forgeui.css"
    ).read_text()

    assert "--accent: #0b6b65;" in stylesheet
    assert "--accent-hover: #085954;" in stylesheet
    assert "--raised: #f4f7f6;" in stylesheet
    assert "--radius: 8px;" in stylesheet
    assert "system-ui" in stylesheet
    assert "--shell: #17201f;" in stylesheet
    assert "Instrument Sans" not in stylesheet
    assert "oklch(" not in stylesheet
    assert "linear-gradient" not in stylesheet
    assert "radial-gradient" not in stylesheet


def test_dashboard_spacing_has_consistent_breathing_room() -> None:
    stylesheet = (
        Path(__file__).resolve().parents[2] / "src" / "forgeui" / "web" / "static" / "forgeui.css"
    ).read_text()

    assert "--space-fluid-lg: clamp(24px, 2vw, 36px);" in stylesheet
    assert "--panel-padding: clamp(20px, 1.6vw, 24px);" in stylesheet
    assert ".forge-repeat {\n  display: grid;\n  gap: var(--space-lg);" in stylesheet
    assert ".forge-page {\n  display: grid;\n  gap: var(--space-fluid-lg);" in stylesheet
    assert ".forge-card {\n  display: grid;\n  gap: var(--space-md);" in stylesheet
    assert '[data-forge-surface="mobile"] .forge-grid--4' in stylesheet
    assert '[data-forge-surface="chat"] .forge-button' in stylesheet
    assert '[data-forge-surface="embed"] .forge-page' in stylesheet
    assert ".forge-grid:has(> .forge-metric)" in stylesheet
    assert "border-top: 3px solid" not in stylesheet


def test_self_hosted_pagination_parses_only_the_current_page_number() -> None:
    javascript = (
        Path(__file__).resolve().parents[2] / "src" / "forgeui" / "web" / "static" / "forgeui.js"
    ).read_text()

    assert r"pageLabel.match(/Page\s+(\d+)\s+of\s+\d+/i)?.[1]" in javascript
    assert r"replace(/\D+/g, \"\")" not in javascript


def test_shell_versions_local_assets_for_safe_cache_invalidation() -> None:
    template = (
        Path(__file__).resolve().parents[2] / "src" / "forgeui" / "web" / "templates" / "base.html"
    ).read_text()

    assert "forgeui.css?v={{ asset_version }}" in template
    assert "forgeui.js?v={{ asset_version }}" in template

    javascript = (
        Path(__file__).resolve().parents[2] / "src" / "forgeui" / "web" / "static" / "forgeui.js"
    ).read_text()
    assert "data-forge-persistence" in template
    assert "body.state = stateSnapshot();" in javascript


def test_shell_iconography_uses_compact_heroicons() -> None:
    root = Path(__file__).resolve().parents[2]
    template = (root / "src" / "forgeui" / "web" / "templates" / "base.html").read_text()
    stylesheet = (root / "src" / "forgeui" / "web" / "static" / "forgeui.css").read_text()
    notices = (root / "THIRD_PARTY_NOTICES.md").read_text()

    assert "{{ theme_icons.light }}" in template
    assert "{{ theme_icons.system }}" in template
    assert "{{ theme_icons.dark }}" in template
    assert ".forge-theme-icon {\n  width: 18px;\n  height: 18px;" in stylesheet
    assert "Heroicons" in notices
    assert "Tailwind Labs" in notices
