"""Trusted, deterministic rendering of validated ForgeUI manifests."""

from forgeui.renderer.protocol import (
    HtmlRendererAdapter,
    RendererAdapter,
    RendererCapabilities,
    RenderIssue,
    RenderOptions,
    RenderResult,
)
from forgeui.renderer.renderer import RenderContext, Renderer, render_manifest
from forgeui.surfaces import PersistenceMode, SurfaceMode

__all__ = [
    "HtmlRendererAdapter",
    "PersistenceMode",
    "RenderContext",
    "RenderIssue",
    "RenderOptions",
    "RenderResult",
    "Renderer",
    "RendererAdapter",
    "RendererCapabilities",
    "SurfaceMode",
    "render_manifest",
]
