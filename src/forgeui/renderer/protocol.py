"""Portable renderer contract and validated, persistence-free HTML adapter."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal, Protocol

from forgeui import __version__
from forgeui.catalog import component_registry
from forgeui.domain.models import ForgeManifest
from forgeui.renderer.renderer import RenderContext, Renderer
from forgeui.validation import DEFAULT_MANIFEST_POLICY, ManifestPolicy, validate_manifest


@dataclass(frozen=True, slots=True)
class RendererCapabilities:
    renderer: str
    version: str
    components: frozenset[str]
    interactions: frozenset[str] = frozenset({"inert"})
    manifest_versions: frozenset[str] = frozenset({"forgeui/1"})


@dataclass(frozen=True, slots=True)
class RenderOptions:
    interaction: Literal["inert", "events"] = "inert"


_DEFAULT_OPTIONS = RenderOptions()


@dataclass(frozen=True, slots=True)
class RenderIssue:
    phase: str
    code: str
    path: str
    message: str


@dataclass(frozen=True, slots=True)
class RenderResult:
    output: str
    renderer: str
    renderer_version: str
    manifest_version: str = "forgeui/1"
    assets: tuple[str, ...] = ()
    issues: tuple[RenderIssue, ...] = ()
    interaction: str = "inert"
    accessibility: tuple[str, ...] = ("semantic-html", "labelled-controls")

    @property
    def ok(self) -> bool:
        return not self.issues


class RendererAdapter(Protocol):
    def capabilities(self) -> RendererCapabilities: ...

    def render(
        self,
        manifest: ForgeManifest | Mapping[str, Any],
        context: RenderContext | None = None,
        options: RenderOptions = _DEFAULT_OPTIONS,
    ) -> RenderResult: ...


class HtmlRendererAdapter:
    """Validates against host policy on every render, without sessions or persistence.

    Events mode emits existing data-forge-action and named state controls; the host
    binds handlers and owns authorization. Asset IDs must be resolved by host code.
    """

    def __init__(self, *, policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY) -> None:
        self.policy = policy
        self._renderer = Renderer()

    def capabilities(self) -> RendererCapabilities:
        return RendererCapabilities(
            "html", __version__, component_registry.names, frozenset({"inert", "events"})
        )

    def render(
        self,
        manifest: ForgeManifest | Mapping[str, Any],
        context: RenderContext | None = None,
        options: RenderOptions = _DEFAULT_OPTIONS,
    ) -> RenderResult:
        caps = self.capabilities()
        issues: list[RenderIssue] = []
        if options.interaction not in caps.interactions:
            issues.append(
                RenderIssue(
                    "compatibility",
                    "unsupported_interaction",
                    "$",
                    "renderer does not support this interaction mode",
                )
            )
        # Round trip even model instances to reject host-mutated models before rendering.
        raw = manifest.model_dump(mode="json") if isinstance(manifest, ForgeManifest) else manifest
        report = validate_manifest(raw, policy=self.policy)
        issues.extend(
            RenderIssue("validation", issue.code, issue.path, issue.message)
            for issue in report.issues
        )
        validated = report.manifest
        if validated is not None:
            if "forgeui/1" not in caps.manifest_versions:
                issues.append(
                    RenderIssue(
                        "compatibility",
                        "unsupported_manifest_version",
                        "$",
                        "renderer does not support forgeui/1",
                    )
                )
            for element_id, element in validated.elements.items():
                if element.type not in caps.components:
                    issues.append(
                        RenderIssue(
                            "compatibility",
                            "unsupported_component",
                            f"$.elements.{element_id}",
                            element.type,
                        )
                    )
        output = ""
        if not issues and validated is not None:
            render_context = context or RenderContext(state=validated.state.values)
            output = self._renderer.render(validated, render_context)
            if 'class="forge-render-error"' in output:
                issues.append(
                    RenderIssue(
                        "render", "component_failed", "$", "a component failed during rendering"
                    )
                )
            if options.interaction == "inert":
                output = f"<div inert>{output}</div>"
        return RenderResult(
            output,
            caps.renderer,
            caps.version,
            assets=("forgeui.css",),
            issues=tuple(issues),
            interaction=options.interaction,
        )
