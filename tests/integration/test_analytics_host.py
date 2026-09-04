from __future__ import annotations

import json
from pathlib import Path

import pytest
from examples.analytics_host import DEMO_SNAPSHOT, build_runtime

from forgeui.renderer import HtmlRendererAdapter, RenderContext
from forgeui.security import Principal
from forgeui.sources import SourceUnauthorizedError

ROOT = Path(__file__).parents[2]


def test_analytics_runtime_authorizes_each_live_snapshot():
    calls = []

    def load(context):
        calls.append(context.principal.tenant_id)
        return {**DEMO_SNAPSHOT, "revenue": 185000.0 + len(calls)}

    runtime = build_runtime(load, lambda context: context.principal.tenant_id == "allowed")
    raw = json.loads((ROOT / "examples/manifests/sales-analytics.json").read_text())
    adapter = HtmlRendererAdapter(policy=runtime.policy)
    for expected in (185001, 185002):
        data = runtime.fetch(
            "sales.analytics",
            principal=Principal("viewer", tenant_id="allowed", authenticated=True),
            app_id="pin",
            request_id="render",
        )
        assert data["revenue"] == expected
        result = adapter.render(raw, RenderContext(data=data, state={"region": "emea"}))
        assert result.ok
        assert "158,000" in result.output
        assert "185," in result.output
    with pytest.raises(SourceUnauthorizedError):
        runtime.fetch(
            "sales.analytics",
            principal=Principal("viewer", tenant_id="denied", authenticated=True),
            app_id="pin",
            request_id="render",
        )
    assert calls == ["allowed", "allowed"]
