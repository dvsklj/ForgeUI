"""HTTP adapters for the trusted ForgeUI service layer."""
# ruff: noqa: E501

from __future__ import annotations

import hmac
import json
from collections.abc import Mapping
from typing import Any, Literal, cast

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from forgeui.a2ui import A2UI_MIME_TYPE, A2UIAdapterError, adapt_a2ui_jsonl
from forgeui.catalog import component_registry
from forgeui.container import Container
from forgeui.data.repositories import JsonValue
from forgeui.domain.device_health import DeviceHealthSnapshot
from forgeui.domain.models import ForgeManifest
from forgeui.llm import GenerationRequest
from forgeui.renderer import RenderContext
from forgeui.security import Principal
from forgeui.services.apps import AppView, InvalidManifestError, ManifestRevisionView
from forgeui.services.exceptions import (
    ConflictError,
    DataUnavailableError,
    ForbiddenError,
    NotFoundError,
    ServiceError,
)
from forgeui.services.jobs import GenerationJobView
from forgeui.sources import SourceError
from forgeui.surfaces import PersistenceMode, SurfaceMode, surface_presentation
from forgeui.validation import validate_manifest


class _RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class AppCreateRequest(_RequestModel):
    title: str = Field(min_length=1, max_length=120)
    visibility: Literal["private", "public"] = "private"


class AppUpdateRequest(_RequestModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    visibility: Literal["private", "public"] | None = None


class ManifestRequest(_RequestModel):
    manifest: dict[str, object]


class RestoreRequest(_RequestModel):
    expected_revision_id: str | None = Field(default=None, min_length=1, max_length=64)


class StateRequest(_RequestModel):
    value: Any
    version: int = Field(ge=0)


class ActionRequest(_RequestModel):
    version: int | None = Field(default=None, ge=0)
    event: dict[str, Any] = Field(default_factory=dict)
    confirmed: bool = False


class StatelessActionRequest(_RequestModel):
    state: dict[str, Any] = Field(max_length=32)
    event: dict[str, Any] = Field(default_factory=dict)


class StatelessStateRequest(_RequestModel):
    state: dict[str, Any] = Field(max_length=32)
    value: Any


class DeviceQueryRequest(_RequestModel):
    filters: dict[str, str] = Field(default_factory=dict)
    projection: list[str] | None = None
    offset: int = Field(default=0, ge=0, le=10_000)
    limit: int = Field(default=50, ge=1, le=100)


def _is_admin(request: Request) -> bool:
    return bool(getattr(request.state, "is_admin", False))


def _principal(request: Request) -> Principal:
    host_principal = getattr(request.state, "forgeui_principal", None)
    if isinstance(host_principal, Principal):
        return host_principal
    if _is_admin(request):
        return Principal.administrator()
    return Principal.anonymous(str(request.state.session_id))


def _require_admin(request: Request) -> None:
    if not _is_admin(request):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "administrator credentials required")


def _can_read(request: Request, container: Container, visibility: str) -> None:
    if _is_admin(request) or (visibility == "public" and container.settings.allow_public_read):
        return
    raise HTTPException(status.HTTP_404_NOT_FOUND, "app not found")


def _view_app(view: AppView) -> dict[str, object]:
    return {
        "id": view.id,
        "title": view.title,
        "visibility": view.visibility,
        "current_revision_id": view.current_revision_id,
        "last_known_good_revision_id": view.last_known_good_revision_id,
    }


def _view_revision(view: ManifestRevisionView) -> dict[str, object]:
    return {
        "id": view.id,
        "app_id": view.app_id,
        "number": view.number,
        "parent_revision_id": view.parent_revision_id,
        "content_hash": view.content_hash,
        "manifest": view.manifest.model_dump(mode="json"),
    }


def _view_job(view: GenerationJobView) -> dict[str, object]:
    return {
        "id": view.id,
        "app_id": view.app_id,
        "status": view.status,
        "progress": view.progress,
        "attempt": view.attempt,
        "result_revision_id": view.result_revision_id,
        "error_code": view.error_code,
    }


def _service_error(error: ServiceError) -> HTTPException:
    if isinstance(error, NotFoundError):
        return HTTPException(404, "not found")
    if isinstance(error, ConflictError):
        return HTTPException(409, "resource changed; reload and try again")
    if isinstance(error, ForbiddenError):
        return HTTPException(403, "request is not permitted")
    if isinstance(error, DataUnavailableError):
        return HTTPException(503, "registered data source is unavailable")
    return HTTPException(400, "request could not be completed")


