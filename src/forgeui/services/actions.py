"""Safe execution of the frozen manifest action union.

Actions are data, not callbacks: this module evaluates the bounded expression AST,
changes only declared state, and returns UI instructions to the trusted web adapter.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Protocol, TypeAlias, cast

from forgeui.data.repositories import JsonValue
from forgeui.domain.models import (
    AppendCollectionAction,
    CloseDialogAction,
    DeleteCollectionAction,
    IncrementStateAction,
    InvokeCapabilityAction,
    NavigateAction,
    OpenDialogAction,
    RefreshDataAction,
    SetStateAction,
    SubmitFormAction,
    ToastAction,
    ToggleStateAction,
    UpdateCollectionAction,
)
from forgeui.expressions.ast import Expression
from forgeui.expressions.evaluator import EvaluationError, evaluate_expression
from forgeui.security import Principal
from forgeui.services.apps import AppService
from forgeui.services.capabilities import (
    CapabilityContext,
    CapabilityRegistry,
    CapabilityResult,
    declared_capabilities,
)
from forgeui.services.devices import DeviceHealthService
from forgeui.services.exceptions import ForbiddenError, NotFoundError
from forgeui.services.state import StateService, StateView

StateAction: TypeAlias = (
    SetStateAction
    | ToggleStateAction
    | IncrementStateAction
    | AppendCollectionAction
    | UpdateCollectionAction
    | DeleteCollectionAction
)


class ActionDataResolver(Protocol):
    """Resolve a registered source for action expression evaluation."""

    def __call__(
        self,
        app_id: str,
        source_id: str,
        principal: Principal,
        request_id: str,
    ) -> Mapping[str, JsonValue]: ...


@dataclass(frozen=True, slots=True)
class ActionResult:
    state: StateView | None = None
    modal: tuple[str, str] | None = None
    toast: tuple[str, str] | None = None
    refresh_source: str | None = None
    navigation: str | None = None
    capability: CapabilityResult | None = None


class ActionService:
    def __init__(
        self,
        apps: AppService,
        state: StateService,
        *,
        devices: DeviceHealthService | None = None,
        capabilities: CapabilityRegistry | None = None,
        data_resolver: ActionDataResolver | None = None,
    ) -> None:
        self.apps = apps
        self.state = state
        self.devices = devices
        self.capabilities = capabilities or declared_capabilities(
            ("device-note.create", "incident.acknowledge")
        )
        self.data_resolver = data_resolver

    @staticmethod
    def _json_scalar(value: object) -> JsonValue:
        if value is None or isinstance(value, str | int | float | bool):
            return value
        raise ForbiddenError("action value must be a JSON scalar")

    @classmethod
    def _state_value(cls, value: object) -> JsonValue:
        if isinstance(value, list):
            return [cls._json_scalar(item) for item in value]
        return cls._json_scalar(value)

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
        if isinstance(declared, list):
            return isinstance(value, list) and all(
                item is None or isinstance(item, str | int | float | bool) for item in value
            )
        return False

    @staticmethod
    def _event(event: Mapping[str, JsonValue] | None) -> dict[str, JsonValue]:
        event_dict = dict(event or {})
        if set(event_dict) - {"value", "key", "item"}:
            raise ForbiddenError("action event contains unsupported fields")
        # Event item may be an object in a browser event, but manifests can only use
        # it through the pure evaluator. Keep it JSON-only and bounded by callers.
        return event_dict

    def _data_namespace(
        self,
        app_id: str,
        source_id: str,
        principal: Principal,
        request_id: str,
    ) -> Mapping[str, JsonValue]:
        if self.data_resolver is not None:
            return self.data_resolver(app_id, source_id, principal, request_id)
        if self.devices is None:
            return {}
        latest = self.devices.latest(app_id=app_id)
        return (
            {}
            if latest is None
            else cast(dict[str, JsonValue], latest.snapshot.model_dump(mode="json"))
        )

    @staticmethod
    def _evaluate(expression: Expression, namespaces: Mapping[str, object]) -> object:
        try:
            return evaluate_expression(expression, namespaces)
        except EvaluationError as exc:
            raise ForbiddenError("action expression could not be evaluated") from exc

    def _changed_values(
        self,
        *,
        app_id: str,
        action: StateAction,
        state: StateView,
        declared: Mapping[str, JsonValue],
        event: Mapping[str, JsonValue],
        source_id: str,
        principal: Principal,
        request_id: str,
    ) -> dict[str, JsonValue]:
        path = action.path
        key = path.split(".", maxsplit=1)[1]
        if key not in declared:
            raise ForbiddenError("action state key is not declared")
        namespaces: dict[str, object] = {
            "data": self._data_namespace(app_id, source_id, principal, request_id),
            "state": state.values,
            "event": event,
        }
        values = dict(state.values)
        current = values.get(key, declared[key])
        if isinstance(action, SetStateAction):
            replacement = self._state_value(self._evaluate(action.value, namespaces))
        elif isinstance(action, ToggleStateAction):
            if not isinstance(current, bool):
                raise ForbiddenError("toggle action requires boolean state")
            replacement = not current
        elif isinstance(action, IncrementStateAction):
            amount = self._evaluate(action.amount, namespaces)
            if (
                isinstance(current, bool)
                or not isinstance(current, int | float)
                or isinstance(amount, bool)
                or not isinstance(amount, int | float)
            ):
                raise ForbiddenError("increment action requires numbers")
            replacement = current + amount
        elif isinstance(action, AppendCollectionAction):
            if not isinstance(current, list):
                raise ForbiddenError("append action requires a collection")
            replacement = [*current, self._json_scalar(self._evaluate(action.value, namespaces))]
        elif isinstance(action, UpdateCollectionAction | DeleteCollectionAction):
            if not isinstance(current, list):
                raise ForbiddenError("collection action requires a collection")
            replacement_items: list[JsonValue] = []
            for item in current:
                item_namespaces = {**namespaces, "item": item}
                matched = bool(self._evaluate(action.match, item_namespaces))
                if isinstance(action, DeleteCollectionAction):
                    if not matched:
                        replacement_items.append(item)
                elif matched:
                    replacement_items.append(
                        self._json_scalar(self._evaluate(action.value, item_namespaces))
                    )
                else:
                    replacement_items.append(item)
            replacement = replacement_items
        else:
            raise ForbiddenError("action is not a state action")
        replacement = self._state_value(replacement)
        if not self._matches_declared_type(replacement, declared[key]):
            raise ForbiddenError("action result does not match declared state type")
        values[key] = replacement
        return values

    def _dispatch(
        self,
        *,
        app_id: str,
        action_id: str,
        action: object,
        current: StateView,
        declared: Mapping[str, JsonValue],
        event_data: Mapping[str, JsonValue],
        persist: bool,
        principal: Principal,
        request_id: str,
        confirmed: bool,
        data_source: str,
    ) -> ActionResult:
        if isinstance(
            action,
            SetStateAction
            | ToggleStateAction
            | IncrementStateAction
            | AppendCollectionAction
            | UpdateCollectionAction
            | DeleteCollectionAction,
        ):
            values = self._changed_values(
                app_id=app_id,
                action=action,
                state=current,
                declared=declared,
                event=event_data,
                source_id=data_source,
                principal=principal,
                request_id=request_id,
            )
            state = (
                self.state.replace(
                    app_id,
                    scope=current.scope,
                    scope_key=current.scope_key,
                    values=values,
                    expected_version=current.version,
                )
                if persist
                else StateView(
                    app_id=app_id,
                    scope="transient",
                    scope_key="request",
                    values=values,
                    version=current.version + 1,
                )
            )
            return ActionResult(state=state)
        if isinstance(action, OpenDialogAction | CloseDialogAction):
            mode = "open" if isinstance(action, OpenDialogAction) else "close"
            return ActionResult(modal=(mode, action.target))
        if isinstance(action, ToastAction):
            message = self._evaluate(
                action.message,
                {
                    "data": self._data_namespace(app_id, data_source, principal, request_id),
                    "state": current.values,
                    "event": event_data,
                },
            )
            if not isinstance(message, str):
                raise ForbiddenError("toast message must evaluate to text")
            return ActionResult(toast=(action.level, message))
        if isinstance(action, RefreshDataAction):
            return ActionResult(refresh_source=action.source)
        if isinstance(action, NavigateAction):
            return ActionResult(navigation=action.destination)
        if isinstance(action, InvokeCapabilityAction | SubmitFormAction):
            if not persist:
                raise ForbiddenError("capabilities require stateful mode")
            capability_name = action.capability
            payload: JsonValue = event_data.get("value")
            if isinstance(action, InvokeCapabilityAction) and action.payload is not None:
                payload = self._state_value(
                    self._evaluate(
                        action.payload,
                        {
                            "data": self._data_namespace(
                                app_id, data_source, principal, request_id
                            ),
                            "state": current.values,
                            "event": event_data,
                        },
                    )
                )
            result = self.capabilities.invoke(
                CapabilityContext(
                    app_id=app_id,
                    action_id=action_id,
                    capability=capability_name,
                    payload=payload,
                    event=event_data,
                    principal=principal,
                    request_id=request_id,
                    confirmed=confirmed,
                )
            )
            return ActionResult(
                capability=result,
                refresh_source=data_source if result.refresh else None,
            )
        raise ForbiddenError("unsupported action")

    def execute(
        self,
        app_id: str,
        action_id: str,
        *,
        scope: str,
        scope_key: str,
        expected_version: int | None = None,
        event: Mapping[str, JsonValue] | None = None,
        principal: Principal | None = None,
        request_id: str = "library",
        confirmed: bool = False,
    ) -> ActionResult:
        revision = self.apps.get_current_manifest(app_id)
        action = revision.manifest.actions.get(action_id)
        if action is None:
            raise NotFoundError("manifest action not found")
        event_data = self._event(event)
        current = self.state.get(app_id, scope=scope, scope_key=scope_key)
        if expected_version is not None and current.version != expected_version:
            from forgeui.services.exceptions import ConflictError

            raise ConflictError("state version changed")
        declared = cast(Mapping[str, JsonValue], revision.manifest.state.values)
        return self._dispatch(
            app_id=app_id,
            action_id=action_id,
            action=action,
            current=current,
            declared=declared,
            event_data=event_data,
            persist=True,
            principal=principal or Principal.anonymous(scope_key),
            request_id=request_id,
            confirmed=confirmed,
            data_source=revision.manifest.data.source,
        )

    def execute_transient(
        self,
        app_id: str,
        action_id: str,
        *,
        values: Mapping[str, JsonValue],
        event: Mapping[str, JsonValue] | None = None,
        principal: Principal | None = None,
        request_id: str = "stateless",
    ) -> ActionResult:
        """Execute a safe action against request-carried state without persistence.

        Capability and form-submit actions are intentionally unavailable because a
        stateless render request must not become a side-effecting capability call.
        """

        revision = self.apps.get_current_manifest(app_id)
        action = revision.manifest.actions.get(action_id)
        if action is None:
            raise NotFoundError("manifest action not found")
        declared = cast(Mapping[str, JsonValue], revision.manifest.state.values)
        if set(values) != set(declared):
            raise ForbiddenError("transient state keys must match the manifest declaration")
        for key, declared_value in declared.items():
            if not self._matches_declared_type(values[key], declared_value):
                raise ForbiddenError("transient state value does not match its declaration")
        current = StateView(
            app_id=app_id,
            scope="transient",
            scope_key="request",
            values=dict(values),
            version=0,
        )
        return self._dispatch(
            app_id=app_id,
            action_id=action_id,
            action=action,
            current=current,
            declared=declared,
            event_data=self._event(event),
            persist=False,
            principal=principal or Principal.anonymous("stateless"),
            request_id=request_id,
            confirmed=False,
            data_source=revision.manifest.data.source,
        )
