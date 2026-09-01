from __future__ import annotations

import pytest
from conftest import manifest

from forgeui.data import ForgeRepository
from forgeui.services import ActionService, AppService, StateService
from forgeui.services.apps import InvalidManifestError
from forgeui.services.exceptions import ConflictError, ForbiddenError


def test_invalid_manifest_never_changes_last_known_good(
    repository: ForgeRepository, apps: AppService
) -> None:
    app = apps.create_app("Fleet")
    saved = apps.save_manifest(app.id, manifest())
    invalid = manifest()
    invalid["root"] = "missing"
    with pytest.raises(InvalidManifestError):
        apps.save_manifest(app.id, invalid, expected_revision_id=saved.id)
    current = apps.get_app(app.id)
    assert current.current_revision_id == saved.id
    assert current.last_known_good_revision_id == saved.id
    assert repository.get_revision(saved.id).content_hash == saved.content_hash  # type: ignore[union-attr]


def test_revisions_are_immutable_conflict_aware_and_restore_by_copy(apps: AppService) -> None:
    app = apps.create_app("Fleet")
    first = apps.save_manifest(app.id, manifest())
    changed = manifest()
    changed["metadata"] = {"title": "Changed"}
    second = apps.save_manifest(app.id, changed, expected_revision_id=first.id)
    with pytest.raises(ConflictError):
        apps.save_manifest(app.id, manifest(), expected_revision_id=first.id)
    restored = apps.restore_revision(app.id, first.id, expected_revision_id=second.id)
    assert restored.id not in {first.id, second.id}
    assert restored.number == 3
    assert restored.manifest.metadata.title == "Fleet health"


def test_state_conflict_and_safe_action_restrictions(
    repository: ForgeRepository, apps: AppService, state: StateService
) -> None:
    app = apps.create_app("Fleet")
    apps.save_manifest(app.id, manifest())
    action_service = ActionService(apps, state)
    result = action_service.execute(
        app.id,
        "set-query",
        scope="session",
        scope_key="test-session",
        expected_version=0,
        event={"value": "switch-a"},
    )
    assert result.state is not None
    assert result.state.values["query"] == "switch-a"
    with pytest.raises(ConflictError):
        action_service.execute(
            app.id,
            "toggle",
            scope="session",
            scope_key="test-session",
            expected_version=0,
        )
    denied = action_service.execute(
        app.id, "deny", scope="session", scope_key="test-session", expected_version=1
    )
    assert denied.capability is not None
    assert denied.capability.status == "denied"
    with pytest.raises(ForbiddenError):
        action_service.execute(
            app.id,
            "set-query",
            scope="session",
            scope_key="test-session",
            expected_version=1,
            event={"unsupported": "x"},
        )


def test_transient_actions_change_only_the_supplied_snapshot(
    apps: AppService, state: StateService
) -> None:
    app = apps.create_app("Fleet")
    apps.save_manifest(app.id, manifest())
    action_service = ActionService(apps, state)
    initial = {"query": "", "page": 1, "show": False, "notes": []}

    result = action_service.execute_transient(
        app.id,
        "set-query",
        values=initial,
        event={"value": "edge-01"},
    )
    assert result.state is not None
    assert result.state.values["query"] == "edge-01"
    assert initial["query"] == ""
    assert state.get(app.id, scope="session", scope_key="test-session").values["query"] == ""

    with pytest.raises(ForbiddenError, match="capabilities require stateful"):
        action_service.execute_transient(app.id, "deny", values=initial)
    with pytest.raises(ForbiddenError, match="does not match"):
        action_service.execute_transient(app.id, "toggle", values={**initial, "show": "yes"})
