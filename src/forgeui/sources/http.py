"""A deliberately narrow HTTP source handler for preconfigured JSON endpoints."""

from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Literal

import httpx
from pydantic import BaseModel

from forgeui.sources.registry import JsonObject, SourceContext, SourceError

_BLOCKED_HEADERS = frozenset({"content-length", "host", "transfer-encoding"})


class HttpSourceError(SourceError):
    """A trusted HTTP endpoint returned an unsafe or invalid response."""


@dataclass(frozen=True, slots=True)
class HttpEndpointConfig:
    """Fixed host configuration.  Header values are deliberately omitted from repr."""

    origin: str
    path: str
    method: Literal["GET", "POST"] = "POST"
    headers: Mapping[str, str] = field(default_factory=dict, repr=False)
    timeout_seconds: float = 5.0
    max_response_bytes: int = 262_144
    allow_localhost_http: bool = False

    def __post_init__(self) -> None:
        if self.method not in {"GET", "POST"}:
            raise HttpSourceError("HTTP source method is not allowed")
        if not isinstance(self.timeout_seconds, int | float) or not 0 < self.timeout_seconds <= 60:
            raise HttpSourceError("HTTP source timeout is invalid")
        if not isinstance(self.max_response_bytes, int) or self.max_response_bytes < 1:
            raise HttpSourceError("HTTP source response limit is invalid")
        url = httpx.URL(self.origin)
        localhost = url.host in {"localhost", "127.0.0.1", "::1"}
        permitted_local_http = self.allow_localhost_http and localhost and url.scheme == "http"
        if url.scheme != "https" and not permitted_local_http:
            raise HttpSourceError("HTTP source origin must use HTTPS")
        if not url.host or url.username or url.password or url.query or url.fragment:
            raise HttpSourceError("HTTP source origin is invalid")
        if url.path not in {"", "/"}:
            raise HttpSourceError("HTTP source origin must not include a path")
        if (
            not isinstance(self.path, str)
            or not self.path.startswith("/")
            or self.path.startswith("//")
            or "?" in self.path
            or "#" in self.path
            or "\\" in self.path
            or any(part in {"", ".", ".."} for part in self.path.split("/")[1:])
        ):
            raise HttpSourceError("HTTP source path is invalid")
        normalized_headers: dict[str, str] = {}
        for name, value in self.headers.items():
            if (
                not isinstance(name, str)
                or not isinstance(value, str)
                or name.lower() in _BLOCKED_HEADERS
            ):
                raise HttpSourceError("HTTP source headers are invalid")
            normalized_headers[name] = value
        object.__setattr__(self, "headers", normalized_headers)

    @property
    def url(self) -> str:
        return f"{self.origin.rstrip('/')}{self.path}"


@dataclass(slots=True)
class HttpSourceHandler:
    """Trusted handler that uses only the endpoint configured at registration time."""

    endpoint: HttpEndpointConfig
    client: httpx.Client

    def __call__(self, context: SourceContext, input_value: BaseModel | None) -> JsonObject:
        del context  # Identity is used by authorization before this handler is called.
        payload = None if input_value is None else input_value.model_dump(mode="json")
        request = self.client.build_request(
            self.endpoint.method,
            self.endpoint.url,
            headers=dict(self.endpoint.headers),
            params=payload if self.endpoint.method == "GET" else None,
            json=payload if self.endpoint.method == "POST" else None,
        )
        try:
            response = self.client.send(request, stream=True, follow_redirects=False)
            try:
                if 300 <= response.status_code < 400:
                    raise HttpSourceError("HTTP source redirects are not allowed")
                if not 200 <= response.status_code < 300:
                    raise HttpSourceError(f"HTTP source returned status {response.status_code}")
                content_type = (
                    response.headers.get("content-type", "").split(";", 1)[0].strip().lower()
                )
                if content_type != "application/json":
                    raise HttpSourceError("HTTP source response must be JSON")
                chunks: list[bytes] = []
                total = 0
                for chunk in response.iter_bytes():
                    total += len(chunk)
                    if total > self.endpoint.max_response_bytes:
                        raise HttpSourceError("HTTP source response exceeds maximum size")
                    chunks.append(chunk)
                value = json.loads(b"".join(chunks))
            finally:
                response.close()
        except httpx.HTTPError as exc:
            raise HttpSourceError("HTTP source request failed") from exc
        if not isinstance(value, dict):
            raise HttpSourceError("HTTP source response must be a JSON object")
        return value


HttpDataSource = HttpSourceHandler
