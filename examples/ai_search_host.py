"""Mount ForgeUI with a host-owned AI-search data feed.

Run with: uv run uvicorn examples.ai_search_host:app --reload
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from pydantic import BaseModel, ConfigDict, Field

from forgeui.app import mount_forgeui
from forgeui.config import Settings
from forgeui.runtime import RuntimeRegistries
from forgeui.security import Principal
from forgeui.services import CapabilityRegistry
from forgeui.sources import DataContractRegistry, DataSourceRegistry, SourceContext


class SearchResult(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    title: str = Field(max_length=160)
    snippet: str = Field(max_length=600)
    score: float = Field(ge=0, le=1)
    source_name: str = Field(max_length=80)


class SearchFeed(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    query: str = Field(max_length=240)
    answer: str = Field(max_length=2_000)
    result_count: int = Field(ge=0, le=50)
    results: list[SearchResult] = Field(max_length=50)


EXAMPLE_FEED = {
    "query": "Which devices need attention?",
    "answer": "Edge 17 has elevated packet loss; the remaining fleet is stable.",
    "result_count": 1,
    "results": [
        {
            "title": "Edge 17 health report",
            "snippet": "Packet loss rose after the latest gateway rollout.",
            "score": 0.97,
            "source_name": "device-health-index",
        }
    ],
}


def build_runtime() -> RuntimeRegistries:
    contracts = DataContractRegistry()
    contracts.register(
        "ai-search/1",
        SearchFeed,
        expression_paths={
            "data.query",
            "data.answer",
            "data.result_count",
            "data.results",
            "data.results.title",
            "data.results.snippet",
            "data.results.score",
            "data.results.source_name",
            "item.title",
            "item.snippet",
            "item.score",
            "item.source_name",
        },
        example=EXAMPLE_FEED,
    )
    sources = DataSourceRegistry(contracts)

    def latest_search(_context: SourceContext, _input: BaseModel | None) -> object:
        # Replace this with a call to trusted application code. The return value is
        # strictly checked against SearchFeed before ForgeUI can render it.
        return EXAMPLE_FEED

    sources.register(
        "ai-search.latest",
        contract_id="ai-search/1",
        handler=latest_search,
        authorize=lambda context, _input: context.principal.tenant_id == "demo",
    )
    return RuntimeRegistries(contracts, sources, CapabilityRegistry()).freeze()


app = FastAPI(title="Host application")


@app.middleware("http")
async def attach_identity(request: Request, call_next):  # type: ignore[no-untyped-def]
    # A real host derives this from its verified session/JWT. Never accept identity
    # fields directly from request parameters or model output.
    request.state.forgeui_principal = Principal(
        "demo-user",
        tenant_id="demo",
        roles=frozenset({"viewer"}),
        authenticated=True,
    )
    return await call_next(request)


mount_forgeui(app, "/forgeui", settings=Settings(), runtime=build_runtime())
