from __future__ import annotations

from typing import Any

import pytest

from forgeui.expressions import EvaluationError, evaluate_expression, resolve_path
from forgeui.expressions.ast import Expression, ExpressionAdapter

NAMESPACES = {"data": {}, "state": {}, "item": {}, "event": {}}


def _literal(value: object) -> dict[str, object]:
    return {"kind": "literal", "value": value}


def _call(name: str, *values: object) -> Expression:
    return ExpressionAdapter.validate_python(
        {"kind": "call", "name": name, "args": [_literal(value) for value in values]}
    )


def _evaluate_call(name: str, values: tuple[Any, ...]) -> object:
    arguments: list[dict[str, object]] = []
    data: dict[str, object] = {}
    for index, value in enumerate(values):
        if isinstance(value, list | dict):
            key = f"value_{index}"
            data[key] = value
            arguments.append({"kind": "ref", "path": f"data.{key}"})
        else:
            arguments.append(_literal(value))
    expression = ExpressionAdapter.validate_python(
        {"kind": "call", "name": name, "args": arguments}
    )
    return evaluate_expression(expression, {**NAMESPACES, "data": data})


def _op(name: str, *values: object) -> Expression:
    return ExpressionAdapter.validate_python(
        {"kind": "op", "op": name, "args": [_literal(value) for value in values]}
    )


def _evaluate_op(name: str, values: tuple[Any, ...]) -> object:
    arguments: list[dict[str, object]] = []
    data: dict[str, object] = {}
    for index, value in enumerate(values):
        if isinstance(value, list | dict):
            key = f"value_{index}"
            data[key] = value
            arguments.append({"kind": "ref", "path": f"data.{key}"})
        else:
            arguments.append(_literal(value))
    expression = ExpressionAdapter.validate_python({"kind": "op", "op": name, "args": arguments})
    return evaluate_expression(expression, {**NAMESPACES, "data": data})


@pytest.mark.parametrize(
    ("name", "arguments", "expected"),
    [
        ("lower", ("EdGe",), "edge"),
        ("upper", ("edge",), "EDGE"),
        ("len", ("edge",), 4),
        ("length", ([1, 2],), 2),
        ("count", ({"one": 1},), 1),
        ("coalesce", (None, None, "ready"), "ready"),
        ("sum", ([1, 2, 3],), 6),
        ("avg", ([1, 2, 6],), 3),
        ("min", ([3, 1, 2],), 1),
        ("max", ([3, 1, 2],), 3),
        ("round", (3.14159, 2), 3.14),
        ("round", (3.6,), 4),
        ("abs", (-9,), 9),
        ("concat", ("edge", "-", "01"), "edge-01"),
        ("contains", ("edge-01", "ge-"), True),
        ("starts_with", ("edge-01", "edge"), True),
        ("ends_with", ("edge-01", "01"), True),
        ("number", (1234.5, 1), "1,234.5"),
        ("format_number", (1234,), "1,234"),
        ("percent", (0.126, 1), "12.6%"),
        ("format_percent", (0.5,), "50%"),
        ("bytes", (0,), "0.0 B"),
        ("bytes", (2048,), "2.0 KB"),
        ("duration", (30,), "30s"),
        ("duration", (120,), "2m"),
        ("duration", (7200,), "2h"),
        ("datetime", ("2026-07-24T12:00:00Z",), "2026-07-24T12:00:00+00:00"),
    ],
)
def test_allowlisted_calls(name: str, arguments: tuple[Any, ...], expected: object) -> None:
    assert _evaluate_call(name, arguments) == expected


@pytest.mark.parametrize(
    ("name", "arguments", "expected"),
    [
        ("not", (True,), False),
        ("if", (True, "yes", "no"), "yes"),
        ("if", (False, "yes", "no"), "no"),
        ("and", (True, 1, "yes"), True),
        ("or", (False, 0, "yes"), True),
        ("eq", (2, 2), True),
        ("ne", (2, 3), True),
        ("gt", (3, 2), True),
        ("gte", (3, 3), True),
        ("lt", (2, 3), True),
        ("lte", (3, 3), True),
        ("contains", ("edge", "edge-01"), True),
        ("in", ("edge", ["edge", "core"]), True),
        ("add", (7, 2), 9),
        ("sub", (7, 2), 5),
        ("mul", (7, 2), 14),
        ("div", (7, 2), 3.5),
        ("mod", (7, 2), 1),
    ],
)
def test_allowlisted_operators(name: str, arguments: tuple[Any, ...], expected: object) -> None:
    assert _evaluate_op(name, arguments) == expected


@pytest.mark.parametrize(
    ("expression", "message"),
    [
        (_call("lower", 1), "string"),
        (_call("len", 1), "string, list, or object"),
        (_call("sum", 1), "list of numbers"),
        (_call("round", 1.2, 7), "precision"),
        (_call("number", 1.2, -1), "precision"),
        (_call("percent", 0.1, 5), "precision"),
        (_call("bytes", -1), "non-negative"),
        (_call("duration", -1), "non-negative"),
        (_call("datetime", "not-a-date"), "ISO-8601"),
        (_call("abs", "one"), "numeric"),
        (_call("lower", "one", "two"), "expects"),
        (_op("mod", 1, 0), "modulo by zero"),
        (_op("add", True, 1), "numeric"),
        (_op("gt", 1, "one"), "not supported"),
    ],
)
def test_evaluation_failures_are_typed(expression: Expression, message: str) -> None:
    with pytest.raises(EvaluationError, match=message):
        evaluate_expression(expression, NAMESPACES)


@pytest.mark.parametrize(
    ("value", "message"),
    [
        ([], "non-empty"),
        ([1, True], "numeric"),
    ],
)
def test_numeric_collection_failures_are_typed(value: list[object], message: str) -> None:
    expression = ExpressionAdapter.validate_python(
        {"kind": "call", "name": "sum", "args": [{"kind": "ref", "path": "data.values"}]}
    )
    with pytest.raises(EvaluationError, match=message):
        evaluate_expression(expression, {**NAMESPACES, "data": {"values": value}})


def test_resolve_path_covers_lists_namespaces_and_non_json_traversal() -> None:
    assert resolve_path("data.rows.1", {"data": {"rows": ["zero", "one"]}}) == "one"
    with pytest.raises(EvaluationError, match="namespace"):
        resolve_path("missing.value", {"data": {}})
    with pytest.raises(EvaluationError, match="outside"):
        resolve_path("data.rows.2", {"data": {"rows": ["zero"]}})
    with pytest.raises(EvaluationError, match="does not address"):
        resolve_path("data.value.child", {"data": {"value": 1}})
