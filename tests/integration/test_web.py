from __future__ import annotations

import asyncio
import json
import threading
import time
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup
from fastapi import FastAPI
from fastapi.testclient import TestClient

from forgeui.a2ui import A2UI_MIME_TYPE
from forgeui.app import create_app, mount_forgeui
from forgeui.config import Settings
from forgeui.llm import ScriptedProvider
from forgeui.llm.types import ChatMessage, ProviderResponse


def _settings() -> Settings:
    return Settings(
        environment="test",
        database_url="sqlite:///:memory:",
        admin_token="test-token",
    )


def _manifest(title: str = "Fleet") -> dict[str, object]:
    return {
        "metadata": {"title": title},
        "design": {"name": "ops-compact"},
        "root": "page",
        "elements": {
            "page": {"type": "page", "children": ["heading"]},
            "heading": {"type": "heading", "props": {"text": title, "level": 1}},
        },
    }


def _admin() -> dict[str, str]:
    return {"Authorization": "Bearer test-token"}


def _interactive_manifest() -> dict[str, object]:
    return {
        "metadata": {"title": "Interactive fleet"},
        "design": {"name": "ops-compact"},
        "state": {
            "values": {"enabled": False},
            "writable": ["state.enabled"],
        },
        "root": "page",
        "elements": {
            "page": {"type": "page", "children": ["toggle-button", "enabled"]},
            "toggle-button": {
                "type": "button",
                "props": {"label": "Toggle alerts"},
                "action": "toggle-alerts",
            },
            "enabled": {
                "type": "toggle",
                "props": {"state_path": "state.enabled", "label": "Alerts enabled"},
            },
        },
        "actions": {
            "toggle-alerts": {"type": "toggle_state", "path": "state.enabled"},
        },
    }


def _csrf(html: str) -> str:
    value = BeautifulSoup(html, "html.parser").select_one('meta[name="csrf-token"]')
    assert value is not None
    token = value.get("content")
    assert isinstance(token, str)
    return token


def test_a2ui_import_is_authenticated_typed_and_non_persisting() -> None:
    payload = (
        Path(__file__).parents[1]
        / "contracts"
        / "a2ui"
        / "fixtures"
        / "device_health_dashboard_v0_9_1.jsonl"
    ).read_bytes()
    typed_admin = {**_admin(), "Content-Type": A2UI_MIME_TYPE}

    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        assert (
            client.post(
                "/api/a2ui/import",
                headers={"Content-Type": A2UI_MIME_TYPE},
                content=payload,
            ).status_code
            == 403
        )
        assert (
            client.post(
                "/api/a2ui/import",
                headers={**_admin(), "Content-Type": "application/json"},
                content=payload,
            ).status_code
            == 415
        )

        imported = client.post("/api/a2ui/import", headers=typed_admin, content=payload)
        assert imported.status_code == 200
        assert imported.json()["valid"] is True
        assert imported.json()["manifest"]["spec"] == "forgeui/1"
        assert imported.json()["data_model"]["contract"] == "device-health/1"
        assert client.get("/api/apps", headers=_admin()).json() == {"items": []}

        unsupported = payload.replace(b'"v0.9.1"', b'"v1.0"', 1)
        rejected = client.post("/api/a2ui/import", headers=typed_admin, content=unsupported)
        assert rejected.status_code == 422
        assert rejected.json()["error"]["code"] == "unsupported_version"


def test_api_crud_public_read_and_etag() -> None:
    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        created = client.post("/api/apps", headers=_admin(), json={"title": "Fleet"})
        assert created.status_code == 201
        app_id = created.json()["id"]
        saved = client.put(
            f"/api/apps/{app_id}/manifest", headers=_admin(), json={"manifest": _manifest()}
        )
        assert saved.status_code == 200
        assert saved.headers["etag"]
        assert client.get(f"/api/apps/{app_id}").status_code == 404
        changed = client.patch(
            f"/api/apps/{app_id}", headers=_admin(), json={"visibility": "public"}
        )
        assert changed.status_code == 200
        current = client.get(f"/api/apps/{app_id}/current")
        assert current.status_code == 200
        assert current.json()["manifest"]["metadata"]["title"] == "Fleet"
        assert client.get(f"/apps/{app_id}").status_code == 200


