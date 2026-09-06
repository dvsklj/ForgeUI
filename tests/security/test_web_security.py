from __future__ import annotations

from collections import deque
from types import SimpleNamespace

import pytest
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient

from forgeui.app import RATE_LIMIT_WINDOW_SECONDS, SecurityMiddleware, create_app
from forgeui.config import Settings
from forgeui.llm import ScriptedProvider


def _csrf(html: str) -> str:
    value = BeautifulSoup(html, "html.parser").select_one('meta[name="csrf-token"]')
    assert value is not None
    token = value.get("content")
    assert isinstance(token, str)
    return token


def test_security_headers_body_limit_and_csrf() -> None:
    settings = Settings(
        environment="test",
        database_url="sqlite:///:memory:",
        admin_token="token",
        max_request_bytes=16_384,
    )
    with TestClient(create_app(settings, ScriptedProvider([]))) as client:
        response = client.get("/api/health/live")
        assert "default-src 'self'" in response.headers["content-security-policy"]
        assert response.headers["referrer-policy"] == "no-referrer"
        assert response.headers["x-content-type-options"] == "nosniff"
        assert client.post("/api/apps", json={"title": "No token"}).status_code == 403
        too_large = client.post("/api/apps", content=b"x" * 20_000)
        assert too_large.status_code == 413


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("POST", "/apps/{app_id}/actions/go", {"event": {}}),
        ("POST", "/apps/{app_id}/stateless/actions/go", {"state": {}, "event": {}}),
        ("POST", "/apps/{app_id}/state/page", {"value": 1, "version": 0}),
        ("POST", "/apps/{app_id}/stateless/state/page", {"state": {}, "value": 1}),
        ("GET", "/api/apps/{app_id}/data", None),
    ],
)
def test_unknown_app_is_a_client_error_not_a_server_error(
    method: str, path: str, body: dict[str, object] | None
) -> None:
    settings = Settings(
        environment="test",
        database_url="sqlite:///:memory:",
        admin_token="token",
    )
    with TestClient(create_app(settings, ScriptedProvider([]))) as client:
        csrf = _csrf(client.get("/").text)
        response = client.request(
            method,
            path.format(app_id="0" * 32),
            json=body,
            headers={"X-CSRF-Token": csrf},
        )
        assert response.status_code == 404
        assert response.json() == {"detail": "not found"}


def test_rate_limiter_forgets_idle_clients(monkeypatch: pytest.MonkeyPatch) -> None:
    clock = {"now": 1_000.0}
    monkeypatch.setattr("forgeui.app.monotonic", lambda: clock["now"])
    settings = Settings(environment="test", database_url="sqlite:///:memory:")
    middleware = SecurityMiddleware(lambda *_args: None, settings=settings)

    def request(host: str) -> object:
        return SimpleNamespace(
            method="GET", url=SimpleNamespace(path="/"), client=SimpleNamespace(host=host)
        )

    for index in range(50):
        assert middleware._rate_limit(request(f"10.0.0.{index}"))
    assert len(middleware.buckets) == 50
    # Still inside the window: nothing is dropped, and an active client keeps its key.
    clock["now"] += RATE_LIMIT_WINDOW_SECONDS / 2
    assert middleware._rate_limit(request("10.0.0.0"))
    assert len(middleware.buckets) == 50
    # After a full idle window, the idle keys are swept and the active one survives.
    clock["now"] += RATE_LIMIT_WINDOW_SECONDS
    assert middleware._rate_limit(request("192.0.2.1"))
    assert set(middleware.buckets) == {"read:10.0.0.0", "read:192.0.2.1"}
    assert isinstance(middleware.buckets["read:10.0.0.0"], deque)
