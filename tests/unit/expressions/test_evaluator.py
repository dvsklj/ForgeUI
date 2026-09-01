from __future__ import annotations

import pytest
from hypothesis import given
from hypothesis import strategies as st

from forgeui.expressions import EvaluationError, evaluate_expression, resolve_path
from forgeui.expressions.ast import ExpressionAdapter, expression_metrics


def test_evaluates_pure_math_and_formatting() -> None:
    expression = ExpressionAdapter.validate_python(
        {
            "kind": "call",
            "name": "format_percent",
            "args": [
                {
                    "kind": "op",
                    "op": "div",
                    "args": [{"kind": "literal", "value": 1}, {"kind": "literal", "value": 4}],
                }
            ],
        }
    )
    assert (
        evaluate_expression(expression, {"data": {}, "state": {}, "item": {}, "event": {}}) == "25%"
    )


def test_path_resolution_does_not_traverse_objects() -> None:
    assert resolve_path("data.device.name", {"data": {"device": {"name": "edge"}}}) == "edge"
    with pytest.raises(EvaluationError, match="private"):
        resolve_path("data.__class__", {"data": {}})
    with pytest.raises(EvaluationError, match="unknown path"):
        resolve_path("data.missing", {"data": {}})


def test_type_and_division_errors_are_safe() -> None:
    divide = ExpressionAdapter.validate_python(
        {
            "kind": "op",
            "op": "div",
            "args": [{"kind": "literal", "value": 1}, {"kind": "literal", "value": 0}],
        }
    )
    with pytest.raises(EvaluationError, match="division by zero"):
        evaluate_expression(divide, {"data": {}, "state": {}, "item": {}, "event": {}})


def test_extended_allowlisted_calls_and_modulo() -> None:
    average = ExpressionAdapter.validate_python(
        {"kind": "call", "name": "avg", "args": [{"kind": "ref", "path": "data.values"}]}
    )
    percent = ExpressionAdapter.validate_python(
        {
            "kind": "call",
            "name": "percent",
            "args": [{"kind": "literal", "value": 0.25}],
        }
    )
    modulo = ExpressionAdapter.validate_python(
        {
            "kind": "op",
            "op": "mod",
            "args": [{"kind": "literal", "value": 7}, {"kind": "literal", "value": 4}],
        }
    )
    namespaces = {"data": {"values": [1, 2, 3]}, "state": {}, "item": {}, "event": {}}
    assert evaluate_expression(average, namespaces) == 2
    assert evaluate_expression(percent, namespaces) == "25%"
    assert evaluate_expression(modulo, namespaces) == 3


@pytest.mark.parametrize(
    ("name", "subject", "search"),
    [
        ("contains", "edge-device-42", "device"),
        ("starts_with", "edge-device-42", "edge"),
        ("ends_with", "edge-device-42", "42"),
    ],
)
def test_string_predicates_use_subject_then_search(name: str, subject: str, search: str) -> None:
    expression = ExpressionAdapter.validate_python(
        {
            "kind": "call",
            "name": name,
            "args": [
                {"kind": "literal", "value": subject},
                {"kind": "literal", "value": search},
            ],
        }
    )
    assert evaluate_expression(expression, {"data": {}, "state": {}, "item": {}, "event": {}})


@given(
    st.integers(min_value=-10_000, max_value=10_000),
    st.integers(min_value=-10_000, max_value=10_000),
)
def test_addition_is_pure_for_numbers(left: int, right: int) -> None:
    expression = ExpressionAdapter.validate_python(
        {
            "kind": "op",
            "op": "add",
            "args": [{"kind": "literal", "value": left}, {"kind": "literal", "value": right}],
        }
    )
    assert (
        evaluate_expression(expression, {"data": {}, "state": {}, "item": {}, "event": {}})
        == left + right
    )
    assert expression_metrics(expression) == (2, 3)
