"""Trusted runtime modes for presenting the same validated ForgeUI manifest.

Surface and persistence are deliberately orthogonal. A manifest never selects either:
the host application chooses them when it renders or links to a saved app.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from types import MappingProxyType
from typing import Final


class SurfaceMode(StrEnum):
    """Allowlisted presentation contexts supported by the trusted shell."""

    DASHBOARD = "dashboard"
    STANDALONE = "standalone"
    DESKTOP = "desktop"
    MOBILE = "mobile"
    EMBED = "embed"
    CHAT = "chat"


class PersistenceMode(StrEnum):
    """Allowlisted UI-state lifetimes."""

    STATEFUL = "stateful"
    STATELESS = "stateless"


@dataclass(frozen=True, slots=True)
class SurfacePresentation:
    """Trusted shell decisions for one surface."""

    show_shell_header: bool
    embeddable: bool


_SURFACE_PRESENTATIONS: Final = MappingProxyType(
    {
        SurfaceMode.DASHBOARD: SurfacePresentation(show_shell_header=True, embeddable=False),
        SurfaceMode.STANDALONE: SurfacePresentation(show_shell_header=True, embeddable=False),
        SurfaceMode.DESKTOP: SurfacePresentation(show_shell_header=True, embeddable=False),
        SurfaceMode.MOBILE: SurfacePresentation(show_shell_header=True, embeddable=False),
        SurfaceMode.EMBED: SurfacePresentation(show_shell_header=False, embeddable=True),
        SurfaceMode.CHAT: SurfacePresentation(show_shell_header=False, embeddable=True),
    }
)


def surface_presentation(surface: SurfaceMode) -> SurfacePresentation:
    """Return the fixed shell policy for a validated surface."""

    return _SURFACE_PRESENTATIONS[surface]


__all__ = [
    "PersistenceMode",
    "SurfaceMode",
    "SurfacePresentation",
    "surface_presentation",
]
