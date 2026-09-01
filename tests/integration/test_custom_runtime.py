from __future__ import annotations

import json
import time
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.responses import Response

from forgeui.app import mount_forgeui
from forgeui.config import Settings
from forgeui.llm import ScriptedProvider
from forgeui.runtime import RuntimeRegistries
from forgeui.security import Principal
from forgeui.services import CapabilityRegistry
from forgeui.sources import DataContractRegistry, DataSourceRegistry


class SearchResult(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    title: str
    snippet: str
    score: float = Field(ge=0, le=1)
    source_name: str


class SearchDashboard(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    query: str
    answer: str
    result_count: int = Field(ge=0)
    results: list[SearchResult] = Field(max_length=50)


SEARCH_DATA = {
    "query": "Why is edge-17 unhealthy?",
    "answer": "Packet loss increased after the last gateway rollout.",
    "result_count": 1,
    "results": [
        {
            "title": "Edge 17 health report",
            "snippet": "Packet loss rose to 8 percent at 09:14 UTC.",
            "score": 0.97,
            "source_name": "device-health-index",
        }
    ],
}


def _runtime() -> RuntimeRegistries:
    contracts = DataContractRegistry()
    contracts.register(
        "ai-search/1",
        SearchDashboard,
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
        example=SEARCH_DATA,
    )
    sources = DataSourceRegistry(contracts)
    sources.register(
        "ai-search.latest",
        contract_id="ai-search/1",
        handler=lambda _context, _input: SEARCH_DATA,
        authorize=lambda context, _input: context.principal.tenant_id == "acme",
    )
    return RuntimeRegistries(contracts, sources, CapabilityRegistry()).freeze()


def _manifest() -> dict[str, object]:
    return {
        "metadata": {"title": "Search-grounded health report"},
        "design": {"name": "calm-neutral"},
        "data": {"contract": "ai-search/1", "source": "ai-search.latest"},
        "root": "page",
        "elements": {
            "page": {"type": "page", "children": ["header", "answer", "results"]},
            "header": {
                "type": "page-header",
                "props": {
                    "title": "Device investigation",
                    "subtitle": {"kind": "ref", "path": "data.query"},
                },
            },
            "answer": {
                "type": "alert",
                "props": {
                    "title": "AI search summary",
                    "message": {"kind": "ref", "path": "data.answer"},
                    "level": "info",
                },
            },
            "results": {
                "type": "table",
                "props": {
                    "data": {"kind": "ref", "path": "data.results"},
                    "columns": [
                        {"key": "title", "label": "Evidence", "emphasis": True},
                        {"key": "source_name", "label": "Source"},
                        {"key": "score", "label": "Score"},
                    ],
                },
            },
        },
    }


def test_custom_contract_source_host_principal_and_mount_work_end_to_end() -> None:
    host = FastAPI()

    @host.middleware("http")
    async def host_identity(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        request.state.forgeui_principal = Principal("user-42", tenant_id="acme", authenticated=True)
        return await call_next(request)

    settings = Settings(
        environment="test",
        database_url="sqlite:///:memory:",
        admin_token="test-token",
    )
    provider = ScriptedProvider([json.dumps(_manifest())])
    mount_forgeui(
        host,
        "/forgeui",
        settings=settings,
        provider=provider,
        runtime=_runtime(),
    )
    admin = {"Authorization": "Bearer test-token"}

    with TestClient(host) as client:
        app_id = client.post(
            "/forgeui/api/apps",
            headers=admin,
            json={"title": "Search", "visibility": "public"},
        ).json()["id"]
        saved = client.put(
            f"/forgeui/api/apps/{app_id}/manifest",
            headers=admin,
            json={"manifest": _manifest()},
        )
        assert saved.status_code == 200, saved.text

        page = client.get(f"/forgeui/apps/{app_id}/views/desktop")
        assert page.status_code == 200
        assert "Packet loss increased" in page.text
        assert "device-health-index" in page.text

        card = client.get(f"/forgeui/apps/{app_id}/embed", params={"element": "answer"})
        assert card.status_code == 200
        assert "AI search summary" in card.text

        data = client.get(f"/forgeui/api/apps/{app_id}/data").json()
        assert data["source"] == "ai-search.latest"
        assert data["snapshot"]["result_count"] == 1

        public_catalog = client.get("/forgeui/api/catalog").json()
        assert set(public_catalog) == {"components"}
        catalog = client.get("/forgeui/api/catalog", headers=admin).json()
        assert catalog["data_sources"] == {"ai-search.latest": "ai-search/1"}
        assert catalog["capabilities"] == []

        queued = client.post(
            f"/forgeui/api/apps/{app_id}/generation",
            headers=admin,
            json={
                "brief": "Build a concise search-grounded device report.",
                "profile": "calm-neutral",
                "data_contract": "ai-search/1",
                "data_source": "ai-search.latest",
                "sample_data": SEARCH_DATA,
            },
        )
        assert queued.status_code == 202, queued.text
        job_id = queued.json()["id"]
        for _ in range(30):
            job = client.get(f"/forgeui/api/generation/{job_id}", headers=admin).json()
            if job["status"] in {"succeeded", "failed"}:
                break
            time.sleep(0.03)
        assert job["status"] == "succeeded"
        system_prompt = provider.calls[0][0][0].content
        assert '"data_contract":"ai-search/1"' in system_prompt
        assert '"data.results.title"' in system_prompt
