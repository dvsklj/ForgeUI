from __future__ import annotations

import pytest

from forgeui.icons import render_heroicon


@pytest.mark.parametrize(
    "name",
    [
        "activity",
        "alert",
        "check",
        "chevron-right",
        "cpu",
        "device",
        "disk",
        "memory",
        "search",
        "warning",
        "light",
        "system",
        "dark",
        "close",
    ],
)
def test_heroicons_render_from_the_trusted_semantic_allowlist(name: str) -> None:
    output = str(render_heroicon(name))
    assert output.startswith('<svg class="forge-icon"')
    assert 'viewBox="0 0 24 24"' in output
    assert 'stroke-width="1.5"' in output
    assert "<path d=" in output
    assert name not in output


def test_unknown_icon_names_cannot_inject_markup() -> None:
    output = str(render_heroicon('"></svg><script>alert(1)</script>'))
    assert "<script" not in output
    assert "</svg><" not in output
    assert "M9.348 14.652" in output