def test_browser_mutations_require_csrf_and_worker_persists_valid_result() -> None:
    candidate = json.dumps(_manifest("Generated"))
    with TestClient(create_app(_settings(), ScriptedProvider([candidate]))) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Draft"}).json()["id"]
        assert (
            client.post(f"/api/apps/{app_id}/generation", json={"brief": "make fleet"}).status_code
            == 403
        )
        queued = client.post(
            f"/api/apps/{app_id}/generation",
            headers=_admin(),
            json={"brief": "make fleet", "profile": "ops-compact"},
        )
        assert queued.status_code == 202
        job_id = queued.json()["id"]
        for _ in range(30):
            job = client.get(f"/api/generation/{job_id}", headers=_admin()).json()
            if job["status"] in {"succeeded", "failed"}:
                break
            time.sleep(0.03)
        assert job["status"] == "succeeded"
        assert client.get(f"/apps/{app_id}", headers=_admin()).status_code == 200


def test_shell_loads_htmx_theme_assets_and_wires_public_session_state() -> None:
    settings = _settings().model_copy(update={"asset_mode": "cdn"})
    with TestClient(create_app(settings, ScriptedProvider([]))) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Fleet"}).json()["id"]
        assert (
            client.put(
                f"/api/apps/{app_id}/manifest",
                headers=_admin(),
                json={"manifest": _interactive_manifest()},
            ).status_code
            == 200
        )
        assert (
            client.patch(
                f"/api/apps/{app_id}",
                headers=_admin(),
                json={"visibility": "public"},
            ).status_code
            == 200
        )

        page = client.get(f"/apps/{app_id}")
        assert page.status_code == 200
        assert "htmx.org@2.0.10" in page.text
        assert "/static/forgeui.js" in page.text
        document = BeautifulSoup(page.text, "html.parser")
        main = document.select_one("#forge-main")
        assert main is not None
        assert "__ACTION_ID__" in str(main.get("data-forge-action-url"))
        assert main.get("data-forge-state-version") == "0"
        csrf = _csrf(page.text)

        bypass = client.post(
            f"/apps/{app_id}/actions/toggle-alerts",
            headers={"Authorization": "Bearer definitely-wrong"},
            json={"version": 0, "event": {}},
        )
        assert bypass.status_code == 403

        toggled = client.post(
            f"/apps/{app_id}/actions/toggle-alerts",
            headers={"X-CSRF-Token": csrf},
            json={"version": 0, "event": {}},
        )
        assert toggled.status_code == 200
        assert toggled.headers["x-forge-state-version"] == "1"
        assert 'name="state.enabled" checked' in toggled.text

        changed = client.post(
            f"/apps/{app_id}/state/enabled",
            headers={"X-CSRF-Token": csrf},
            json={"version": 1, "value": False},
        )
        assert changed.status_code == 200
        assert changed.headers["x-forge-state-version"] == "2"
        assert 'name="state.enabled" checked' not in changed.text


