"""Server-owned UI state with optimistic versioning."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import cast

from forgeui.data.models import AppStateRecord
from forgeui.data.repositories import ForgeRepository, JsonValue, parse_json
from forgeui.services.apps import AppService
from forgeui.services.exceptions import ConflictError, ForbiddenError, NotFoundError


@dataclass(frozen=True, slots=True)
class StateView:
    app_id: str
    scope: str
    scope_key: str
    values: dict[str, JsonValue]
    version: int


class StateService:
    def __init__(self, repository: ForgeRepository, apps: AppService) -> None:
        self.repository = repository
        self.apps = apps

    @staticmethod
    def _validate_scope(scope: str, scope_key: str) -> None:
        if scope not in {"session", "global"}:
            raise ForbiddenError("state scope must be session or global")
        if not 1 <= len(scope_key) <= 160:
            raise ForbiddenError("state scope key must be 1..160 characters")

    @staticmethod
    def _to_view(record: AppStateRecord) -> StateView:
        app_id = record.app_id
        scope = record.scope
        scope_key = record.scope_key
        version = record.version
        raw = parse_json(record.value_json)
        if not isinstance(raw, dict):
            raise RuntimeError("stored state is not an object")
        return StateView(app_id, scope, scope_key, raw, version)

    @staticmethod
    def _matches_declared_type(value: JsonValue, declared: JsonValue) -> bool:
        if isinstance(declared, bool):
            return isinstance(value, bool)
        if isinstance(declared, int | float) and not isinstance(declared, bool):
            return isinstance(value, int | float) and not isinstance(value, bool)
        if isinstance(declared, str):
            return isinstance(value, str)
        if declared is None:
            return value is None
        return (
            isinstance(declared, list)
            and isinstance(value, list)
            and all(item is None or isinstance(item, str | int | float | bool) for item in value)
        )

    def _validate_values(self, app_id: str, values: Mapping[str, JsonValue]) -> None:
        declared = self.apps.get_current_manifest(app_id).manifest.state.values
        if set(values) != set(declared):
            raise ForbiddenError("state keys must match the manifest declaration")
        for key, declared_value in declared.items():
            if not self._matches_declared_type(values[key], cast(JsonValue, declared_value)):
                raise ForbiddenError("state value does not match its manifest declaration")

    def validate_values(self, app_id: str, values: Mapping[str, JsonValue]) -> None:
        """Validate a request-carried state snapshot without persisting it."""

        self._validate_values(app_id, values)

    def get(self, app_id: str, *, scope: str, scope_key: str) -> StateView:
        self._validate_scope(scope, scope_key)
        record = self.repository.get_state(app_id, scope, scope_key)
        if record is not None:
            return self._to_view(record)
        # A missing state record is intentionally not persisted on read.
        initial = self.apps.get_current_manifest(app_id).manifest.state.values
        return StateView(app_id, scope, scope_key, cast(dict[str, JsonValue], dict(initial)), 0)

    def replace(
        self,
        app_id: str,
        *,
        scope: str,
        scope_key: str,
        values: Mapping[str, JsonValue],
        expected_version: int | None,
    ) -> StateView:
        self._validate_scope(scope, scope_key)
        if self.repository.get_app(app_id) is None:
            raise NotFoundError("app not found")
        self._validate_values(app_id, values)
        record = None
        with self.repository.transaction() as session:
            record = self.repository.put_state_in_session(
                session,
                app_id=app_id,
                scope=scope,
                scope_key=scope_key,
                value=values,
                expected_version=expected_version,
            )
            if record is None:
                raise ConflictError("state version changed")
            return self._to_view(record)

    def mutate(
        self,
        app_id: str,
        *,
        scope: str,
        scope_key: str,
        expected_version: int | None,
        mutator: Callable[[dict[str, JsonValue]], dict[str, JsonValue]],
    ) -> StateView:
        current = self.get(app_id, scope=scope, scope_key=scope_key)
        if expected_version is not None and current.version != expected_version:
            raise ConflictError("state version changed")
        updated = mutator(dict(current.values))
        return self.replace(
            app_id,
            scope=scope,
            scope_key=scope_key,
            values=updated,
            expected_version=current.version,
        )
