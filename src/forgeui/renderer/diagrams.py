"""Dependency-free flowchart SVG with an accessible connection table in the template."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from markupsafe import escape


def diagram_svg(
    nodes: list[Mapping[str, Any]], edges: list[Mapping[str, Any]], direction: str, title: str
) -> str:
    """Bounded lane layout tolerates cycles, disconnected graphs, and self edges."""
    horizontal = direction in {"LR", "RL"}
    ordered = list(reversed(nodes)) if direction in {"BT", "RL"} else nodes
    positions = {
        node["id"]: ((130 + index * 230, 100) if horizontal else (170, 60 + index * 110))
        for index, node in enumerate(ordered)
    }
    width = max(300, len(nodes) * 230 + 60) if horizontal else 520
    height = 300 if horizontal else max(150, len(nodes) * 110 + 30)
    parts = [
        f'<svg class="forge-diagram-svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}" role="img" aria-label="{escape(title)}">'
    ]
    for index, edge in enumerate(edges):
        x1, y1 = positions[edge["source"]]
        x2, y2 = positions[edge["target"]]
        lane = 35 + (index % 6) * 15
        if horizontal:
            path = (
                f"M {x1} {y1 + 25} C {x1} {y1 + 100 + lane} {x2} {y2 + 100 + lane} {x2} {y2 + 25}"
            )
            arrow = f"M {x2 - 5} {y2 + 33} L {x2} {y2 + 25} L {x2 + 5} {y2 + 33}"
        else:
            path = (
                f"M {x1 + 100} {y1} C {x1 + 160 + lane} {y1} {x2 + 160 + lane} {y2} {x2 + 100} {y2}"
            )
            arrow = f"M {x2 + 108} {y2 - 5} L {x2 + 100} {y2} L {x2 + 108} {y2 + 5}"
        if edge["source"] == edge["target"]:
            path = (
                f"M {x1 + 75} {y1 - 25} C {x1 + 170} {y1 - 65} {x1 + 170} {y1 + 65} {x1 + 100} {y1}"
            )
            arrow = f"M {x1 + 108} {y1 - 5} L {x1 + 100} {y1} L {x1 + 108} {y1 + 5}"
        parts.append(
            f'<path stroke="currentColor" fill="none" stroke-width="1.5" d="{path}"><title>'
            f"{escape(edge.get('label') or 'Connection')}</title></path>"
            f'<path stroke="currentColor" fill="none" stroke-width="1.5" d="{arrow}"/>'
        )
    for node in ordered:
        x, y = positions[node["id"]]
        label = str(node["label"])
        shown = label if len(label) <= 24 else label[:23] + "…"
        parts.append(
            f'<g><title>{escape(label)}</title><rect fill="Canvas" stroke="currentColor" '
            f'x="{x - 100}" y="{y - 25}" width="200" height="50" rx="8"/>'
            f'<text fill="currentColor" font-size="14" x="{x}" y="{y + 5}" '
            f'text-anchor="middle">{escape(shown)}</text></g>'
        )
    parts.append("</svg>")
    return "".join(parts)
