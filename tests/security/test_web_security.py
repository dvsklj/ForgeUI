from __future__ import annotations

from collections import deque
from collections.abc import Iterator
from types import SimpleNamespace

import pytest
from bs4 import BeautifulSoup
from fastapi.testclient import TestClient
from starlette.types import Receive, Scope, Send

from forgeui.app import (
    RATE_LIMIT_WINDOW_SECONDS,
    RequestLimitMiddleware,
    SecurityMiddleware,
    _BodyTooLargeError,
    create_app,
)
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


def _settings_with_limit(maximum: int) -> Settings:
    return Settings(
        environment="test",
        database_url="sqlite:///:memory:",
        admin_token="token",
        max_request_bytes=maximum,
    )


def _stream(*parts: bytes) -> Iterator[bytes]:
    # An iterator body makes httpx use chunked transfer encoding, so the middleware
    # has no Content-Length to reject the request on.
    yield from parts


def test_streamed_body_without_content_length_is_limited() -> None:
    limit = 16_384
    with TestClient(create_app(_settings_with_limit(limit), ScriptedProvider([]))) as client:
        response = client.post(
            "/api/apps",
            content=_stream(b"x" * limit, b"x"),
            headers={"Authorization": "Bearer token", "Content-Type": "application/json"},
        )
        assert "content-length" not in {key.lower() for key in response.request.headers}
        assert response.status_code == 413
        assert response.json() == {"detail": "request body is too large"}


def test_streamed_body_under_the_limit_is_accepted() -> None:
    limit = 16_384
    with TestClient(create_app(_settings_with_limit(limit), ScriptedProvider([]))) as client:
        at_limit = client.post(
            "/api/apps",
            content=_stream(b"x" * (limit // 2), b"x" * (limit // 2)),
            headers={"Authorization": "Bearer token", "Content-Type": "application/json"},
        )
        assert "content-length" not in {key.lower() for key in at_limit.request.headers}
        assert at_limit.status_code != 413
        created = client.post(
            "/api/apps",
            content=_stream(b'{"title": "St', b'reamed"}'),
            headers={"Authorization": "Bearer token", "Content-Type": "application/json"},
        )
        assert created.status_code == 201
        assert created.json()["title"] == "Streamed"


def test_streamed_form_body_is_limited_before_csrf_parsing() -> None:
    limit = 16_384
    with TestClient(create_app(_settings_with_limit(limit), ScriptedProvider([]))) as client:
        # A form post makes the security middleware read the body itself to find the
        # CSRF field, so the limit has to hold outside the routing layer too.
        response = client.post(
            "/login",
            content=_stream(b"csrf_token=" + b"x" * limit, b"x"),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 413
        assert response.json() == {"detail": "request body is too large"}


async def test_limit_after_response_started_propagates_instead_of_replacing() -> None:
    sent: list[dict[str, object]] = []

    async def app(scope: Scope, receive: Receive, send: Send) -> None:
        del scope
        await send({"type": "http.response.start", "status": 200, "headers": []})
        while True:
            await receive()

    async def receive() -> dict[str, object]:
        return {"type": "http.request", "body": b"x" * 8, "more_body": True}

    async def send(message: dict[str, object]) -> None:
        sent.append(message)

    middleware = RequestLimitMiddleware(app, maximum=8)
    with pytest.raises(_BodyTooLargeError):
        await middleware({"type": "http", "headers": []}, receive, send)
    assert sent == [{"type": "http.response.start", "status": 200, "headers": []}]


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


def test_strict_rate_limit_groups_only_cover_unsafe_methods() -> None:
    settings = Settings(environment="test", database_url="sqlite:///:memory:")
    middleware = SecurityMiddleware(lambda *_args: None, settings=settings)

    def request(method: str, path: str) -> object:
        return SimpleNamespace(
            method=method,
            url=SimpleNamespace(path=path),
            client=SimpleNamespace(host="10.0.0.1"),
        )

    # Polling a job's status is a read, so it must not spend the twelve generation
    # attempts, and neither must rendering the login page.
    assert middleware._rate_limit(request("GET", "/api/generation/x"))
    assert middleware._rate_limit(request("GET", "/login"))
    assert middleware._rate_limit(request("GET", "/studio/generate"))
    assert set(middleware.buckets) == {"read:10.0.0.1"}
    assert len(middleware.buckets["read:10.0.0.1"]) == 3
    # Submissions keep their own strict budgets.
    assert middleware._rate_limit(request("POST", "/api/apps/x/generation"))
    assert middleware._rate_limit(request("POST", "/login"))
    assert middleware._rate_limit(request("POST", "/api/apps"))
    assert set(middleware.buckets) == {
        "read:10.0.0.1",
        "generation:10.0.0.1",
        "login:10.0.0.1",
        "mutation:10.0.0.1",
    }
    # The read budget outlasts the generation budget on the same path.
    for _ in range(11):
        assert middleware._rate_limit(request("POST", "/api/apps/x/generation"))
    assert not middleware._rate_limit(request("POST", "/api/apps/x/generation"))
    for _ in range(30):
        assert middleware._rate_limit(request("GET", "/api/generation/x"))
