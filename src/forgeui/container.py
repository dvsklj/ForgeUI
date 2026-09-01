"""Explicit dependency container for a mountable ForgeUI instance."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import cast

from forgeui.config import Settings
from forgeui.data import Database, ForgeRepository
from forgeui.data.repositories import JsonValue
from forgeui.domain.models import ForgeManifest
from forgeui.llm import GenerationEngine, LLMProvider
from forgeui.observability import Metrics
from forgeui.renderer import RenderContext, Renderer
from forgeui.runtime import RuntimeRegistries, device_health_runtime
from forgeui.security import Principal
from forgeui.services import (
    ActionService,
    AppService,
    AuditService,
    DataUnavailableError,
    DeviceHealthService,
    GenerationJobService,
    StateService,
)
from forgeui.sources import SourceError


@dataclass(slots=True)
class Container:
    settings: Settings
    database: Database
    repository: ForgeRepository
    renderer: Renderer
    provider: LLMProvider
    engine: GenerationEngine
    apps: AppService
    jobs: GenerationJobService
    devices: DeviceHealthService
    state: StateService
    actions: ActionService
    audit: AuditService
    metrics: Metrics
    runtime: RuntimeRegistries


def create_container(
    settings: Settings,
    *,
    provider: LLMProvider | None = None,
    database: Database | None = None,
    runtime: RuntimeRegistries | None = None,
) -> Container:
    """Create isolated infrastructure; callers own schema initialization and lifetime."""

    owned_database = database or Database(settings.database_url)
    repository = ForgeRepository(owned_database)
    renderer = Renderer()

    devices = DeviceHealthService(repository)
    active_runtime = (runtime or device_health_runtime(devices)).freeze()
    manifest_policy = active_runtime.policy

    def dry_render(manifest: ForgeManifest) -> None:
        output = renderer.render(
            manifest,
            RenderContext(
                data=active_runtime.dry_run_data(manifest.data.contract),
                state=manifest.state.values,
            ),
        )
        if "forge-render-error" in output:
            raise ValueError("manifest produced a component fallback during dry render")

    apps = AppService(
        repository,
        dry_render=dry_render,
        manifest_policy=manifest_policy,
    )
    state = StateService(repository, apps)

    def resolve_action_data(
        app_id: str,
        source_id: str,
        principal: Principal,
        request_id: str,
    ) -> Mapping[str, JsonValue]:
        try:
            return cast(
                Mapping[str, JsonValue],
                active_runtime.fetch(
                    source_id,
                    principal=principal,
                    app_id=app_id,
                    request_id=request_id,
                ),
            )
        except SourceError as exc:
            raise DataUnavailableError("registered data source is unavailable") from exc

    actions = ActionService(
        apps,
        state,
        devices=devices,
        capabilities=active_runtime.capabilities,
        data_resolver=resolve_action_data,
    )
    if provider is None:
        from forgeui.llm.ollama import OllamaProvider

        selected_provider: LLMProvider = OllamaProvider(settings)
    else:
        selected_provider = provider
    return Container(
        settings=settings,
        database=owned_database,
        repository=repository,
        renderer=renderer,
        provider=selected_provider,
        engine=GenerationEngine(
            selected_provider,
            dry_render=dry_render,
            deadline_seconds=settings.generation_job_timeout_seconds,
            policy=manifest_policy,
        ),
        apps=apps,
        jobs=GenerationJobService(repository),
        devices=devices,
        state=state,
        actions=actions,
        audit=AuditService(repository),
        metrics=Metrics.create(),
        runtime=active_runtime,
    )
