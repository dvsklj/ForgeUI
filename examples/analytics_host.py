"""Generic sales analytics with an authorized, host-provided data source.

This synthetic example demonstrates typed contracts and an injectable provider.
The host supplies its identity middleware, provider and deployment settings.
"""

from __future__ import annotations

from collections.abc import Callable

from pydantic import BaseModel, ConfigDict, Field

from forgeui.runtime import RuntimeRegistries
from forgeui.services import CapabilityRegistry
from forgeui.sources import DataContractRegistry, DataSourceRegistry, SourceContext


class SalesRow(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    region: str = Field(max_length=32)
    period: str = Field(max_length=32)
    revenue: float = Field(ge=0, allow_inf_nan=False)
    orders: int = Field(ge=0)


class SalesSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    title: str = Field(max_length=120)
    as_of: str = Field(max_length=80)
    scope: str = Field(max_length=240)
    revenue: float = Field(ge=0, allow_inf_nan=False)
    previous_revenue: float = Field(ge=0, allow_inf_nan=False)
    orders: int = Field(ge=0)
    rows: list[SalesRow] = Field(max_length=100)


DEMO_SNAPSHOT = {
    "title": "Sales performance · synthetic demo",
    "as_of": "2026-09-01T12:00:00Z",
    "scope": "CHF · August 2026 · all permitted regions · provider totals",
    "revenue": 185000.0,
    "previous_revenue": 162000.0,
    "orders": 740,
    "rows": [
        {"region": "emea", "period": "June", "revenue": 42000.0, "orders": 168},
        {"region": "emea", "period": "July", "revenue": 51000.0, "orders": 204},
        {"region": "emea", "period": "August", "revenue": 65000.0, "orders": 260},
        {"region": "americas", "period": "June", "revenue": 87000.0, "orders": 348},
        {"region": "americas", "period": "July", "revenue": 111000.0, "orders": 444},
        {"region": "americas", "period": "August", "revenue": 120000.0, "orders": 480},
    ],
}


def build_runtime(
    load_snapshot: Callable[[SourceContext], object],
    authorize: Callable[[SourceContext], bool],
) -> RuntimeRegistries:
    contracts = DataContractRegistry()
    contracts.register(
        "sales-analytics/1",
        SalesSnapshot,
        expression_paths={
            "data.title",
            "data.as_of",
            "data.scope",
            "data.revenue",
            "data.previous_revenue",
            "data.orders",
            "data.rows",
            "data.rows.region",
            "data.rows.period",
            "data.rows.revenue",
            "data.rows.orders",
        },
        example=DEMO_SNAPSHOT,
    )
    sources = DataSourceRegistry(contracts)

    def fetch(context: SourceContext, _input: BaseModel | None) -> object:
        return load_snapshot(context)

    sources.register(
        "sales.analytics",
        contract_id="sales-analytics/1",
        handler=fetch,
        authorize=lambda context, _input: context.principal.authenticated and authorize(context),
    )
    return RuntimeRegistries(contracts, sources, CapabilityRegistry(), frozenset()).freeze()