def test_all_surface_and_persistence_combinations_are_first_class() -> None:
    surfaces = {"dashboard", "standalone", "desktop", "mobile", "embed", "chat"}
    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Fleet"}).json()["id"]
        client.put(
            f"/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": _interactive_manifest()},
        )
        client.patch(
            f"/api/apps/{app_id}",
            headers=_admin(),
            json={"visibility": "public"},
        )

        for surface in surfaces:
            for persistence in {"stateful", "stateless"}:
                page = client.get(
                    f"/apps/{app_id}/views/{surface}",
                    params={"persistence": persistence},
                )
                assert page.status_code == 200
                document = BeautifulSoup(page.text, "html.parser")
                html = document.select_one("html")
                main = document.select_one("#forge-main")
                assert html is not None
                assert main is not None
                assert html.get("data-forge-surface") == surface
                assert html.get("data-forge-persistence") == persistence
                assert main.get("data-forge-persistence") == persistence
                assert bool(document.select_one(".forge-shell-header")) == (
                    surface not in {"embed", "chat"}
                )
                if persistence == "stateless":
                    assert "/stateless/actions/" in str(main.get("data-forge-action-url"))
                    assert bool(document.select_one(".forge-mode-note")) == (surface != "embed")
                else:
                    assert "/stateless/" not in str(main.get("data-forge-action-url"))
                    assert document.select_one(".forge-mode-note") is None

        artifact = client.get(f"/apps/{app_id}/artifact")
        assert artifact.status_code == 200
        assert 'data-forge-surface="chat"' in artifact.text
        assert 'data-forge-persistence="stateless"' in artifact.text
        assert artifact.headers["x-frame-options"] == "SAMEORIGIN"
        assert "frame-ancestors 'self'" in artifact.headers["content-security-policy"]
        assert "x-forge-frame-policy" not in artifact.headers

        dashboard = client.get(f"/apps/{app_id}")
        assert dashboard.headers["x-frame-options"] == "DENY"
        assert "frame-ancestors 'none'" in dashboard.headers["content-security-policy"]

        gallery = client.get(f"/apps/{app_id}/gallery")
        gallery_document = BeautifulSoup(gallery.text, "html.parser")
        assert gallery.status_code == 200
        assert len(gallery_document.select(".forge-surface-card")) == 6
        frames = gallery_document.select("iframe.forge-surface-frame")
        assert len(frames) == 2
        assert {str(frame.get("title")) for frame in frames} == {
            "Embed preview",
            "Chat preview",
        }


def test_embed_and_fragment_can_render_one_manifest_card() -> None:
    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Fleet"}).json()["id"]
        client.put(
            f"/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": _interactive_manifest()},
        )
        client.patch(
            f"/api/apps/{app_id}",
            headers=_admin(),
            json={"visibility": "public"},
        )

        embed = client.get(f"/apps/{app_id}/embed", params={"element": "enabled"})
        assert embed.status_code == 200
        assert "data-forge-root" in embed.text
        assert 'id="forge-element-enabled"' in embed.text
        assert 'id="forge-element-toggle-button"' not in embed.text
        assert "Temporary view" not in embed.text
        assert embed.headers["x-frame-options"] == "SAMEORIGIN"

        fragment = client.get(
            f"/fragments/apps/{app_id}",
            params={"element": "enabled"},
        )
        assert fragment.status_code == 200
        assert 'id="forge-element-enabled"' in fragment.text
        assert "<html" not in fragment.text

        assert client.get(f"/apps/{app_id}/embed", params={"element": "missing"}).status_code == 404


def test_stateless_interactions_are_ephemeral_validated_and_csrf_free() -> None:
    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Fleet"}).json()["id"]
        client.put(
            f"/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": _interactive_manifest()},
        )
        client.patch(
            f"/api/apps/{app_id}",
            headers=_admin(),
            json={"visibility": "public"},
        )

        page = client.get(
            f"/apps/{app_id}/views/mobile",
            params={"persistence": "stateless"},
        )
        main = BeautifulSoup(page.text, "html.parser").select_one("#forge-main")
        assert main is not None
        state = json.loads(str(main.get("data-forge-state")))
        assert state == {"enabled": False}

        toggled = client.post(
            f"/apps/{app_id}/stateless/actions/toggle-alerts",
            json={"state": state, "event": {}},
        )
        assert toggled.status_code == 200
        assert toggled.json()["state"] == {"enabled": True}
        assert 'name="state.enabled" checked' in toggled.json()["html"]

        changed = client.post(
            f"/apps/{app_id}/stateless/state/enabled",
            json={"state": toggled.json()["state"], "value": False},
        )
        assert changed.status_code == 200
        assert changed.json()["state"] == {"enabled": False}

        rejected = client.post(
            f"/apps/{app_id}/stateless/state/enabled",
            json={"state": {"enabled": "not-a-boolean"}, "value": True},
        )
        assert rejected.status_code == 403

        reloaded = client.get(
            f"/apps/{app_id}/views/mobile",
            params={"persistence": "stateless"},
        )
        reloaded_main = BeautifulSoup(reloaded.text, "html.parser").select_one("#forge-main")
        assert reloaded_main is not None
        assert json.loads(str(reloaded_main.get("data-forge-state"))) == {"enabled": False}