async def service_error_handler(_request: Request, error: Exception) -> JSONResponse:
    """Map a service error that escaped a route into the same status a route would send.

    Routes normally translate service errors themselves. This app-level handler is the
    backstop so an app lookup outside a route's ``try`` block still produces a client
    status rather than a logged internal server error.
    """

    if not isinstance(error, ServiceError):
        raise error
    translated = _service_error(error)
    return JSONResponse({"detail": translated.detail}, status_code=translated.status_code)


def _etag(revision_id: str | None) -> dict[str, str]:
    return {} if revision_id is None else {"ETag": f'"{revision_id}"'}


def _if_match(request: Request) -> str | None:
    value = request.headers.get("if-match")
    if value is None:
        return None
    return value.strip().strip('"') or None


def _safe_html(value: object) -> str:
    from markupsafe import escape

    return str(escape(str(value)))


def _shell_html(
    request: Request,
    container: Container,
    *,
    title: str,
    content: str,
    profile: str = "calm-neutral",
) -> str:
    static_prefix = request.url_for("static", path="").path.rstrip("/")
    use_cdn = container.settings.asset_mode == "cdn"
    return container.renderer.render_shell(
        title=title,
        content=content,
        profile=profile,
        csrf_token=str(request.state.csrf_token),
        tailwind_cdn_url=container.settings.tailwind_cdn_url if use_cdn else None,
        htmx_cdn_url=container.settings.htmx_cdn_url if use_cdn else None,
        htmx_sri=container.settings.htmx_sri if use_cdn else None,
        static_prefix=static_prefix,
        home_url=request.url_for("home").path,
    )


def _home_html(request: Request, container: Container) -> str:
    views = container.apps.list_apps(include_private=_is_admin(request))
    rows = (
        "".join(
            '<li><span class="forge-status-dot forge-status-dot--healthy" '
            'aria-hidden="true"></span><div>'
            f'<a href="{request.url_for("app_page", app_id=view.id)}">'
            f"<strong>{_safe_html(view.title)}</strong></a>"
            f"<span>{_safe_html(view.visibility.title())} dashboard · "
            f'<a href="{request.url_for("surface_gallery", app_id=view.id)}">View modes</a>'
            "</span></div></li>"
            for view in views
        )
        or "<li>No dashboards yet.</li>"
    )
    destination = request.url_for("studio" if _is_admin(request) else "login_page")
    label = "Studio" if _is_admin(request) else "Admin login"
    content = (
        '<div class="forge-page forge-container forge-container--narrow">'
        '<p class="forge-eyebrow">ForgeUI</p><h1>Generated applications</h1>'
        '<p class="forge-subtitle">Approved components, trusted data, and '
        f'server-owned state.</p><p><a href="{destination}">{label}</a></p>'
        f'<section class="forge-section"><h2>Dashboards</h2><ul class="forge-status-list">{rows}</ul>'
        "</section></div>"
    )
    return _shell_html(request, container, title="Generated applications", content=content)


def _render_dashboard(
    request: Request,
    container: Container,
    app_id: str,
    *,
    document: bool,
    surface: SurfaceMode = SurfaceMode.DASHBOARD,
    persistence: PersistenceMode = PersistenceMode.STATEFUL,
    transient_state: Mapping[str, JsonValue] | None = None,
    element_id: str | None = None,
) -> str:
    app = container.apps.get_app(app_id)
    _can_read(request, container, app.visibility)
    revision = container.apps.get_current_manifest(app_id)
    if element_id is not None and element_id not in revision.manifest.elements:
        raise NotFoundError("manifest element not found")
    if persistence is PersistenceMode.STATEFUL:
        session_id = str(request.state.session_id)
        stored_state = container.state.get(app_id, scope="session", scope_key=session_id)
        state_values = stored_state.values
        state_version = stored_state.version
    else:
        state_values = (
            dict(transient_state)
            if transient_state is not None
            else cast(dict[str, JsonValue], dict(revision.manifest.state.values))
        )
        container.state.validate_values(app_id, state_values)
        state_version = 0
    try:
        data: Mapping[str, Any] = container.runtime.fetch(
            revision.manifest.data.source,
            principal=_principal(request),
            app_id=app_id,
            request_id=str(request.state.request_id),
        )
    except SourceError as exc:
        raise DataUnavailableError("registered data source is unavailable") from exc
    context = RenderContext(data=data, state=state_values)
    if not document:
        if element_id is not None:
            return container.renderer.render_element(revision.manifest, element_id, context)
        return container.renderer.render(revision.manifest, context)
    use_cdn = container.settings.asset_mode == "cdn"
    if persistence is PersistenceMode.STATEFUL:
        action_url_template = str(
            request.url_for("execute_action", app_id=app_id, action_id="__ACTION_ID__")
        )
        state_url_template = str(
            request.url_for("update_state", app_id=app_id, key="__STATE_KEY__")
        )
    else:
        action_url_template = str(
            request.url_for("execute_stateless_action", app_id=app_id, action_id="__ACTION_ID__")
        )
        state_url_template = str(
            request.url_for("update_stateless_state", app_id=app_id, key="__STATE_KEY__")
        )
    return container.renderer.render_document(
        revision.manifest,
        context,
        surface=surface,
        persistence=persistence,
        tailwind_cdn_url=container.settings.tailwind_cdn_url if use_cdn else None,
        htmx_cdn_url=container.settings.htmx_cdn_url if use_cdn else None,
        htmx_sri=container.settings.htmx_sri if use_cdn else None,
        csrf_token=str(request.state.csrf_token),
        static_prefix=request.url_for("static", path="").path.rstrip("/"),
        home_url=request.url_for("home").path,
        action_url_template=action_url_template,
        state_url_template=state_url_template,
        state_version=state_version,
        initial_state_json=json.dumps(
            state_values,
            ensure_ascii=False,
            separators=(",", ":"),
            allow_nan=False,
        ),
        element_id=element_id,
    )


