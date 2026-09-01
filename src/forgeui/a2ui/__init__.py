"""Narrow Google A2UI v0.9.1 snapshot import support.

This package does not claim general A2UI conformance.
"""

from forgeui.a2ui.adapter import A2UIAdaptation, adapt_a2ui_jsonl, adapt_a2ui_messages
from forgeui.a2ui.errors import (
    A2UIAdapterError,
    A2UIManifestValidationError,
    InvalidA2UIMessageError,
    UnsupportedA2UIFeatureError,
    UnsupportedA2UIVersionError,
)
from forgeui.a2ui.models import (
    A2UI_BASIC_CATALOG_ID,
    A2UI_MIME_TYPE,
    A2UI_SERVER_SCHEMA_URL,
    A2UI_SPEC_COMMIT,
    A2UI_VERSION,
)

__all__ = [
    "A2UI_BASIC_CATALOG_ID",
    "A2UI_MIME_TYPE",
    "A2UI_SERVER_SCHEMA_URL",
    "A2UI_SPEC_COMMIT",
    "A2UI_VERSION",
    "A2UIAdaptation",
    "A2UIAdapterError",
    "A2UIManifestValidationError",
    "InvalidA2UIMessageError",
    "UnsupportedA2UIFeatureError",
    "UnsupportedA2UIVersionError",
    "adapt_a2ui_jsonl",
    "adapt_a2ui_messages",
]