def test_configured_chat_frame_ancestor_is_exact_and_drops_conflicting_xfo() -> None:
    settings = _settings().model_copy(
        update={"frame_ancestors": ["'self'", "https://chat.example.test"]}
    )
    with TestClient(create_app(settings, ScriptedProvider([]))) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Fleet"}).json()["id"]
        client.put(
            f"/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": _manifest()},
        )
        client.patch(
            f"/api/apps/{app_id}",
            headers=_admin(),
            json={"visibility": "public"},
        )
        artifact = client.get(f"/apps/{app_id}/artifact")
        assert artifact.status_code == 200
        assert "x-frame-options" not in artifact.headers
        assert (
            "frame-ancestors 'self' https://chat.example.test"
            in artifact.headers["content-security-policy"]
        )


class _BlockingProvider:
    def __init__(self) -> None:
        self.started = threading.Event()
        self.cancelled = threading.Event()

    async def health(self) -> bool:
        return True

    async def complete(
        self,
        messages: tuple[ChatMessage, ...],
        *,
        schema: dict[str, Any],
    ) -> ProviderResponse:
        del messages, schema
        self.started.set()
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            self.cancelled.set()
            raise


def test_job_page_polls_its_section_and_cancellation_aborts_provider() -> None:
    provider = _BlockingProvider()
    settings = _settings().model_copy(update={"asset_mode": "cdn"})
    with TestClient(create_app(settings, provider)) as client:
        app_id = client.post("/api/apps", headers=_admin(), json={"title": "Draft"}).json()["id"]
        queued = client.post(
            f"/api/apps/{app_id}/generation",
            headers=_admin(),
            json={"brief": "make a fleet dashboard", "profile": "ops-compact"},
        )
        job_id = queued.json()["id"]
        assert provider.started.wait(timeout=2)

        job_page = client.get(f"/jobs/{job_id}", headers=_admin())
        assert job_page.status_code == 200
        assert "htmx.org@2.0.10" in job_page.text
        document = BeautifulSoup(job_page.text, "html.parser")
        job_section = document.select_one(f"#forge-job-{job_id}")
        assert job_section is not None
        assert job_section.get("hx-swap") == "outerHTML"
        assert job_section.get("hx-trigger") == "every 1s"
        assert job_section.select_one("button[hx-post]") is not None

        cancelled = client.post(f"/api/generation/{job_id}/cancel", headers=_admin())
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] == "cancelled"
        assert provider.cancelled.wait(timeout=2)
        assert client.get(f"/api/generation/{job_id}", headers=_admin()).json()["status"] == (
            "cancelled"
        )


