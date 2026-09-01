"""Explicit domain errors that web/API adapters can map without leaking internals."""

from __future__ import annotations


class ServiceError(Exception):
    """Base class for expected service-level failures."""


class NotFoundError(ServiceError):
    """A requested server-owned record does not exist."""


class ConflictError(ServiceError):
    """An optimistic precondition did not match current server state."""


class ForbiddenError(ServiceError):
    """The request attempted an action outside the declared trusted contract."""


class DataUnavailableError(ServiceError):
    """A registered source was unavailable, invalid, or denied without exposing why."""


class InvalidTransitionError(ServiceError):
    """A job operation is not legal from its current state."""
