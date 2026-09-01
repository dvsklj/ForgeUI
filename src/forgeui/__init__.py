"""ForgeUI public package."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("forgeui")
except PackageNotFoundError:  # pragma: no cover - editable source checkout
    __version__ = "0.1.0a2"

__all__ = ["__version__"]