def test_admin_login_studio_and_logout_flow() -> None:
    settings = _settings().model_copy(update={"asset_mode": "cdn"})
    with TestClient(create_app(settings, ScriptedProvider([]))) as client:
        login_page = client.get("/login")
        assert login_page.status_code == 200
        assert "htmx.org@2.0.10" in login_page.text
        csrf = _csrf(login_page.text)

        denied = client.post(
            "/login",
            data={"csrf_token": csrf, "token": "wrong"},
            follow_redirects=False,
        )
        assert denied.status_code == 401
        signed_in = client.post(
            "/login",
            data={"csrf_token": csrf, "token": "test-token"},
            follow_redirects=False,
        )
        assert signed_in.status_code == 303
        assert "forgeui_admin" in signed_in.cookies

        studio = client.get("/studio")
        assert studio.status_code == 200
        assert all(
            profile in studio.text
            for profile in (
                "ops-compact",
                "signal-cards",
                "executive-summary",
                "calm-neutral",
            )
        )
        studio_csrf = _csrf(studio.text)
        invalid = client.post(
            "/studio/generate",
            data={
                "csrf_token": studio_csrf,
                "title": "Fleet",
                "brief": "make a useful fleet dashboard",
                "profile": "untrusted-profile",
            },
            follow_redirects=False,
        )
        assert invalid.status_code == 422

        logged_out = client.post(
            "/logout",
            headers={"X-CSRF-Token": studio_csrf},
            follow_redirects=False,
        )
        assert logged_out.status_code == 303
        assert client.get("/studio").status_code == 401


def test_complete_manifest_revision_and_device_data_api_lifecycle() -> None:
    snapshot = json.loads(
        (Path(__file__).parents[2] / "examples/data/device-health.json").read_text()
    )
    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        assert client.get("/api/health/ready").json() == {"status": "ready"}
        assert client.get("/api/health/dependencies").status_code == 200
        catalog = client.get("/api/catalog")
        assert catalog.status_code == 200
        assert len(catalog.json()["components"]) == 48

        validation = client.post(
            "/api/validate",
            headers=_admin(),
            json={"manifest": _interactive_manifest()},
        )
        assert validation.status_code == 200
        assert validation.json()["valid"] is True
        invalid_validation = client.post(
            "/api/validate",
            headers=_admin(),
            json={"manifest": {"root": "missing"}},
        )
        assert invalid_validation.json()["valid"] is False

        created = client.post(
            "/api/apps",
            headers=_admin(),
            json={"title": "Lifecycle", "visibility": "private"},
        )
        app_id = created.json()["id"]
        assert any(
            item["id"] == app_id
            for item in client.get("/api/apps", headers=_admin()).json()["items"]
        )
        assert client.get(f"/api/apps/{app_id}", headers=_admin()).status_code == 200
        invalid_save = client.put(
            f"/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": {"root": "missing"}},
        )
        assert invalid_save.status_code == 422

        first = client.put(
            f"/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": _interactive_manifest()},
        )
        first_id = first.json()["id"]
        changed_manifest = _interactive_manifest()
        changed_manifest["metadata"] = {"title": "Changed"}
        second = client.put(
            f"/api/apps/{app_id}/manifest",
            headers={**_admin(), "If-Match": first.headers["etag"]},
            json={"manifest": changed_manifest},
        )
        second_id = second.json()["id"]
        stale = client.put(
            f"/api/apps/{app_id}/manifest",
            headers={**_admin(), "If-Match": first_id},
            json={"manifest": _interactive_manifest()},
        )
        assert stale.status_code == 409
        assert client.get(f"/api/apps/{app_id}/current", headers=_admin()).json()["id"] == (
            second_id
        )
        revisions = client.get(f"/api/apps/{app_id}/revisions", headers=_admin())
        assert len(revisions.json()["items"]) == 2
        restored = client.post(
            f"/api/apps/{app_id}/revisions/{first_id}/restore",
            headers={**_admin(), "If-Match": second_id},
            json={},
        )
        assert restored.status_code == 200
        assert restored.json()["manifest"]["metadata"]["title"] == "Interactive fleet"

        pushed = client.post(
            f"/api/device-snapshots?app_id={app_id}",
            headers=_admin(),
            json=snapshot,
        )
        assert pushed.status_code == 201
        latest = client.get(f"/api/device-snapshots/latest?app_id={app_id}", headers=_admin())
        assert latest.status_code == 200
        assert latest.json()["snapshot"]["contract"] == "device-health/1"
        queried = client.post(
            f"/api/device-snapshots/query?app_id={app_id}",
            headers=_admin(),
            json={
                "filters": {"status": "critical"},
                "projection": ["id", "name", "status"],
                "offset": 0,
                "limit": 10,
            },
        )
        assert queried.status_code == 200
        assert queried.json()["total"] >= 1
        assert set(queried.json()["rows"][0]) == {"id", "name", "status"}
        assert client.get(f"/api/apps/{app_id}/data", headers=_admin()).status_code == 200
        assert client.get(f"/fragments/apps/{app_id}", headers=_admin()).status_code == 200

        patched = client.patch(
            f"/api/apps/{app_id}",
            headers=_admin(),
            json={"title": "Renamed", "visibility": "public"},
        )
        assert patched.json()["title"] == "Renamed"
        assert "Renamed" in client.get("/").text
        assert client.get(f"/api/apps/{app_id}").status_code == 200
        assert (
            client.post(
                f"/apps/{app_id}/actions/missing",
                headers={"X-CSRF-Token": _csrf(client.get(f"/apps/{app_id}").text)},
                json={"version": 0, "event": {}},
            ).status_code
            == 404
        )

        assert client.delete(f"/api/apps/{app_id}", headers=_admin()).status_code == 204
        assert client.get(f"/api/apps/{app_id}", headers=_admin()).status_code == 404