def _action_triggers(result: object) -> dict[str, object]:
    modal = getattr(result, "modal", None)
    toast = getattr(result, "toast", None)
    navigation = getattr(result, "navigation", None)
    triggers: dict[str, object] = {}
    if modal:
        triggers["forgeui:dialog"] = {"mode": modal[0], "target": modal[1]}
    if toast:
        triggers["forgeui:toast"] = {"level": toast[0], "message": toast[1]}
    if navigation:
        triggers["forgeui:navigate"] = {"destination": navigation}
    return triggers


def _surface_gallery_html(request: Request, container: Container, app_id: str) -> str:
    app = container.apps.get_app(app_id)
    _can_read(request, container, app.visibility)
    container.apps.get_current_manifest(app_id)
    descriptions = {
        SurfaceMode.DASHBOARD: "Hosted operational dashboard",
        SurfaceMode.STANDALONE: "General responsive web app",
        SurfaceMode.DESKTOP: "Wide desktop web app",
        SurfaceMode.MOBILE: "Single-column mobile web app",
        SurfaceMode.EMBED: "Shell-free application widget",
        SurfaceMode.CHAT: "Compact assistant artifact",
    }
    cards: list[str] = []
    for surface, description in descriptions.items():
        base_url = request.url_for("app_surface", app_id=app_id, surface=surface.value)
        stateful_url = base_url.include_query_params(persistence=PersistenceMode.STATEFUL.value)
        stateless_url = base_url.include_query_params(persistence=PersistenceMode.STATELESS.value)
        preview = ""
        if surface in {SurfaceMode.EMBED, SurfaceMode.CHAT}:
            preview = (
                '<iframe class="forge-surface-frame" '
                f'src="{_safe_html(stateless_url)}" '
                f'title="{_safe_html(surface.value.title())} preview" loading="lazy"></iframe>'
            )
        cards.append(
            '<article class="forge-surface-card">'
            f'<p class="forge-eyebrow">{_safe_html(surface.value)}</p>'
            f"<h2>{_safe_html(surface.value.title())}</h2>"
            f"<p>{_safe_html(description)}</p>"
            '<div class="forge-surface-links">'
            f'<a class="forge-button forge-button--secondary" href="{_safe_html(stateful_url)}">'
            "Stateful</a>"
            f'<a class="forge-button forge-button--quiet" href="{_safe_html(stateless_url)}">'
            "Ephemeral</a></div>"
            f"{preview}</article>"
        )
    content = (
        '<div class="forge-page forge-container forge-container--wide">'
        '<header class="forge-page-header"><p class="forge-eyebrow">Runtime examples</p>'
        f"<h1>{_safe_html(app.title)}</h1>"
        '<p class="forge-subtitle">The same validated manifest across every trusted surface '
        "and state lifetime.</p></header>"
        f'<section class="forge-surface-gallery">{"".join(cards)}</section></div>'
    )
    return _shell_html(request, container, title=f"{app.title} runtime examples", content=content)


