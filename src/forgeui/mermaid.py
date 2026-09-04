"""Safe flowchart interchange. Mermaid source never enters a persisted manifest.

Supports node declarations and directed edges, with optional labels. Arbitrary Mermaid
styles, directives, callbacks, HTML, and other diagram languages are deliberately rejected.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from forgeui.catalog.registry import DiagramProps


@dataclass(frozen=True, slots=True)
class MermaidImport:
    diagram: DiagramProps
    corrections: tuple[str, ...] = ()


class MermaidImportError(ValueError):
    """A bounded import failure with the offending statement number."""

    def __init__(self, line: int, message: str) -> None:
        self.line = line
        self.code = "unsupported_mermaid"
        super().__init__(f"statement {line}: {message}")


def import_mermaid(source: str, *, title: str = "Flow diagram") -> MermaidImport:
    """Correct only fenced wrappers, graph headers, and TD direction aliases.

    Node IDs are deterministically mapped to safe IDs; labels retain their text.
    Unsupported input is never silently dropped or sent to an executable renderer.
    """
    if len(source.encode()) > 32_768:
        raise MermaidImportError(0, "source exceeds 32 KiB")
    corrections: list[str] = []
    source = source.strip()
    if source.startswith("```mermaid\n") and source.endswith("```"):
        source = source[11:-3].strip()
        corrections.append("removed Mermaid code fence")
    statements = []
    current = ""
    bracket = False
    edge_label = False
    for char in source:
        if char == "[":
            bracket = True
        elif char == "]":
            bracket = False
        elif char == "|" and not bracket:
            edge_label = not edge_label
        if char == "\n" or (char == ";" and not bracket and not edge_label):
            if current.strip():
                statements.append(current.strip())
            current = ""
        else:
            current += char
    if current.strip():
        statements.append(current.strip())

    def decode(value: str) -> str:
        def entity(match: re.Match[str]) -> str:
            number = int(match[1])
            if number > 0x10FFFF or 0xD800 <= number <= 0xDFFF:
                raise MermaidImportError(0, "invalid label character")
            return chr(number)

        return re.sub(r"#([0-9]{1,7});", entity, value)

    if not statements:
        raise MermaidImportError(0, "missing flowchart header")
    header = re.fullmatch(r"(flowchart|graph)\s+(TD|TB|BT|LR|RL)", statements[0])
    if not header:
        raise MermaidImportError(1, "expected flowchart TB, BT, LR, or RL")
    direction = header[2]
    if direction == "TD":
        direction = "TB"
        corrections.append("normalized TD to TB")
    if header[1] == "graph":
        corrections.append("normalized graph to flowchart")
    nodes: dict[str, dict[str, str]] = {}
    edges: list[dict[str, str]] = []

    def node(raw: str, line: int) -> str:
        match = re.fullmatch(
            r'([A-Za-z][A-Za-z0-9_]*)(?:\[(?:"([^"\[\]]+)"|([^"\[\]]+))\])?', raw.strip()
        )
        if not match:
            raise MermaidImportError(line, "expected ID or ID[plain label]")
        original = match[1]
        label = decode(match[2] or match[3] or "")
        if original not in nodes:
            nodes[original] = {"id": f"node_{len(nodes)}", "label": label or original}
        elif label:
            nodes[original]["label"] = label
        return nodes[original]["id"]

    for index, statement in enumerate(statements[1:], 2):
        if "-->" in statement:
            parts = statement.split("-->")
            if len(parts) != 2:
                raise MermaidImportError(index, "use one directed edge per statement")
            left, right = parts
            label_match = re.match(r"^\s*\|([^|]+)\|\s*(.+)$", right)
            edge = {
                "source": node(left, index),
                "target": node(label_match[2] if label_match else right, index),
            }
            if label_match:
                edge["label"] = decode(label_match[1].strip('"'))
            edges.append(edge)
        else:
            node(statement, index)
        if len(nodes) > 40 or len(edges) > 80:
            raise MermaidImportError(index, "diagram exceeds 40 nodes or 80 edges")
    try:
        diagram = DiagramProps.model_validate(
            {"title": title, "direction": direction, "nodes": list(nodes.values()), "edges": edges}
        )
    except ValueError as exc:
        raise MermaidImportError(0, str(exc)) from exc
    return MermaidImport(diagram, tuple(corrections))


def export_mermaid(diagram: DiagramProps) -> str:
    """Generate flowchart syntax with generated IDs and encoded display labels."""
    diagram = DiagramProps.model_validate(diagram.model_dump())
    ids = {node.id: f"n{index}" for index, node in enumerate(diagram.nodes)}

    def label(value: str) -> str:
        # Mermaid decimal entities avoid structural punctuation and keyword ambiguity.
        return "".join(
            character if character.isalnum() or character == " " else f"#{ord(character)};"
            for character in value
        )

    lines = [f"flowchart {diagram.direction}"]
    lines.extend(f'{ids[node.id]}["{label(node.label)}"]' for node in diagram.nodes)
    for edge in diagram.edges:
        text = f'|"{label(edge.label)}"|' if edge.label else ""
        lines.append(f"{ids[edge.source]} -->{text} {ids[edge.target]}")
    return "\n".join(lines)