class _UnavailableProvider(ScriptedProvider):
    async def health(self) -> bool:
        return False


def test_ollama_outage_does_not_break_readiness_or_mounting() -> None:
    host = FastAPI()
    host.mount("/forgeui", create_app(_settings(), _UnavailableProvider([])))
    with TestClient(host) as client:
        assert client.get("/forgeui/api/health/live").status_code == 200
        assert client.get("/forgeui/api/health/ready").status_code == 200
        dependency = client.get("/forgeui/api/health/dependencies")
        assert dependency.status_code == 503
        assert dependency.json()["ollama"] == "unavailable"
        metrics = client.get("/forgeui/api/metrics")
        assert metrics.status_code == 200
        assert "forgeui_http_requests_total" in metrics.text


def test_mounted_app_generates_prefixed_embed_assets_and_routes() -> None:
    host = FastAPI()
    mount_forgeui(
        host,
        "/tools/forgeui",
        settings=_settings(),
        provider=ScriptedProvider([]),
    )
    with TestClient(host) as client:
        app_id = client.post(
            "/tools/forgeui/api/apps",
            headers=_admin(),
            json={"title": "Mounted fleet"},
        ).json()["id"]
        client.put(
            f"/tools/forgeui/api/apps/{app_id}/manifest",
            headers=_admin(),
            json={"manifest": _interactive_manifest()},
        )
        client.patch(
            f"/tools/forgeui/api/apps/{app_id}",
            headers=_admin(),
            json={"visibility": "public"},
        )

        embed = client.get(
            f"/tools/forgeui/apps/{app_id}/embed",
            params={"element": "enabled"},
        )
        assert embed.status_code == 200
        assert 'href="/tools/forgeui/static/forgeui.css?' in embed.text
        assert 'src="/tools/forgeui/static/forgeui.js?' in embed.text
        assert client.get("/tools/forgeui/static/forgeui-embed.js").status_code == 200


def test_self_hosted_asset_mode_has_no_remote_runtime_dependency() -> None:
    settings = _settings().model_copy(update={"asset_mode": "self-hosted"})
    with TestClient(create_app(settings, ScriptedProvider([]))) as client:
        page = client.get("/")
        assert page.status_code == 200
        assert "cdn.jsdelivr.net" not in page.text
        assert "/static/forgeui.js" in page.text
        csp = page.headers["content-security-policy"]
        assert "https://cdn.jsdelivr.net" not in csp


def test_large_static_assets_are_gzip_compressed() -> None:
    with TestClient(create_app(_settings(), ScriptedProvider([]))) as client:
        stylesheet = client.get(
            "/static/forgeui.css",
            headers={"Accept-Encoding": "gzip"},
        )
        assert stylesheet.status_code == 200
        assert stylesheet.headers["content-encoding"] == "gzip"
