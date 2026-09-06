"""Focused coverage of ActionService state transitions and rejection branches.

These tests exercise the state-action arithmetic (`_changed_values`), the toast,
navigate, refresh and capability branches of `_dispatch`, and the transient/
persistent guard rails in `execute` and `execute_transient`.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from conftest import manifest as base_manifest

from forgeui.data import ForgeRepository
from forgeui.expressions.ast import LiteralExpr, OpExpr
from forgeui.security import Principal
from forgeui.services import (
    ActionService,
    AppService,
    CapabilityRegistry,
    CapabilityResult,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    StateService,
)


def lab_manifest() -> dict[str, object]:
    """A manifest exercising every state-action kind plus toast/navigate/refresh."""

    manifest = base_manifest()
    manifest["elements"]["page"]["children"] = ["title", "dlg"]  # type: ignore[index]
    manifest["elements"]["dlg"] = {"type": "modal", "props": {"title": "Note"}}  # type: ignore[index]
    manifest["actions"] = {  # type: ignore[index]
        "inc": {
            "type": "increment_state",
            "path": "state.page",
            "amount": {"kind": "literal", "value": 1},
        },
        "inc-bad-amount": {
            "type": "increment_state",
            "path": "state.page",
            "amount": {"kind": "ref", "path": "event.value"},
        },
        "toggle": {"type": "toggle_state", "path": "state.show"},
        "add-note": {
            "type": "append_collection",
            "path": "state.notes",
            "value": {"kind": "ref", "path": "event.value"},
        },
        "update-note": {
            "type": "update_collection",
            "path": "state.notes",
            "match": {
                "kind": "op",
                "op": "eq",
                "args": [{"kind": "ref", "path": "item"}, {"kind": "literal", "value": "old"}],
            },
            "value": {"kind": "literal", "value": "new"},
        },
        "delete-note": {
            "type": "delete_collection",
            "path": "state.notes",
            "match": {
                "kind": "op",
                "op": "eq",
                "args": [{"kind": "ref", "path": "item"}, {"kind": "literal", "value": "gone"}],
            },
        },
        "corrupt-page": {
            "type": "set_state",
            "path": "state.page",
            "value": {"kind": "literal", "value": "not-a-number"},
        },
        "toast-ok": {
            "type": "toast",
            "message": {"kind": "literal", "value": "Saved"},
            "level": "success",
        },
        "toast-bad": {"type": "toast", "message": {"kind": "ref", "path": "state.page"}},
        "nav": {"type": "navigate", "destination": "devices"},
        "refresh": {"type": "refresh_source", "source": "device-health"},
        "open-m": {"type": "open_modal", "target": "dlg"},
        "close-m": {"type": "close_modal", "target": "dlg"},
        "grant": {
            "type": "invoke_capability",
            "capability": "device-note.create",
            "payload": {"kind": "ref", "path": "event.value"},
        },
    }
    return manifest


def write_raw_state(
    repository: ForgeRepository,
    app_id: str,
    scope_key: str,
    values: dict[str, object],
) -> None:
    """Persist a state row directly, bypassing StateService's type validation.

    Simulates state left over from a prior manifest revision that declared a
    different type for the same key -- the only realistic way a persisted
    value can drift from what the current manifest declares.
    """

    with repository.transaction() as session:
        repository.put_state_in_session(
            session,
            app_id=app_id,
            scope="session",
            scope_key=scope_key,
            value=values,
            expected_version=0,
        )


@pytest.fixture
def lab_app(apps: AppService) -> str:
    app = apps.create_app("Lab")
    apps.save_manifest(app.id, lab_manifest())
    return app.id


def test_increment_append_update_and_delete_collection_actions(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)

    incremented = service.execute(lab_app, "inc", scope="session", scope_key="lifecycle")
    assert incremented.state is not None
    assert incremented.state.values["page"] == 2

    added_old = service.execute(
        lab_app, "add-note", scope="session", scope_key="lifecycle", event={"value": "old"}
    )
    assert added_old.state is not None
    assert added_old.state.values["notes"] == ["old"]

    added_gone = service.execute(
        lab_app, "add-note", scope="session", scope_key="lifecycle", event={"value": "gone"}
    )
    assert added_gone.state is not None
    assert added_gone.state.values["notes"] == ["old", "gone"]

    updated = service.execute(lab_app, "update-note", scope="session", scope_key="lifecycle")
    assert updated.state is not None
    assert updated.state.values["notes"] == ["new", "gone"]

    deleted = service.execute(lab_app, "delete-note", scope="session", scope_key="lifecycle")
    assert deleted.state is not None
    assert deleted.state.values["notes"] == ["new"]

    toggled = service.execute(lab_app, "toggle", scope="session", scope_key="lifecycle")
    assert toggled.state is not None
    assert toggled.state.values["show"] is True


def test_set_state_result_must_match_declared_state_type(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    with pytest.raises(ForbiddenError, match="does not match declared state type"):
        service.execute(lab_app, "corrupt-page", scope="session", scope_key="corrupt")


def test_toggle_rejects_a_non_boolean_current_value(
    lab_app: str, apps: AppService, state: StateService, repository: ForgeRepository
) -> None:
    write_raw_state(
        repository, lab_app, "drifted-bool", {"query": "", "page": 1, "show": "yes", "notes": []}
    )
    service = ActionService(apps, state)
    with pytest.raises(ForbiddenError, match="toggle action requires boolean state"):
        service.execute(lab_app, "toggle", scope="session", scope_key="drifted-bool")


def test_increment_rejects_a_non_numeric_current_value(
    lab_app: str, apps: AppService, state: StateService, repository: ForgeRepository
) -> None:
    write_raw_state(
        repository,
        lab_app,
        "drifted-number",
        {"query": "", "page": "not-a-number", "show": False, "notes": []},
    )
    service = ActionService(apps, state)
    with pytest.raises(ForbiddenError, match="increment action requires numbers"):
        service.execute(lab_app, "inc", scope="session", scope_key="drifted-number")


def test_increment_rejects_a_non_numeric_amount(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    with pytest.raises(ForbiddenError, match="increment action requires numbers"):
        service.execute(
            lab_app,
            "inc-bad-amount",
            scope="session",
            scope_key="bad-amount",
            event={"value": True},
        )


def test_append_and_collection_actions_reject_a_non_list_current_value(
    lab_app: str, apps: AppService, state: StateService, repository: ForgeRepository
) -> None:
    write_raw_state(
        repository,
        lab_app,
        "drifted-list",
        {"query": "", "page": 1, "show": False, "notes": "not-a-list"},
    )
    service = ActionService(apps, state)
    with pytest.raises(ForbiddenError, match="append action requires a collection"):
        service.execute(
            lab_app, "add-note", scope="session", scope_key="drifted-list", event={"value": "x"}
        )
    with pytest.raises(ForbiddenError, match="collection action requires a collection"):
        service.execute(lab_app, "update-note", scope="session", scope_key="drifted-list")
    with pytest.raises(ForbiddenError, match="collection action requires a collection"):
        service.execute(lab_app, "delete-note", scope="session", scope_key="drifted-list")


def test_toast_action_success_and_non_text_rejection(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    ok = service.execute(lab_app, "toast-ok", scope="session", scope_key="toast")
    assert ok.toast == ("success", "Saved")
    with pytest.raises(ForbiddenError, match="toast message must evaluate to text"):
        service.execute(lab_app, "toast-bad", scope="session", scope_key="toast")


def test_navigate_and_refresh_data_results(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    navigated = service.execute(lab_app, "nav", scope="session", scope_key="nav")
    assert navigated.navigation == "devices"
    refreshed = service.execute(lab_app, "refresh", scope="session", scope_key="nav")
    assert refreshed.refresh_source == "device-health"


def test_open_and_close_modal_results(lab_app: str, apps: AppService, state: StateService) -> None:
    service = ActionService(apps, state)
    opened = service.execute(lab_app, "open-m", scope="session", scope_key="modal")
    assert opened.modal == ("open", "dlg")
    closed = service.execute(lab_app, "close-m", scope="session", scope_key="modal")
    assert closed.modal == ("close", "dlg")


def test_capability_invocation_succeeds_and_requests_a_refresh(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    registry = CapabilityRegistry()
    registry.register(
        "device-note.create",
        handler=lambda context: CapabilityResult("ok", "Noted.", refresh=True),
        authorize=lambda context: True,
    )
    registry.freeze()
    service = ActionService(apps, state, capabilities=registry)
    result = service.execute(
        lab_app, "grant", scope="session", scope_key="cap", event={"value": "note-1"}
    )
    assert result.capability is not None
    assert result.capability.status == "ok"
    assert result.refresh_source == "device-health"


def test_execute_raises_conflict_error_on_a_stale_expected_version(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    service.execute(lab_app, "inc", scope="session", scope_key="conflict", expected_version=0)
    with pytest.raises(ConflictError):
        service.execute(lab_app, "inc", scope="session", scope_key="conflict", expected_version=0)


def test_execute_rejects_unsupported_event_fields(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    with pytest.raises(ForbiddenError, match="unsupported fields"):
        service.execute(
            lab_app,
            "inc",
            scope="session",
            scope_key="event",
            event={"bogus": "field"},
        )


def test_execute_transient_forbids_capability_actions(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    values = {"query": "", "page": 1, "show": False, "notes": []}
    with pytest.raises(ForbiddenError, match="capabilities require stateful mode"):
        service.execute_transient(lab_app, "grant", values=values)


def test_execute_transient_rejects_missing_or_extra_state_keys(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    incomplete = {"query": "", "page": 1, "show": False}
    with pytest.raises(ForbiddenError, match="transient state keys must match"):
        service.execute_transient(lab_app, "inc", values=incomplete)


def test_execute_transient_rejects_a_type_mismatched_value(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    wrong_type = {"query": "", "page": "one", "show": False, "notes": []}
    with pytest.raises(ForbiddenError, match="does not match its declaration"):
        service.execute_transient(lab_app, "inc", values=wrong_type)


def test_execute_transient_rejects_unsupported_event_fields(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    values = {"query": "", "page": 1, "show": False, "notes": []}
    with pytest.raises(ForbiddenError, match="unsupported fields"):
        service.execute_transient(lab_app, "inc", values=values, event={"bogus": "field"})


def test_changed_values_defensively_rejects_a_non_state_action(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    """`_dispatch` never calls `_changed_values` with a non-state action, but the
    method still guards against any object carrying a state `path` that isn't one
    of the six recognised state-action types."""

    service = ActionService(apps, state)
    current = state.get(lab_app, scope="session", scope_key="odd")
    declared = {"query": "", "page": 1, "show": False, "notes": []}
    with pytest.raises(ForbiddenError, match="action is not a state action"):
        service._changed_values(
            app_id=lab_app,
            action=SimpleNamespace(path="state.page"),
            state=current,
            declared=declared,
            event={},
            source_id="device-health",
            principal=Principal.anonymous("odd"),
            request_id="test",
        )


def test_changed_values_rejects_an_undeclared_state_key(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    current = state.get(lab_app, scope="session", scope_key="undeclared")
    with pytest.raises(ForbiddenError, match="action state key is not declared"):
        service._changed_values(
            app_id=lab_app,
            action=SimpleNamespace(path="state.page"),
            state=current,
            declared={"query": ""},
            event={},
            source_id="device-health",
            principal=Principal.anonymous("undeclared"),
            request_id="test",
        )


def test_execute_raises_not_found_for_an_unknown_action(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    with pytest.raises(NotFoundError):
        service.execute(lab_app, "does-not-exist", scope="session", scope_key="missing")


def test_execute_transient_raises_not_found_for_an_unknown_action(
    lab_app: str, apps: AppService, state: StateService
) -> None:
    service = ActionService(apps, state)
    values = {"query": "", "page": 1, "show": False, "notes": []}
    with pytest.raises(NotFoundError):
        service.execute_transient(lab_app, "does-not-exist", values=values)


def test_matches_declared_type_handles_null_and_unrecognised_declarations() -> None:
    assert ActionService._matches_declared_type(None, None) is True
    assert ActionService._matches_declared_type("not-null", None) is False
    # A declared value outside the JSON-scalar/list union (defensive fallback).
    assert ActionService._matches_declared_type("anything", {"nested": 1}) is False  # type: ignore[arg-type]


def test_json_scalar_rejects_non_scalar_values() -> None:
    with pytest.raises(ForbiddenError, match="must be a JSON scalar"):
        ActionService._json_scalar({"nested": 1})


def test_evaluate_wraps_evaluation_errors_as_forbidden() -> None:
    expression = OpExpr(
        kind="op",
        op="div",
        args=[LiteralExpr(kind="literal", value=10), LiteralExpr(kind="literal", value=0)],
    )
    with pytest.raises(ForbiddenError, match="could not be evaluated"):
        ActionService._evaluate(expression, {})
