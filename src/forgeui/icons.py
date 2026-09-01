"""Trusted Heroicons used by the shell and allowlisted icon component.

The paths are copied from Heroicons 24px outline icons. Manifests select only
ForgeUI's small semantic name allowlist; they never supply SVG or path data.
"""

from __future__ import annotations

from types import MappingProxyType
from typing import Final, Literal

from markupsafe import Markup

IconClass = Literal[
    "forge-icon",
    "forge-theme-icon",
    "forge-button-icon",
    "forge-surface-action-icon",
]

_HEROICON_PATHS: Final = MappingProxyType(
    {
        "sun": (
            "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591"
            "M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636"
            " 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
        ),
        "moon": (
            "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75"
            " 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635"
            " 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
        ),
        "computer-desktop": (
            "M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1"
            " 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25"
            " 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0"
            " 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1"
            " 3 12V5.25"
        ),
        "signal": (
            "M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0"
            " 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1"
            " 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788"
            " 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375"
            " 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        ),
        "exclamation-triangle": (
            "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73"
            " 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898"
            " 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        ),
        "check": "m4.5 12.75 6 6 9-13.5",
        "chevron-right": "m8.25 4.5 7.5 7.5-7.5 7.5",
        "cpu-chip": (
            "M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15"
            " 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0"
            " 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0"
            " 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0"
            " 0 2.25 2.25Zm.75-12h9v9h-9v-9Z"
        ),
        "device-tablet": (
            "M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-15a2.25"
            " 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25"
            " 0 0 0 2.25 2.25Z"
        ),
        "circle-stack": (
            "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75"
            " 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75"
            " 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            "V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556"
            " 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694"
            " 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
        ),
        "server-stack": (
            "M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3"
            " 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5"
            " 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126"
            "c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3"
            " 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3"
            " 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"
        ),
        "magnifying-glass": (
            "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        ),
        "x-mark": "M6 18 18 6M6 6l12 12",
    }
)

_SEMANTIC_ICON_NAMES: Final = MappingProxyType(
    {
        "activity": "signal",
        "alert": "exclamation-triangle",
        "check": "check",
        "chevron-right": "chevron-right",
        "cpu": "cpu-chip",
        "device": "device-tablet",
        "disk": "circle-stack",
        "memory": "server-stack",
        "search": "magnifying-glass",
        "warning": "exclamation-triangle",
        "light": "sun",
        "system": "computer-desktop",
        "dark": "moon",
        "close": "x-mark",
    }
)


def render_heroicon(
    name: str,
    *,
    class_name: IconClass = "forge-icon",
) -> Markup:
    """Render one fixed 24px outline icon from a semantic allowlist."""

    source_name = _SEMANTIC_ICON_NAMES.get(name, "signal")
    path = _HEROICON_PATHS[source_name]
    return Markup(  # nosec B704  # noqa: S704 - fixed, server-owned SVG and class values
        f'<svg class="{class_name}" viewBox="0 0 24 24" aria-hidden="true" '
        'focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" '
        'stroke-linecap="round" stroke-linejoin="round">'
        f'<path d="{path}"/></svg>'
    )


__all__ = ["render_heroicon"]
