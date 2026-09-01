from __future__ import annotations

from fastapi.testclient import TestClient

from forgeui.app import create_app
from forgeui.config import Settings
from forgeui.llm import ScriptedProvider


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
