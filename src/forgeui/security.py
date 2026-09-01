"""Small immutable security context shared by sources and capabilities."""

from __future__ import annotations

from dataclasses import dataclass, field
from hashlib import sha256


@dataclass(frozen=True, slots=True)
class Principal:
    """The host-authenticated actor; manifests and model output can never construct one."""

    actor_id: str
    tenant_id: str | None = None
    roles: frozenset[str] = field(default_factory=frozenset)
    authenticated: bool = False

    def __post_init__(self) -> None:
        if not isinstance(self.actor_id, str) or not 1 <= len(self.actor_id) <= 160:
            raise ValueError("principal actor_id must be 1..160 characters")
        if self.tenant_id is not None and (
            not isinstance(self.tenant_id, str) or not 1 <= len(self.tenant_id) <= 160
        ):
            raise ValueError("principal tenant_id must be 1..160 characters")
        if not isinstance(self.authenticated, bool):
            raise ValueError("principal authenticated flag must be boolean")
        try:
            frozen_roles = frozenset(self.roles)
        except TypeError as exc:
            raise ValueError("principal roles are invalid") from exc
        if len(frozen_roles) > 32 or any(
            not isinstance(role, str) or not 1 <= len(role) <= 80 for role in frozen_roles
        ):
            raise ValueError("principal roles exceed the bounded security context")
        object.__setattr__(self, "roles", frozen_roles)

    @classmethod
    def anonymous(cls, session_id: str) -> Principal:
        """Return a session-scoped unauthenticated identity without exposing the cookie value."""

        digest = sha256(session_id.encode("utf-8")).hexdigest()[:32]
        return cls(actor_id=f"anonymous:{digest}")

    @classmethod
    def administrator(cls, actor_id: str = "forgeui-admin") -> Principal:
        return cls(actor_id=actor_id, roles=frozenset({"admin"}), authenticated=True)

    @classmethod
    def service(
        cls,
        actor_id: str,
        *,
        roles: frozenset[str] | None = None,
    ) -> Principal:
        """Return an authenticated non-human identity configured by trusted host code."""

        return cls(actor_id=actor_id, roles=roles or frozenset(), authenticated=True)
