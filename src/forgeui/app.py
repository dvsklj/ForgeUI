"""Application factory, transport security, and durable in-process job worker."""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
import re
import secrets
import uuid
from collections import defaultdict, deque
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager, suppress
from time import monotonic
from typing import Any, cast
from urllib.parse import parse_qs

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from itsdangerous import BadSignature, SignatureExpired, URLSafeSerializer, URLSafeTimedSerializer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from forgeui.config import Settings, get_settings
from forgeui.container import Container, create_container
from forgeui.llm import GenerationRequest, LLMProvider
from forgeui.llm.types import GenerationProgress
from forgeui.observability import Metrics
from forgeui.runtime import RuntimeRegistries
from forgeui.security import Principal
from forgeui.services.exceptions import ServiceError
from forgeui.web import create_router

logger = logging.getLogger(__name__)
ADMIN_SESSION_SECONDS = 8 * 60 * 60
_STATELESS_RENDER_PATH = re.compile(
    r"/apps/[a-f0-9]{32}/stateless/(?:actions/[a-z][a-z0-9_-]*|state/[a-z][a-z0-9_]*)$"
)


class RequestLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized Content-Length and streaming request bodies before handlers."""

    def __init__(self, app: Any, *, maximum: int) -> None:
        super().__init__(app)
        self.maximum = maximum

    async def dispatch(self, request: Request, call_next: Callable[[Request], Any]) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > self.maximum:
            return JSONResponse({"detail": "request body is too large"}, status_code=413)
        received = 0
        original_receive = request._receive

        async def limited_receive() -> dict[str, Any]:
            nonlocal received
            message = await original_receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > self.maximum:
                    raise _BodyTooLargeError
            return dict(message)

        request._receive = limited_receive
        try:
            return cast(Response, await call_next(request))
        except _BodyTooLargeError:
            return JSONResponse({"detail": "request body is too large"}, status_code=413)


class _BodyTooLargeError(Exception):
    pass


class MetricsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Any, *, metrics: Metrics) -> None:
        super().__init__(app)
        self.metrics = metrics

    async def dispatch(self, request: Request, call_next: Callable[[Request], Any]) -> Response:
        started = monotonic()
        status_code = 500
        try:
            response = cast(Response, await call_next(request))
            status_code = response.status_code
            return response
        finally:
            self.metrics.observe_http(request.method, status_code, monotonic() - started)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Session, CSRF, rate limit, request ID, and browser-header adapter."""

    def __init__(self, app: Any, *, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings
        self.serializer = URLSafeSerializer(
            settings.secret_key.get_secret_value(), salt="forgeui-session"
        )
        self.admin_serializer = URLSafeTimedSerializer(
            settings.secret_key.get_secret_value(), salt="forgeui-admin"
        )
        self.buckets: dict[str, deque[float]] = defaultdict(deque)

    def _session(self, value: str | None) -> tuple[str, str]:
        if value:
            try:
                payload = self.serializer.loads(value)
                if isinstance(payload, dict) and isinstance(payload.get("sid"), str):
                    sid = payload["sid"]
                    return sid, self._csrf(sid)
            except BadSignature:
                pass
        sid = secrets.token_urlsafe(24)
        return sid, self._csrf(sid)

    def _csrf(self, sid: str) -> str:
        return hmac.new(
            self.settings.secret_key.get_secret_value().encode(),
            f"csrf:{sid}".encode(),
            hashlib.sha256,
        ).hexdigest()

    def _is_admin(self, request: Request) -> bool:
        bearer = request.headers.get("authorization", "")
        configured = self.settings.admin_token
        if configured is not None and hmac.compare_digest(
            bearer, f"Bearer {configured.get_secret_value()}"
        ):
            return True
        signed = request.cookies.get("forgeui_admin")
        if not signed:
            return False
        try:
            return bool(
                self.admin_serializer.loads(signed, max_age=ADMIN_SESSION_SECONDS) == "admin"
            )
        except (BadSignature, SignatureExpired):
            return False

    def _rate_limit(self, request: Request) -> bool:
        group = "mutation" if request.method not in {"GET", "HEAD", "OPTIONS"} else "read"
        if request.url.path.endswith("/login"):
            group = "login"
        elif "/generation" in request.url.path or "/studio/generate" in request.url.path:
            group = "generation"
        limits = {"read": 240, "mutation": 80, "login": 12, "generation": 12}
        now = monotonic()
        key = f"{group}:{request.client.host if request.client else 'unknown'}"
        bucket = self.buckets[key]
        while bucket and bucket[0] < now - 60:
            bucket.popleft()
        if len(bucket) >= limits[group]:
            return False
        bucket.append(now)
        return True

    async def dispatch(self, request: Request, call_next: Callable[[Request], Any]) -> Response:
        if not self._rate_limit(request):
            return JSONResponse({"detail": "rate limit exceeded"}, status_code=429)
        sid, csrf = self._session(request.cookies.get("forgeui_session"))
        request.state.session_id = sid
        request.state.csrf_token = csrf
        request.state.is_admin = self._is_admin(request)
        request.state.request_id = uuid.uuid4().hex
        unsafe = request.method not in {"GET", "HEAD", "OPTIONS"}
        stateless_render = bool(
            request.method == "POST" and _STATELESS_RENDER_PATH.search(request.url.path)
        )
        bearer = bool(
            request.state.is_admin
            and request.headers.get("authorization", "").startswith("Bearer ")
        )
        login = request.url.path.rstrip("/").endswith("login")
        if unsafe and not bearer and not stateless_render:
            supplied = request.headers.get("x-csrf-token")
            if supplied is None and request.headers.get("content-type", "").startswith(
                "application/x-www-form-urlencoded"
            ):
                raw_form = (await request.body()).decode("utf-8", errors="replace")
                supplied = parse_qs(raw_form).get("csrf_token", [""])[0]
            if login and supplied is None:
                supplied = ""  # login still needs the rendered token below.
            if not hmac.compare_digest(supplied or "", csrf):
                return JSONResponse({"detail": "CSRF validation failed"}, status_code=403)
        try:
            response = cast(Response, await call_next(request))
        except Exception:
            logger.exception(
                "unhandled request failure",
                extra={"request_id": request.state.request_id, "path": request.url.path},
            )
            response = JSONResponse({"detail": "internal server error"}, status_code=500)
        response.set_cookie(
            "forgeui_session",
            self.serializer.dumps({"sid": sid}),
            httponly=True,
            samesite="lax",
            secure=self.settings.secure_cookies,
            path="/",
        )
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        embeddable = response.headers.get("X-Forge-Frame-Policy") == "embeddable"
        if "X-Forge-Frame-Policy" in response.headers:
            del response.headers["X-Forge-Frame-Policy"]
        if embeddable and self.settings.frame_ancestors == ["'self'"]:
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
        elif not embeddable:
            response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = _csp(
            self.settings,
            frame_ancestors=self.settings.frame_ancestors if embeddable else ["'none'"],
        )
        if self.settings.secure_cookies:
            response.headers["Strict-Transport-Security"] = "max-age=31536000"
        return response

    def set_admin_cookie(self, response: Response) -> None:
        response.set_cookie(
            "forgeui_admin",
            self.admin_serializer.dumps("admin"),
            httponly=True,
            samesite="lax",
            secure=self.settings.secure_cookies,
            path="/",
            max_age=ADMIN_SESSION_SECONDS,
        )


def _csp(settings: Settings, *, frame_ancestors: list[str] | None = None) -> str:
    scripts = ["'self'"]
    styles = ["'self'", "'unsafe-inline'"]
    ancestors = frame_ancestors or ["'none'"]
    remote_assets = (
        (settings.tailwind_cdn_url, settings.htmx_cdn_url) if settings.asset_mode == "cdn" else ()
    )
    for url in remote_assets:
        if url.startswith("https://"):
            origin = url.split("/", 3)[:3]
            source = "/".join(origin)
            scripts.append(source)
    return "; ".join(
        [
            "default-src 'self'",
            f"script-src {' '.join(dict.fromkeys(scripts))}",
            f"style-src {' '.join(dict.fromkeys(styles))}",
            "img-src 'self' data:",
            "connect-src 'self'",
            "font-src 'self'",
            "object-src 'none'",
            "base-uri 'none'",
            f"frame-ancestors {' '.join(ancestors)}",
            "form-action 'self'",
        ]
    )


async def _run_job(
    container: Container,
    worker_id: str,
    job_id: str,
    *,
    stop: asyncio.Event | None = None,
) -> None:
    job = container.jobs.get(job_id)
    if job.app_id is None:
        container.jobs.fail(job.id, error_code="missing_app", worker_id=worker_id)
        container.metrics.observe_generation("failed", error_code="missing_app")
        return
    try:
        request = GenerationRequest.model_validate(job.prompt, strict=True)
        if request.sample_data:
            source_data = container.runtime.contracts.validate(
                request.data_contract,
                request.sample_data,
            )
        else:
            source_data = await asyncio.to_thread(
                container.runtime.fetch,
                request.data_source,
                principal=Principal.service(
                    "forgeui-generation",
                    roles=frozenset({"forgeui-generation"}),
                ),
                app_id=job.app_id,
                request_id=job.id,
            )
        request = request.model_copy(update={"sample_data": source_data})

        async def progress(value: GenerationProgress) -> None:
            current = container.jobs.get(job.id)
            if current.status == "cancelled":
                return
            amount = {"generating": 15, "validating": 55, "repairing": 70}.get(value.phase, 90)
            try:
                container.jobs.progress(job.id, value=amount, worker_id=worker_id)
            except ServiceError:
                return

        generation = asyncio.create_task(container.engine.generate(request, progress=progress))
        while not generation.done():
            await asyncio.wait({generation}, timeout=0.1)
            current = container.jobs.get(job.id)
            stopping = stop is not None and stop.is_set()
            if current.status == "cancelled" or stopping:
                if stopping and current.status == "running":
                    with suppress(ServiceError):
                        container.jobs.cancel(job.id)
                generation.cancel()
                with suppress(asyncio.CancelledError):
                    await generation
                container.metrics.observe_generation("cancelled")
                return
        result = await generation
        current = container.jobs.get(job.id)
        if current.status == "cancelled":
            return
        if result.succeeded and result.manifest is not None:
            revision = container.apps.save_manifest(
                job.app_id, result.manifest, created_by="generation"
            )
            container.jobs.succeed(job.id, revision_id=revision.id, worker_id=worker_id)
            container.metrics.observe_generation("succeeded", attempts=len(result.attempts))
        else:
            container.jobs.fail(
                job.id, error_code=result.error_code or "generation_failed", worker_id=worker_id
            )
            container.metrics.observe_generation(
                "failed",
                error_code=result.error_code or "generation_failed",
                attempts=len(result.attempts),
            )
    except Exception:
        with suppress(ServiceError):
            container.jobs.fail(job.id, error_code="generation_failed", worker_id=worker_id)
        container.metrics.observe_generation("failed", error_code="generation_failed")


async def _worker(container: Container, stop: asyncio.Event) -> None:
    worker_id = f"web-{uuid.uuid4().hex}"
    while not stop.is_set():
        job = container.jobs.claim_next(worker_id)
        if job is None:
            try:
                await asyncio.wait_for(stop.wait(), timeout=0.1)
            except TimeoutError:
                continue
        else:
            await _run_job(container, worker_id, job.id, stop=stop)


def create_app(
    settings: Settings | None = None,
    provider: LLMProvider | None = None,
    *,
    runtime: RuntimeRegistries | None = None,
) -> FastAPI:
    """Create an independently mountable FastAPI application."""

    selected = settings or get_settings()
    selected.validate_runtime()
    container = create_container(selected, provider=provider, runtime=runtime)
    worker: asyncio.Task[None] | None = None
    worker_stop: asyncio.Event | None = None
    closed = False

    async def start() -> None:
        nonlocal worker, worker_stop
        if worker is not None:
            return
        if closed:
            raise RuntimeError("ForgeUI cannot restart after shutdown")
        container.database.create_schema()
        worker_stop = asyncio.Event()
        worker = asyncio.create_task(_worker(container, worker_stop))

    async def stop() -> None:
        nonlocal worker, worker_stop, closed
        if worker is None or worker_stop is None:
            return
        worker_stop.set()
        await worker
        worker = None
        worker_stop = None
        closer = getattr(container.provider, "aclose", None)
        if closer is not None:
            await closer()
        container.database.dispose()
        closed = True

    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
        await start()
        try:
            yield
        finally:
            await stop()

    app = FastAPI(title="ForgeUI", root_path=selected.root_path, lifespan=lifespan)
    app.state.container = container
    app.state.forgeui_start = start
    app.state.forgeui_stop = stop
    app.add_middleware(GZipMiddleware, minimum_size=500)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=selected.trusted_hosts)
    app.add_middleware(SecurityMiddleware, settings=selected)
    app.add_middleware(RequestLimitMiddleware, maximum=selected.max_request_bytes)
    app.add_middleware(MetricsMiddleware, metrics=container.metrics)
    admin_serializer = URLSafeTimedSerializer(
        selected.secret_key.get_secret_value(), salt="forgeui-admin"
    )

    def set_admin_cookie(response: Response) -> None:
        response.set_cookie(
            "forgeui_admin",
            admin_serializer.dumps("admin"),
            httponly=True,
            samesite="lax",
            secure=selected.secure_cookies,
            path="/",
            max_age=ADMIN_SESSION_SECONDS,
        )

    app.state.set_admin_cookie = set_admin_cookie
    app.mount(
        "/static",
        StaticFiles(directory=str(__file__.replace("app.py", "web/static")), check_dir=True),
        name="static",
    )
    app.include_router(create_router(container))
    return app


def mount_forgeui(
    host: FastAPI,
    path: str = "/forgeui",
    *,
    settings: Settings | None = None,
    provider: LLMProvider | None = None,
    runtime: RuntimeRegistries | None = None,
) -> FastAPI:
    """Mount ForgeUI and compose its lifecycle into an existing FastAPI host."""

    child = create_app(settings, provider, runtime=runtime)
    start = cast(Callable[[], Awaitable[None]], child.state.forgeui_start)
    stop = cast(Callable[[], Awaitable[None]], child.state.forgeui_stop)
    host_lifespan = host.router.lifespan_context

    @asynccontextmanager
    async def combined_lifespan(app: FastAPI) -> AsyncIterator[Any]:
        async with host_lifespan(app) as state:
            await start()
            try:
                yield state
            finally:
                await stop()

    host.router.lifespan_context = combined_lifespan
    host.mount(path, child)
    return child
