"""Errors raised by the deliberately narrow A2UI import boundary."""

from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from forgeui.validation import ValidationIssue


class A2UIAdapterError(ValueError):
    """Base error with a stable machine-readable code and input path."""

    def __init__(self, code: str, message: str, *, path: str = "$") -> None:
        self.code = code
        self.path = path
        self.message = message
        super().__init__(f"{code} at {path}: {message}")


class UnsupportedA2UIVersionError(A2UIAdapterError):
    """The input does not use the one closed protocol version we import."""

    def __init__(self, version: object) -> None:
        super().__init__(
            "unsupported_version",
            f"only the pinned A2UI v0.9.1 subset is supported, received {version!r}",
            path="$.version",
        )


class UnsupportedA2UIFeatureError(A2UIAdapterError):
    """The input is valid A2UI in principle but outside ForgeUI's proven subset."""


class InvalidA2UIMessageError(A2UIAdapterError):
    """The input is malformed or violates an adapter boundary."""


class A2UIManifestValidationError(A2UIAdapterError):
    """The translated candidate failed ForgeUI's authoritative validator."""

    def __init__(self, issues: Sequence[ValidationIssue]) -> None:
        self.issues = tuple(issues)
        summary = "; ".join(
            f"{issue.code} at {issue.path}: {issue.message}" for issue in self.issues[:4]
        )
        if len(self.issues) > 4:
            summary += f"; and {len(self.issues) - 4} more"
        super().__init__(
            "manifest_validation_failed",
            summary or "ForgeUI rejected the translated manifest",
        )
