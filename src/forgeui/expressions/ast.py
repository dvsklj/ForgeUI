"""The deliberately small JSON expression language used by ForgeUI manifests."""

from __future__ import annotations

from typing import Annotated, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, field_validator

MAX_EXPRESSION_DEPTH = 8
MAX_EXPRESSION_NODES = 64


class ExpressionModel(BaseModel):
    """Base class for JSON-only expression nodes."""

    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)


class LiteralExpr(ExpressionModel):
    kind: Literal["literal"]
    value: str | int | float | bool | None


class RefExpr(ExpressionModel):
    kind: Literal["ref"]
    path: Annotated[
        str,
        Field(
            min_length=1,
            max_length=160,
            pattern=r"^(data|state|item|event)(\.[A-Za-z_][A-Za-z0-9_]*)*$",
        ),
    ]

    @field_validator("path")
    @classmethod
    def reject_private_path_segments(cls, value: str) -> str:
        if any(part.startswith("_") for part in value.split(".")):
            raise ValueError("expression paths cannot contain private segments")
        return value


class CallExpr(ExpressionModel):
    kind: Literal["call"]
    name: Literal[
        "coalesce",
        "len",
        "length",
        "count",
        "sum",
        "avg",
        "min",
        "max",
        "round",
        "abs",
        "concat",
        "lower",
        "upper",
        "contains",
        "starts_with",
        "ends_with",
        "number",
        "percent",
        "bytes",
        "duration",
        "datetime",
        "format_number",
        "format_percent",
    ]
    args: list[Expression]


class OpExpr(ExpressionModel):
    kind: Literal["op"]
    op: Literal[
        "eq",
        "ne",
        "gt",
        "gte",
        "lt",
        "lte",
        "and",
        "or",
        "not",
        "add",
        "sub",
        "mul",
        "div",
        "mod",
        "contains",
        "in",
        "if",
    ]
    args: list[Expression]


Expression: TypeAlias = Annotated[
    LiteralExpr | RefExpr | CallExpr | OpExpr,
    Field(discriminator="kind"),
]
ExpressionAdapter: TypeAdapter[Expression] = TypeAdapter(Expression)


def expression_metrics(expression: Expression) -> tuple[int, int]:
    """Return ``(depth, node_count)`` for an expression AST."""

    def visit(node: Expression) -> tuple[int, int]:
        children = node.args if isinstance(node, (CallExpr, OpExpr)) else []
        if not children:
            return 1, 1
        child_metrics = [visit(child) for child in children]
        return 1 + max(depth for depth, _ in child_metrics), 1 + sum(
            count for _, count in child_metrics
        )

    return visit(expression)


def validate_expression_limits(expression: Expression) -> None:
    """Raise when an expression exceeds the fixed complexity budget."""

    depth, nodes = expression_metrics(expression)
    if depth > MAX_EXPRESSION_DEPTH:
        raise ValueError(f"expression depth {depth} exceeds {MAX_EXPRESSION_DEPTH}")
    if nodes > MAX_EXPRESSION_NODES:
        raise ValueError(f"expression nodes {nodes} exceeds {MAX_EXPRESSION_NODES}")
