"""Pure, bounded evaluation for the ForgeUI expression AST."""

from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime
from typing import Any, cast

from forgeui.expressions.ast import (
    CallExpr,
    Expression,
    LiteralExpr,
    OpExpr,
    RefExpr,
    validate_expression_limits,
)


class EvaluationError(ValueError):
    """A safe evaluation failure; callers show it as a manifest diagnostic."""


def resolve_path(path: str, namespaces: Mapping[str, Any]) -> Any:
    """Resolve a dot path in a supplied namespace without object traversal tricks."""

    parts = path.split(".")
    if not parts or parts[0] not in namespaces:
        raise EvaluationError(f"unknown expression namespace: {parts[0] if parts else path}")
    current: Any = namespaces[parts[0]]
    for part in parts[1:]:
        if part.startswith("_") or part in {"__class__", "__dict__", "__mro__"}:
            raise EvaluationError("private paths are not allowed")
        if isinstance(current, Mapping):
            if part not in current:
                raise EvaluationError(f"unknown path: {path}")
            current = current[part]
        elif isinstance(current, list) and part.isdigit():
            index = int(part)
            if index >= len(current):
                raise EvaluationError(f"list index outside path: {path}")
            current = current[index]
        else:
            raise EvaluationError(f"path does not address JSON data: {path}")
    return current


def _number(value: Any) -> float | int:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise EvaluationError("operation requires numeric arguments")
    return cast(int | float, value)


def _string(value: Any, operation: str) -> str:
    if not isinstance(value, str):
        raise EvaluationError(f"{operation} requires string arguments")
    return value


def _collection(value: Any, operation: str) -> str | list[Any] | Mapping[str, Any]:
    if not isinstance(value, (str, list, Mapping)):
        raise EvaluationError(f"{operation} requires a string, list, or object")
    return value


def _numeric_list(value: Any, operation: str) -> list[float | int]:
    if not isinstance(value, list):
        raise EvaluationError(f"{operation} requires a list of numbers")
    return [_number(item) for item in value]


def _arity(name: str, values: list[Any], minimum: int, maximum: int | None = None) -> None:
    max_args = minimum if maximum is None else maximum
    if not minimum <= len(values) <= max_args:
        expected = str(minimum) if minimum == max_args else f"{minimum}..{max_args}"
        raise EvaluationError(f"{name} expects {expected} arguments")


