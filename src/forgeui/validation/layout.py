"""Static layout diagnostics without evaluating host data or changing a manifest."""

from __future__ import annotations

from typing import TYPE_CHECKING

from forgeui.domain.models import ForgeManifest
from forgeui.expressions.ast import LiteralExpr

if TYPE_CHECKING:
    from forgeui.validation.validator import ValidationIssue

_SLOTS = ("card-header", "card-body", "card-footer")
_CONTAINERS = {
    "page",
    "container",
    "stack",
    "inline",
    "grid",
    "grid-item",
    "card",
    "section",
    "content-group",
    "disclosure",
    *_SLOTS,
}


def validate_layout(manifest: ForgeManifest, issues: list[ValidationIssue]) -> None:
    # Local import keeps diagnostics separate from validator policy and graph traversal.
    from forgeui.validation.validator import ValidationIssue

    parents: dict[str, list[str]] = {key: [] for key in manifest.elements}
    for key, element in manifest.elements.items():
        for child in element.children:
            parents[child].append(key)

    for key, element in manifest.elements.items():
        path = f"$.elements.{key}"
        if element.type in {*_SLOTS, "grid-item"}:
            required = "grid" if element.type == "grid-item" else "card"
            if not parents[key] or any(
                manifest.elements[parent].type != required for parent in parents[key]
            ):
                issues.append(
                    ValidationIssue(
                        "layout_parent",
                        path,
                        f"Place {element.type} directly inside a {required}; "
                        "use stack for general grouping.",
                    )
                )
        if element.type == "grid" and element.props["columns"] == "auto":
            for child in element.children:
                item = manifest.elements[child]
                if item.type == "grid-item" and item.props["column_span"] != 1:
                    issues.append(
                        ValidationIssue(
                            "auto_grid_span",
                            f"$.elements.{child}.props.column_span",
                            "Auto grids require column_span 1. "
                            "Use numeric or responsive columns for wider items.",
                        )
                    )
        if element.type == "card":
            types = [manifest.elements[child].type for child in element.children]
            slots = [kind for kind in types if kind in _SLOTS]
            if slots and (
                len(slots) != len(types)
                or len(set(slots)) != len(slots)
                or "card-body" not in slots
                or slots != sorted(slots, key=_SLOTS.index)
            ):
                issues.append(
                    ValidationIssue(
                        "card_slots",
                        f"{path}.children",
                        "Use optional card-header, one card-body, optional card-footer, "
                        "in that order. Move ordinary children into card-body; "
                        "do not mix slots and loose children.",
                    )
                )
        if element.type == "content-group" and len(element.children) != 1:
            issues.append(
                ValidationIssue(
                    "content_group_child",
                    f"{path}.children",
                    "Attach description/caption to exactly one child; "
                    "use a stack child to annotate a group.",
                )
            )

    # Only report provably empty content. Unknown expressions and data-driven collections may
    # produce content later; evaluating initial state here would create misleading diagnostics.
    memo: dict[str, bool] = {}

    def could_have_content(key: str) -> bool:
        if key in memo:
            return memo[key]
        element = manifest.elements[key]
        if isinstance(element.visible, LiteralExpr) and not element.visible.value:
            result = False
        elif element.type in _CONTAINERS:
            result = any(could_have_content(child) for child in element.children)
            if element.type == "content-group":
                result = result or bool(
                    element.props.get("description") or element.props.get("caption")
                )
        elif element.type == "divider":
            result = False
        elif element.type == "icon":
            result = bool(element.props.get("label"))
        elif element.type in {"heading", "text"}:
            text = element.props.get("text")
            result = bool(text.strip()) if isinstance(text, str) else True
        else:
            result = True
        memo[key] = result
        return result

    for key, element in manifest.elements.items():
        if element.type not in _CONTAINERS:
            continue
        if isinstance(element.visible, LiteralExpr) and not element.visible.value:
            continue
        if not could_have_content(key):
            issues.append(
                ValidationIssue(
                    "empty_layout",
                    f"$.elements.{key}.children",
                    f"{element.type} has no potentially visible content. "
                    "Add meaningful content or an empty-state component, or remove this "
                    "decorative wrapper. Titles and dividers alone "
                    "do not fill a content container.",
                    severity="warning",
                )
            )
