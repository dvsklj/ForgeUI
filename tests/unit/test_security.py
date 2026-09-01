from __future__ import annotations

import pytest

from forgeui.security import Principal


def test_anonymous_principal_does_not_expose_session_identifier() -> None:
    principal = Principal.anonymous("secret-session-cookie")
    assert principal.authenticated is False
    assert "secret-session-cookie" not in principal.actor_id
    assert principal.actor_id.startswith("anonymous:")


def test_principal_detaches_roles_and_validates_security_fields() -> None:
    roles = {"viewer"}
    principal = Principal("user-1", roles=roles)  # type: ignore[arg-type]
    roles.add("admin")
    assert principal.roles == frozenset({"viewer"})

    with pytest.raises(ValueError, match="authenticated"):
        Principal("user-1", authenticated=1)  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="roles"):
        Principal("user-1", roles=frozenset({""}))