def evaluate_expression(expression: Expression, namespaces: Mapping[str, Any]) -> Any:
    """Evaluate an AST against JSON-like namespaces, with no effects or callbacks."""

    validate_expression_limits(expression)

    def evaluate(node: Expression) -> Any:
        if isinstance(node, LiteralExpr):
            return node.value
        if isinstance(node, RefExpr):
            return resolve_path(node.path, namespaces)
        values = [evaluate(arg) for arg in node.args]
        if isinstance(node, CallExpr):
            if node.name == "lower":
                _arity(node.name, values, 1)
                return _string(values[0], node.name).lower()
            if node.name == "upper":
                _arity(node.name, values, 1)
                return _string(values[0], node.name).upper()
            if node.name in {"length", "len", "count"}:
                _arity(node.name, values, 1)
                return len(_collection(values[0], node.name))
            if node.name == "coalesce":
                _arity(node.name, values, 1, 8)
                return next((value for value in values if value is not None), None)
            if node.name in {"sum", "avg", "min", "max"}:
                _arity(node.name, values, 1)
                numbers = _numeric_list(values[0], node.name)
                if not numbers:
                    raise EvaluationError(f"{node.name} requires a non-empty list")
                if node.name == "sum":
                    return sum(numbers)
                if node.name == "avg":
                    return sum(numbers) / len(numbers)
                return min(numbers) if node.name == "min" else max(numbers)
            if node.name == "round":
                _arity(node.name, values, 1, 2)
                number = _number(values[0])
                digits = int(_number(values[1])) if len(values) == 2 else 0
                if not 0 <= digits <= 6:
                    raise EvaluationError("round precision must be 0..6")
                return round(number, digits)
            if node.name == "abs":
                _arity(node.name, values, 1)
                return abs(_number(values[0]))
            if node.name == "concat":
                _arity(node.name, values, 1, 8)
                return "".join(_string(value, node.name) for value in values)
            if node.name in {"contains", "starts_with", "ends_with"}:
                _arity(node.name, values, 2)
                subject = _string(values[0], node.name)
                search = _string(values[1], node.name)
                if node.name == "contains":
                    return search in subject
                return (
                    subject.startswith(search)
                    if node.name == "starts_with"
                    else subject.endswith(search)
                )
            if node.name in {"number", "format_number"}:
                _arity(node.name, values, 1, 2)
                number = _number(values[0])
                digits = int(_number(values[1])) if len(values) == 2 else 0
                if not 0 <= digits <= 6:
                    raise EvaluationError("number precision must be 0..6")
                return f"{number:,.{digits}f}"
            if node.name in {"percent", "format_percent"}:
                _arity(node.name, values, 1, 2)
                number = _number(values[0]) * 100
                digits = int(_number(values[1])) if len(values) == 2 else 0
                if not 0 <= digits <= 4:
                    raise EvaluationError("percent precision must be 0..4")
                return f"{number:.{digits}f}%"
            if node.name == "bytes":
                _arity(node.name, values, 1)
                amount = _number(values[0])
                if amount < 0:
                    raise EvaluationError("bytes requires a non-negative number")
                units = ("B", "KB", "MB", "GB", "TB")
                index = 0
                while amount >= 1024 and index < len(units) - 1:
                    amount /= 1024
                    index += 1
                return f"{amount:.1f} {units[index]}"
            if node.name == "duration":
                _arity(node.name, values, 1)
                seconds = _number(values[0])
                if seconds < 0:
                    raise EvaluationError("duration requires a non-negative number")
                if seconds < 60:
                    return f"{round(seconds)}s"
                if seconds < 3600:
                    return f"{round(seconds / 60)}m"
                return f"{round(seconds / 3600)}h"
            if node.name == "datetime":
                _arity(node.name, values, 1)
                timestamp = _string(values[0], node.name)
                try:
                    return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).isoformat()
                except ValueError as exc:
                    raise EvaluationError("datetime requires an ISO-8601 timestamp") from exc
        if not isinstance(node, OpExpr):
            raise EvaluationError("unsupported expression node")
        if node.op == "not":
            _arity(node.op, values, 1)
            return not bool(values[0])
        if node.op == "if":
            _arity(node.op, values, 3)
            return values[1] if bool(values[0]) else values[2]
        if node.op in {"and", "or"}:
            _arity(node.op, values, 2, 8)
            return (
                all(bool(value) for value in values)
                if node.op == "and"
                else any(bool(value) for value in values)
            )
        _arity(node.op, values, 2)
        left, right = values
        if node.op == "eq":
            return left == right
        if node.op == "ne":
            return left != right
        if node.op == "gt":
            return left > right
        if node.op == "gte":
            return left >= right
        if node.op == "lt":
            return left < right
        if node.op == "lte":
            return left <= right
        if node.op in {"contains", "in"}:
            return left in right
        left_number, right_number = _number(left), _number(right)
        if node.op == "add":
            return left_number + right_number
        if node.op == "sub":
            return left_number - right_number
        if node.op == "mul":
            return left_number * right_number
        if node.op == "div":
            if right_number == 0:
                raise EvaluationError("division by zero")
            return left_number / right_number
        if node.op == "mod":
            if right_number == 0:
                raise EvaluationError("modulo by zero")
            return left_number % right_number
        raise EvaluationError(f"unsupported operator: {node.op}")

    try:
        return evaluate(expression)
    except (TypeError, ValueError) as exc:
        if isinstance(exc, EvaluationError):
            raise
        raise EvaluationError(str(exc)) from exc
