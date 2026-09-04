"""Bounded, renderer-neutral filtering and KPI calculations; no query language."""

from __future__ import annotations

import math
from collections.abc import Mapping
from typing import Any, TypeGuard


def filter_rows(rows: list[Any], props: Mapping[str, Any], state: Mapping[str, Any]) -> list[Any]:
    """AND filters. Empty selections disable a filter; false and zero remain meaningful."""
    rules = list(props.get("filters", []))
    if props.get("filter_state") and props.get("filter_key"):
        rules.append(
            {"key": props["filter_key"], "state_path": props["filter_state"], "operator": "eq"}
        )
    for rule in rules:
        selected = state.get(rule["state_path"].split(".", 1)[1])
        if selected is None or selected == "" or selected == "all" or selected == []:
            continue
        rows = [
            row
            for row in rows
            if isinstance(row, Mapping)
            and _matches(row.get(rule["key"]), selected, rule.get("operator", "eq"))
        ]
    return rows


def _matches(value: object, selected: object, operator: str) -> bool:
    if operator == "contains":
        return (
            isinstance(value, str)
            and isinstance(selected, str)
            and (selected.casefold() in value.casefold())
        )
    if operator == "in":
        return isinstance(selected, list) and any(_matches(value, item, "eq") for item in selected)
    if operator in {"gte", "lte"}:
        if not _number(value) or not _number(selected):
            return False
        return (
            float(value) >= float(selected)
            if operator == "gte"
            else float(value) <= float(selected)
        )
    return (type(value) is type(selected) and value == selected) or (
        _number(value) and _number(selected) and value == selected
    )


def _number(value: object) -> TypeGuard[int | float]:
    try:
        return (
            isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)
        )
    except OverflowError:
        return False


def aggregate(rows: list[Any], operation: str, key: str | None) -> int | float | None:
    """Ignore missing/non-finite values. Empty numeric sets have no value, not a fake zero."""
    if operation == "count":
        return len(rows)
    values = [row.get(key) for row in rows if isinstance(row, Mapping)]
    numbers = [value for value in values if _number(value)]
    if not numbers:
        return None
    result: int | float
    if operation == "sum":
        result = sum(numbers)
    elif operation == "mean":
        result = sum(value / len(numbers) for value in numbers)
    elif operation == "min":
        result = min(numbers)
    elif operation == "max":
        result = max(numbers)
    else:
        raise ValueError("unsupported aggregate")
    return result if _number(result) else None
