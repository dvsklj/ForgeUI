from __future__ import annotations

import httpx
import pytest

from forgeui.sources import Principal, SourceContext
from forgeui.sources.http import HttpDataSource, HttpEndpointConfig, HttpSourceError


def context() -> SourceContext:
    return SourceContext(Principal(actor_id="test"), "search")


@pytest.mark.parametrize(
    ("origin", "path"),
    [
        ("http://example.test", "/search"),
        ("https://user:secret@example.test", "/search"),
        ("https://example.test/api", "/search"),
        ("https://example.test", "//other.test"),
        ("https://example.test", "/a/../search"),
    ],
)
def test_endpoint_rejects_untrusted_urls(origin: str, path: str) -> None:
    with pytest.raises(HttpSourceError):
        HttpEndpointConfig(origin=origin, path=path)


def test_localhost_http_is_an_explicit_development_escape_hatch() -> None:
    HttpEndpointConfig(origin="http://localhost:8080", path="/search", allow_localhost_http=True)
    with pytest.raises(HttpSourceError):
        HttpEndpointConfig(origin="http://example.test", path="/search", allow_localhost_http=True)


@pytest.mark.parametrize(
    "response",
    [
        httpx.Response(
            302, headers={"location": "https://other.test", "content-type": "application/json"}
        ),
        httpx.Response(200, headers={"content-type": "text/html"}, content=b"{}"),
        httpx.Response(200, headers={"content-type": "application/json"}, content=b"[]"),
    ],
)
def test_http_source_rejects_redirect_non_json_and_non_object(response: httpx.Response) -> None:
    client = httpx.Client(transport=httpx.MockTransport(lambda _request: response))
    source = HttpDataSource(
        HttpEndpointConfig(origin="https://search.test", path="/v1/search"), client
    )
    with pytest.raises(HttpSourceError):
        source(context(), None)


def test_http_source_bounds_body_and_uses_only_configured_endpoint() -> None:
    def route(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://search.test/v1/search"
        assert request.headers["x-source-key"] == "secret"
        return httpx.Response(
            200, headers={"content-type": "application/json"}, content=b'{"value":"too long"}'
        )

    client = httpx.Client(transport=httpx.MockTransport(route))
    source = HttpDataSource(
        HttpEndpointConfig(
            origin="https://search.test",
            path="/v1/search",
            headers={"x-source-key": "secret"},
            max_response_bytes=8,
        ),
        client,
    )
    with pytest.raises(HttpSourceError, match="maximum size") as error:
        source(context(), None)
    assert "secret" not in str(error.value)