def create_router(container: Container, prefix: str = "") -> APIRouter:
    """Return a router that can be mounted under an embedding application's prefix."""

    router = APIRouter(prefix=prefix)

    @router.get("/", name="home", response_class=HTMLResponse)
    def home(request: Request) -> HTMLResponse:
        return HTMLResponse(_home_html(request, container))

    @router.get("/login", response_class=HTMLResponse)
    def login_page(request: Request) -> HTMLResponse:
        token = _safe_html(request.state.csrf_token)
        content = f'<div class="forge-page forge-container forge-container--narrow"><h1>Administrator login</h1><form method="post"><input type="hidden" name="csrf_token" value="{token}"><label>Admin token <input name="token" type="password" required></label><button class="forge-button" type="submit">Sign in</button></form></div>'
        return HTMLResponse(
            _shell_html(request, container, title="Administrator login", content=content)
        )

    @router.post("/login")
    async def login(request: Request) -> Response:
        form = await request.form()
        token = form.get("token")
        configured = container.settings.admin_token
        if (
            configured is None
            or not isinstance(token, str)
            or not hmac.compare_digest(token, configured.get_secret_value())
        ):
            raise HTTPException(401, "invalid administrator credentials")
        response = RedirectResponse(request.url_for("home"), status_code=303)
        request.app.state.set_admin_cookie(response)
        return response

    @router.post("/logout")
    def logout(request: Request) -> Response:
        response = RedirectResponse(request.url_for("home"), status_code=303)
        response.delete_cookie("forgeui_admin", path="/")
        return response

    @router.get("/studio", response_class=HTMLResponse)
    def studio(request: Request) -> HTMLResponse:
        _require_admin(request)
        token = _safe_html(request.state.csrf_token)
        source_options = "".join(
            f'<option value="{_safe_html(source)}">{_safe_html(source)} · '
            f"{_safe_html(contract)}</option>"
            for source, contract in sorted(container.runtime.sources.source_contracts.items())
        )
        content = f'''<div class="forge-page forge-container forge-container--narrow"><p class="forge-eyebrow">ForgeUI studio</p><h1>Create an application</h1><form method="post" action="{request.url_for("studio_generate")}" class="forge-form"><input type="hidden" name="csrf_token" value="{token}"><label>Title<input name="title" maxlength="120" required></label><label>Brief<textarea name="brief" minlength="4" maxlength="4000" required></textarea></label><label>Trusted data source<select name="data_source" required>{source_options}</select></label><fieldset><legend>Design profile</legend>{"".join(f'<label><input type="radio" name="profile" value="{name}" {"checked" if name == "ops-compact" else ""}>{name}</label>' for name in ("ops-compact", "signal-cards", "executive-summary", "calm-neutral"))}</fieldset><button class="forge-button" type="submit">Generate</button></form></div>'''
        return HTMLResponse(
            _shell_html(request, container, title="Create an application", content=content)
        )

    @router.post("/studio/generate", name="studio_generate")
    async def studio_generate(request: Request) -> Response:
        _require_admin(request)
        form = await request.form()
        title, brief, profile = form.get("title"), form.get("brief"), form.get("profile")
        data_source = form.get("data_source")
        data_contract = (
            container.runtime.sources.source_contracts.get(data_source)
            if isinstance(data_source, str)
            else None
        )
        if (
            not isinstance(title, str)
            or not isinstance(brief, str)
            or not isinstance(profile, str)
            or not isinstance(data_source, str)
            or data_contract is None
        ):
            raise HTTPException(422, "invalid studio form")
        try:
            generation_request = GenerationRequest.model_validate(
                {
                    "brief": brief,
                    "profile": profile,
                    "data_source": data_source,
                    "data_contract": data_contract,
                },
                strict=True,
            )
        except ValidationError as exc:
            raise HTTPException(422, "invalid studio form") from exc
        app = container.apps.create_app(title)
        job = container.jobs.create(
            app_id=app.id,
            prompt=generation_request.model_dump(mode="json"),
        )
        return RedirectResponse(request.url_for("job_page", job_id=job.id), status_code=303)

    @router.get("/jobs/{job_id}", name="job_page", response_class=HTMLResponse)
    def job_page(request: Request, job_id: str) -> HTMLResponse:
        _require_admin(request)
        try:
            job = container.jobs.get(job_id)
        except ServiceError as exc:
            raise _service_error(exc) from exc
        body = _job_fragment(request, job)
        return HTMLResponse(
            _shell_html(
                request,
                container,
                title="Dashboard generation",
                content=f'<div class="forge-page forge-container forge-container--narrow">{body}</div>',
            )
        )

    @router.get("/fragments/jobs/{job_id}", response_class=HTMLResponse)
    def job_fragment(request: Request, job_id: str) -> HTMLResponse:
        _require_admin(request)
        try:
            return HTMLResponse(_job_fragment(request, container.jobs.get(job_id)))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.post("/fragments/jobs/{job_id}/cancel", response_class=HTMLResponse)
    def cancel_job(request: Request, job_id: str) -> HTMLResponse:
        _require_admin(request)
        try:
            return HTMLResponse(_job_fragment(request, container.jobs.cancel(job_id)))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.get("/apps/{app_id}", name="app_page", response_class=HTMLResponse)
    def app_page(request: Request, app_id: str) -> HTMLResponse:
        try:
            return HTMLResponse(
                _render_dashboard(
                    request,
                    container,
                    app_id,
                    document=True,
                    surface=SurfaceMode.DASHBOARD,
                    persistence=PersistenceMode.STATEFUL,
                )
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.get(
        "/apps/{app_id}/gallery",
        name="surface_gallery",
        response_class=HTMLResponse,
    )
    def surface_gallery(request: Request, app_id: str) -> HTMLResponse:
        try:
            return HTMLResponse(_surface_gallery_html(request, container, app_id))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.get(
        "/apps/{app_id}/views/{surface}",
        name="app_surface",
        response_class=HTMLResponse,
    )
    def app_surface(
        request: Request,
        app_id: str,
        surface: SurfaceMode,
        persistence: PersistenceMode = PersistenceMode.STATEFUL,
        element: str | None = None,
    ) -> HTMLResponse:
        """Render one trusted surface/persistence combination."""

        try:
            response = HTMLResponse(
                _render_dashboard(
                    request,
                    container,
                    app_id,
                    document=True,
                    surface=surface,
                    persistence=persistence,
                    element_id=element,
                )
            )
            if surface_presentation(surface).embeddable:
                response.headers["X-Forge-Frame-Policy"] = "embeddable"
            return response
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.get("/apps/{app_id}/artifact", response_class=HTMLResponse)
    def chat_artifact(
        request: Request,
        app_id: str,
        element: str | None = None,
    ) -> HTMLResponse:
        """Render the direct embeddable, ephemeral chat surface."""

        try:
            return HTMLResponse(
                _render_dashboard(
                    request,
                    container,
                    app_id,
                    document=True,
                    surface=SurfaceMode.CHAT,
                    persistence=PersistenceMode.STATELESS,
                    element_id=element,
                ),
                headers={"X-Forge-Frame-Policy": "embeddable"},
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.get("/apps/{app_id}/embed", response_class=HTMLResponse)
    def embed_app(
        request: Request,
        app_id: str,
        element: str | None = None,
    ) -> HTMLResponse:
        """Render the direct embeddable, ephemeral app surface."""

        try:
            return HTMLResponse(
                _render_dashboard(
                    request,
                    container,
                    app_id,
                    document=True,
                    surface=SurfaceMode.EMBED,
                    persistence=PersistenceMode.STATELESS,
                    element_id=element,
                ),
                headers={"X-Forge-Frame-Policy": "embeddable"},
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.get("/fragments/apps/{app_id}", response_class=HTMLResponse)
    def app_fragment(
        request: Request,
        app_id: str,
        element: str | None = None,
    ) -> HTMLResponse:
        try:
            return HTMLResponse(
                _render_dashboard(
                    request,
                    container,
                    app_id,
                    document=False,
                    element_id=element,
                )
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.post("/apps/{app_id}/actions/{action_id}", response_class=HTMLResponse)
    async def execute_action(request: Request, app_id: str, action_id: str) -> HTMLResponse:
        _can_read(request, container, container.apps.get_app(app_id).visibility)
        try:
            payload = ActionRequest.model_validate(await request.json(), strict=True)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(422, "invalid action request") from exc
        try:
            result = container.actions.execute(
                app_id,
                action_id,
                scope="session",
                scope_key=str(request.state.session_id),
                expected_version=payload.version,
                event=cast(dict[str, JsonValue], payload.event),
                principal=_principal(request),
                request_id=str(request.state.request_id),
                confirmed=payload.confirmed,
            )
            response = HTMLResponse(_render_dashboard(request, container, app_id, document=False))
            state = container.state.get(
                app_id, scope="session", scope_key=str(request.state.session_id)
            )
            response.headers["X-Forge-State-Version"] = str(state.version)
            triggers = _action_triggers(result)
            if triggers:
                response.headers["HX-Trigger"] = json.dumps(triggers)
            return response
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.post(
        "/apps/{app_id}/stateless/actions/{action_id}",
        name="execute_stateless_action",
    )
    async def execute_stateless_action(
        request: Request, app_id: str, action_id: str
    ) -> JSONResponse:
        _can_read(request, container, container.apps.get_app(app_id).visibility)
        try:
            payload = StatelessActionRequest.model_validate(await request.json(), strict=True)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(422, "invalid stateless action request") from exc
        try:
            supplied = cast(dict[str, JsonValue], payload.state)
            result = container.actions.execute_transient(
                app_id,
                action_id,
                values=supplied,
                event=cast(dict[str, JsonValue], payload.event),
                principal=_principal(request),
                request_id=str(request.state.request_id),
            )
            values = supplied if result.state is None else result.state.values
            return JSONResponse(
                {
                    "html": _render_dashboard(
                        request,
                        container,
                        app_id,
                        document=False,
                        persistence=PersistenceMode.STATELESS,
                        transient_state=values,
                    ),
                    "state": values,
                    "triggers": _action_triggers(result),
                }
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.post("/apps/{app_id}/state/{key}", response_class=HTMLResponse)
    async def update_state(request: Request, app_id: str, key: str) -> HTMLResponse:
        _can_read(request, container, container.apps.get_app(app_id).visibility)
        try:
            payload = StateRequest.model_validate(await request.json(), strict=True)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(422, "invalid state request") from exc
        manifest = container.apps.get_current_manifest(app_id).manifest
        if f"state.{key}" not in manifest.state.writable:
            raise HTTPException(403, "state key is not writable")
        try:
            current = container.state.get(
                app_id, scope="session", scope_key=str(request.state.session_id)
            )
            values = dict(current.values)
            values[key] = cast(JsonValue, payload.value)
            updated = container.state.replace(
                app_id,
                scope="session",
                scope_key=str(request.state.session_id),
                values=values,
                expected_version=payload.version,
            )
            return HTMLResponse(
                _render_dashboard(request, container, app_id, document=False),
                headers={"X-Forge-State-Version": str(updated.version)},
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @router.post(
        "/apps/{app_id}/stateless/state/{key}",
        name="update_stateless_state",
    )
    async def update_stateless_state(request: Request, app_id: str, key: str) -> JSONResponse:
        _can_read(request, container, container.apps.get_app(app_id).visibility)
        try:
            payload = StatelessStateRequest.model_validate(await request.json(), strict=True)
        except (json.JSONDecodeError, ValidationError) as exc:
            raise HTTPException(422, "invalid stateless state request") from exc
        manifest = container.apps.get_current_manifest(app_id).manifest
        if f"state.{key}" not in manifest.state.writable:
            raise HTTPException(403, "state key is not writable")
        try:
            values = cast(dict[str, JsonValue], dict(payload.state))
            container.state.validate_values(app_id, values)
            values[key] = cast(JsonValue, payload.value)
            container.state.validate_values(app_id, values)
            return JSONResponse(
                {
                    "html": _render_dashboard(
                        request,
                        container,
                        app_id,
                        document=False,
                        persistence=PersistenceMode.STATELESS,
                        transient_state=values,
                    ),
                    "state": values,
                    "triggers": {},
                }
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    api = APIRouter(prefix="/api")

    @api.get("/health/live")
    def health_live() -> dict[str, str]:
        return {"status": "live"}

    @api.get("/health/ready")
    def health_ready() -> JSONResponse:
        try:
            container.database.ping()
        except Exception:
            return JSONResponse({"status": "not_ready"}, status_code=503)
        return JSONResponse({"status": "ready"})

    @api.get("/health/dependencies")
    async def health_dependencies() -> JSONResponse:
        try:
            container.database.ping()
            database_ready = True
        except Exception:
            database_ready = False
        try:
            healthy = await container.provider.health()
        except Exception:
            healthy = False
        return JSONResponse(
            {
                "database": "ready" if database_ready else "unavailable",
                "ollama": "ready" if healthy else "unavailable",
            },
            status_code=200 if healthy and database_ready else 503,
        )

    @api.get("/metrics")
    def metrics() -> Response:
        body, content_type = container.metrics.render()
        return Response(body, headers={"Content-Type": content_type})

    @api.get("/catalog")
    def catalog(request: Request) -> dict[str, object]:
        result: dict[str, object] = {"components": component_registry.prompt_docs()}
        if _is_admin(request):
            result.update(
                {
                    "data_contracts": container.runtime.contracts.docs(),
                    "data_sources": container.runtime.sources.source_contracts,
                    "capabilities": sorted(container.runtime.capabilities.names),
                }
            )
        return result

    @api.post("/validate")
    def validate(payload: ManifestRequest) -> dict[str, object]:
        def dry_render(manifest: ForgeManifest) -> None:
            output = container.renderer.render(
                manifest,
                RenderContext(
                    data=container.runtime.dry_run_data(manifest.data.contract),
                    state=manifest.state.values,
                ),
            )
            if "forge-render-error" in output:
                raise ValueError("manifest produced a component fallback during dry render")

        report = validate_manifest(
            payload.manifest,
            dry_render=dry_render,
            policy=container.runtime.policy,
        )
        return {"valid": report.valid, "issues": [issue.as_dict() for issue in report.issues]}

    @api.post("/a2ui/import")
    async def import_a2ui(request: Request) -> JSONResponse:
        """Translate one bounded A2UI snapshot without persisting it."""

        _require_admin(request)
        content_type = request.headers.get("content-type", "").partition(";")[0].strip().lower()
        if content_type != A2UI_MIME_TYPE:
            raise HTTPException(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                f"content type must be {A2UI_MIME_TYPE}",
            )
        try:
            adaptation = adapt_a2ui_jsonl(await request.body())
        except A2UIAdapterError as exc:
            return JSONResponse(
                {
                    "valid": False,
                    "error": {
                        "code": exc.code,
                        "path": exc.path,
                        "message": exc.message,
                    },
                },
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            )
        return JSONResponse(
            {
                "valid": True,
                "surface_id": adaptation.surface_id,
                "manifest": adaptation.manifest.model_dump(mode="json"),
                "data_model": (
                    adaptation.data_model.model_dump(mode="json")
                    if adaptation.data_model is not None
                    else None
                ),
            }
        )

    @api.get("/apps")
    def list_apps(request: Request) -> dict[str, object]:
        return {
            "items": [
                _view_app(item)
                for item in container.apps.list_apps(include_private=_is_admin(request))
            ]
        }

    @api.post("/apps", status_code=201)
    def create_app(request: Request, payload: AppCreateRequest) -> dict[str, object]:
        _require_admin(request)
        try:
            return _view_app(
                container.apps.create_app(payload.title, visibility=payload.visibility)
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.get("/apps/{app_id}")
    def get_app(request: Request, app_id: str) -> JSONResponse:
        try:
            app = container.apps.get_app(app_id)
            _can_read(request, container, app.visibility)
            return JSONResponse(_view_app(app), headers=_etag(app.current_revision_id))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.patch("/apps/{app_id}")
    def patch_app(request: Request, app_id: str, payload: AppUpdateRequest) -> dict[str, object]:
        _require_admin(request)
        try:
            return _view_app(
                container.apps.update_app(
                    app_id, title=payload.title, visibility=payload.visibility
                )
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.delete("/apps/{app_id}", status_code=204)
    def delete_app(request: Request, app_id: str) -> Response:
        _require_admin(request)
        try:
            container.apps.delete_app(app_id)
        except ServiceError as exc:
            raise _service_error(exc) from exc
        return Response(status_code=204)

    @api.put("/apps/{app_id}/manifest")
    def save_manifest(request: Request, app_id: str, payload: ManifestRequest) -> JSONResponse:
        _require_admin(request)
        try:
            revision = container.apps.save_manifest(
                app_id, payload.manifest, expected_revision_id=_if_match(request), created_by="api"
            )
            return JSONResponse(_view_revision(revision), headers=_etag(revision.id))
        except InvalidManifestError as exc:
            return JSONResponse(
                {
                    "detail": "manifest validation failed",
                    "issues": [issue.as_dict() for issue in exc.report.issues],
                },
                status_code=422,
            )
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.get("/apps/{app_id}/current")
    def current_manifest(request: Request, app_id: str) -> JSONResponse:
        try:
            app = container.apps.get_app(app_id)
            _can_read(request, container, app.visibility)
            revision = container.apps.get_current_manifest(app_id)
            return JSONResponse(_view_revision(revision), headers=_etag(revision.id))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.get("/apps/{app_id}/revisions")
    def revisions(request: Request, app_id: str) -> dict[str, object]:
        try:
            app = container.apps.get_app(app_id)
            _can_read(request, container, app.visibility)
            return {
                "items": [_view_revision(item) for item in container.apps.list_revisions(app_id)]
            }
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.post("/apps/{app_id}/revisions/{revision_id}/restore")
    def restore(
        request: Request, app_id: str, revision_id: str, payload: RestoreRequest
    ) -> JSONResponse:
        _require_admin(request)
        try:
            expected = payload.expected_revision_id or _if_match(request)
            revision = container.apps.restore_revision(
                app_id, revision_id, expected_revision_id=expected, created_by="api"
            )
            return JSONResponse(_view_revision(revision), headers=_etag(revision.id))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.post("/apps/{app_id}/generation", status_code=202)
    def create_generation(
        request: Request, app_id: str, payload: GenerationRequest
    ) -> dict[str, object]:
        _require_admin(request)
        try:
            return _view_job(
                container.jobs.create(app_id=app_id, prompt=payload.model_dump(mode="json"))
            )
        except (ServiceError, ValueError) as exc:
            raise (
                _service_error(exc)
                if isinstance(exc, ServiceError)
                else HTTPException(422, "invalid generation request")
            ) from exc

    @api.get("/generation/{job_id}")
    def get_generation(request: Request, job_id: str) -> dict[str, object]:
        _require_admin(request)
        try:
            return _view_job(container.jobs.get(job_id))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.post("/generation/{job_id}/cancel")
    def cancel_generation(request: Request, job_id: str) -> dict[str, object]:
        _require_admin(request)
        try:
            return _view_job(container.jobs.cancel(job_id))
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.post("/device-snapshots", status_code=201)
    def push_snapshot(
        request: Request, payload: DeviceHealthSnapshot, app_id: str | None = None
    ) -> dict[str, object]:
        _require_admin(request)
        try:
            snapshot = container.devices.push(payload, app_id=app_id)
            return {"id": snapshot.id, "checksum": snapshot.checksum, "app_id": snapshot.app_id}
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.get("/device-snapshots/latest")
    def latest_snapshot(request: Request, app_id: str | None = None) -> dict[str, object]:
        _require_admin(request)
        snapshot = container.devices.latest(app_id=app_id)
        if snapshot is None:
            raise HTTPException(404, "no snapshot available")
        return {
            "id": snapshot.id,
            "checksum": snapshot.checksum,
            "snapshot": snapshot.snapshot.model_dump(mode="json"),
        }

    @api.post("/device-snapshots/query")
    def query_snapshot(
        request: Request, payload: DeviceQueryRequest, app_id: str | None = None
    ) -> dict[str, object]:
        _require_admin(request)
        try:
            page = container.devices.query_devices(
                app_id=app_id,
                filters=payload.filters,
                projection=payload.projection,
                offset=payload.offset,
                limit=payload.limit,
            )
            return {
                "snapshot_id": page.snapshot_id,
                "checksum": page.checksum,
                "offset": page.offset,
                "limit": page.limit,
                "total": page.total,
                "rows": page.rows,
            }
        except ServiceError as exc:
            raise _service_error(exc) from exc

    @api.get("/apps/{app_id}/data")
    def app_data(request: Request, app_id: str) -> dict[str, object]:
        app = container.apps.get_app(app_id)
        _can_read(request, container, app.visibility)
        revision = container.apps.get_current_manifest(app_id)
        try:
            data = container.runtime.fetch(
                revision.manifest.data.source,
                principal=_principal(request),
                app_id=app_id,
                request_id=str(request.state.request_id),
            )
        except SourceError as exc:
            raise _service_error(
                DataUnavailableError("registered data source is unavailable")
            ) from exc
        return {
            "source": revision.manifest.data.source,
            "contract": revision.manifest.data.contract,
            "snapshot": data,
        }

    router.include_router(api)
    return router


def _job_fragment(request: Request, job: GenerationJobView) -> str:
    detail = f"<p>Progress: {_safe_html(job.progress)}% · attempt {_safe_html(job.attempt)}</p>"
    attributes = ""
    if job.status in {"queued", "running"}:
        url = request.url_for("job_fragment", job_id=job.id)
        cancel_url = request.url_for("cancel_job", job_id=job.id)
        attributes = f' hx-get="{url}" hx-trigger="every 1s" hx-swap="outerHTML"'
        detail += (
            f"<p>{_safe_html(job.status.title())}</p>"
            f'<button class="forge-button forge-button--quiet" type="button" '
            f'hx-post="{cancel_url}" hx-target="#forge-job-{_safe_html(job.id)}" '
            'hx-swap="outerHTML">Cancel generation</button>'
        )
    elif job.status == "succeeded" and job.app_id:
        url = request.url_for("app_page", app_id=job.app_id)
        detail += f'<p><a href="{url}">Open dashboard</a></p>'
    elif job.error_code:
        detail += f'<p role="alert">Generation failed safely: {_safe_html(job.error_code)}</p>'
    return (
        f'<section id="forge-job-{_safe_html(job.id)}" class="forge-card"{attributes}>'
        f"<h1>Generation {_safe_html(job.status)}</h1>{detail}</section>"
    )
