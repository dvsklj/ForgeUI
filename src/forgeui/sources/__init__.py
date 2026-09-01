"""Host-owned, typed data contracts and source registries.

Manifests can name registered source and contract identifiers, but never a handler,
URL, credential, or other connection detail.
"""

from forgeui.security import Principal
from forgeui.sources.registry import (
    DataContractRegistry,
    DataEnvelope,
    DataSourceRegistry,
    SourceContext,
    SourceError,
    SourceFrozenError,
    SourceUnauthorizedError,
    SourceUnknownError,
)

__all__ = [
    "DataContractRegistry",
    "DataEnvelope",
    "DataSourceRegistry",
    "Principal",
    "SourceContext",
    "SourceError",
    "SourceFrozenError",
    "SourceUnauthorizedError",
    "SourceUnknownError",
]
