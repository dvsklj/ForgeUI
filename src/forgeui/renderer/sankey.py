"""Deterministic Sankey layout with one quantity scale and escaped SVG annotations.

The graph is small and acyclic by contract. Longest-path layers make every link
advance left to right; declaration order breaks ties. No external renderer runs.
"""

from __future__ import annotations

from collections.abc import Mapping
from graphlib import TopologicalSorter
from typing import Any
from uuid import uuid4

from markupsafe import escape

from forgeui.catalog.registry import SankeyProps


def _quantity(value: float) -> str:
    """Keep very small flows visible in annotations without changing their widths."""
    if value and abs(value) < 0.001:
        return f"{value:.6g}"
    return f"{value:,.6f}".rstrip("0").rstrip(".")


def sankey_extra(props: Mapping[str, Any]) -> dict[str, Any]:
    """Revalidate resolved values before geometry; failures remain component-local."""
    graph = SankeyProps.model_validate(dict(props))
    values: list[float] = []
    for link in graph.links:
        if not isinstance(link.value, int | float) or isinstance(link.value, bool):
            raise ValueError("Sankey link values must resolve to finite non-negative numbers")
        values.append(float(link.value))
    incoming = dict.fromkeys((node.id for node in graph.nodes), 0.0)
    outgoing = incoming.copy()
    predecessors: dict[str, set[str]] = {node.id: set() for node in graph.nodes}
    for link, value in zip(graph.links, values, strict=True):
        outgoing[link.source] += value
        incoming[link.target] += value
        predecessors[link.target].add(link.source)
    order = tuple(TopologicalSorter(predecessors).static_order())
    depth: dict[str, int] = {}
    for node_id in order:
        depth[node_id] = max((depth[parent] + 1 for parent in predecessors[node_id]), default=0)
    last_layer = max(depth.values())
    # Align connected sinks; leave truly isolated nodes in the first column.
    sources = {link.source for link in graph.links}
    for node_id in order:
        if node_id not in sources and predecessors[node_id]:
            depth[node_id] = last_layer
    layers = [[node for node in graph.nodes if depth[node.id] == d] for d in range(last_layer + 1)]
    capacity = {node_id: max(incoming[node_id], outgoing[node_id]) for node_id in order}
    peak = max(capacity.values()) or 1.0
    normalized = {node_id: value / peak for node_id, value in capacity.items()}
    largest_layer = max(sum(normalized[node.id] for node in layer) for layer in layers)
    scale = 176 / largest_layer if largest_layer else 0.0
    gap, top, node_width, step = 44, 32, 18, 300
    height = max(280, 212 + max(len(layer) for layer in layers) * gap)
    width = max(640, last_layer * step + 260)
    positions: dict[str, tuple[float, float]] = {}
    for index, layer in enumerate(layers):
        used = sum(normalized[node.id] * scale for node in layer) + (len(layer) - 1) * gap
        y = top + (height - top - 30 - used) / 2
        for node in layer:
            positions[node.id] = (30 + index * step, y)
            y += normalized[node.id] * scale + gap

    labels = {node.id: node.label for node in graph.nodes}
    colors = {node.id: index % 6 + 1 for index, node in enumerate(graph.nodes)}
    parts = [
        f'<svg class="forge-sankey-svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="group" aria-label="{escape(graph.title)}">',
        f"<title>{escape(graph.title)}</title>",
        "<desc>Flows run left to right. Ribbon widths share a common quantity scale. "
        "Exact values and annotations are available in Flow data.</desc>",
    ]
    source_offset = dict.fromkeys(order, 0.0)
    target_offset = source_offset.copy()
    # Fragments can be repeated or composed by a host; paint IDs must not collide.
    paint_namespace = f"forge-sankey-{uuid4().hex}"
    link_rows = []
    for index, (link, value) in enumerate(zip(graph.links, values, strict=True)):
        value_label = f"{_quantity(value)} {graph.unit}"
        annotation = f"{labels[link.source]} → {labels[link.target]}: {value_label}"
        if link.label:
            annotation += f" · {link.label}"
        link_rows.append(
            {
                "source": labels[link.source],
                "target": labels[link.target],
                "value": value_label,
                "label": link.label or "—",
            }
        )
        if not value:
            continue
        thickness = (value / peak) * scale
        x1, y1 = positions[link.source]
        x2, y2 = positions[link.target]
        x1 += node_width
        y1 += source_offset[link.source]
        y2 += target_offset[link.target]
        source_offset[link.source] += thickness
        target_offset[link.target] += thickness
        mid = (x1 + x2) / 2
        path = (
            f"M {x1} {y1} C {mid} {y1} {mid} {y2} {x2} {y2} "
            f"L {x2} {y2 + thickness} C {mid} {y2 + thickness} "
            f"{mid} {y1 + thickness} {x1} {y1 + thickness} Z"
        )
        gradient_id = f"{paint_namespace}-{index}"
        parts.append(
            f'<defs><linearGradient id="{gradient_id}" gradientUnits="userSpaceOnUse" '
            f'x1="{x1}" y1="0" x2="{x2}" y2="0" color-interpolation="sRGB">'
            f'<stop offset="0" class="forge-chart-series--{colors[link.source]}" '
            'stop-color="currentColor" stop-opacity="0.16"/>'
            f'<stop offset="1" class="forge-chart-series--{colors[link.target]}" '
            'stop-color="currentColor" stop-opacity="0.32"/></linearGradient></defs>'
            f'<path class="forge-sankey-link forge-chart-series--{colors[link.source]}" '
            f'd="{path}" fill="url(#{gradient_id})" tabindex="0" role="img" '
            f'aria-label="{escape(annotation)}" data-forge-chart-point '
            f'data-forge-chart-label="{escape(annotation)}">'
            f"<title>{escape(annotation)}</title></path>"
        )
    node_rows = []
    for node in graph.nodes:
        x, y = positions[node.id]
        total = capacity[node.id]
        inbound, outbound = incoming[node.id], outgoing[node.id]
        annotation = (
            f"{node.label}: inflow {_quantity(inbound)} {graph.unit}; "
            f"outflow {_quantity(outbound)} {graph.unit}"
        )
        node_rows.append(
            {
                "label": node.label,
                "incoming": _quantity(inbound),
                "outgoing": _quantity(outbound),
                "balance": _quantity(inbound - outbound),
            }
        )
        shown = node.label if len(node.label) <= 25 else node.label[:24] + "…"
        parts.append(
            f'<g class="forge-sankey-node forge-chart-series--{colors[node.id]}" '
            f'tabindex="0" role="img" aria-label="{escape(annotation)}" '
            f'data-forge-chart-point data-forge-chart-label="{escape(annotation)}">'
            f"<title>{escape(annotation)}</title>"
            f'<rect x="{x}" y="{y}" width="{node_width}" height="{normalized[node.id] * scale}" '
            'rx="3" fill="currentColor"/>'
            f'<text class="forge-sankey-label" x="{x}" y="{y - 26}">{escape(shown)}</text>'
            f'<text class="forge-sankey-value" x="{x}" y="{y - 9}">'
            f"{escape(_quantity(total))}</text></g>"
        )
    parts.append("</svg>")
    return {
        "svg": "".join(parts),
        "links": link_rows,
        "nodes": node_rows,
        "has_flow": any(values),
    }
