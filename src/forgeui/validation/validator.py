"""Structural, graph and semantic validation for `forgeui/1`."""

from __future__ import annotations

import json
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from types import MappingProxyType
from typing import Any, Literal

from pydantic import ValidationError

from forgeui.catalog.registry import component_registry
from forgeui.domain.device_health import DEVICE_HEALTH_PATHS
from forgeui.domain.models import (
    MAX_MANIFEST_BYTES,
    AppendCollectionAction,
    CloseDialogAction,
    DeleteCollectionAction,
    ForgeManifest,
    IncrementStateAction,
    InvokeCapabilityAction,
    NavigateAction,
    OpenDialogAction,
    RefreshDataAction,
    SetStateAction,
    SubmitFormAction,
    ToggleStateAction,
    UpdateCollectionAction,
)
from forgeui.expressions.ast import (
    CallExpr,
    Expression,
    ExpressionAdapter,
    OpExpr,
    RefExpr,
    expression_metrics,
)

MAX_GRAPH_DEPTH = 12


@dataclass(frozen=True, slots=True)
class ManifestPolicy:
    """Host-owned names and paths a manifest may reference.

    The policy contains identifiers and schemas only. Endpoint locations, credentials, handlers,
    database objects, and other ambient authority intentionally cannot be represented here.
    """

    contracts: Mapping[str, frozenset[str]]
    sources: Mapping[str, str]
    capabilities: frozenset[str] = field(default_factory=frozenset)
    destinations: frozenset[str] = field(default_factory=frozenset)

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "contracts",
            MappingProxyType(
                {contract_id: frozenset(paths) for contract_id, paths in self.contracts.items()}
            ),
        )
        object.__setattr__(self, "sources", MappingProxyType(dict(self.sources)))
        object.__setattr__(self, "capabilities", frozenset(self.capabilities))
        object.__setattr__(self, "destinations", frozenset(self.destinations))

    def paths_for(self, contract: str) -> frozenset[str]:
        return self.contracts.get(contract, frozenset())


DEFAULT_MANIFEST_POLICY = ManifestPolicy(
    contracts={"device-health/1": DEVICE_HEALTH_PATHS},
    sources={"device-health": "device-health/1"},
    capabilities=frozenset({"device-note.create", "incident.acknowledge"}),
    destinations=frozenset({"overview", "devices"}),
)


@dataclass(frozen=True, slots=True)
class ValidationIssue:
    code: str
    path: str
    message: str
    severity: Literal["error", "warning"] = "error"

    def as_dict(self) -> dict[str, str]:
        return {
            "code": self.code,
            "path": self.path,
            "message": self.message,
            "severity": self.severity,
        }


@dataclass(frozen=True, slots=True)
class ValidationReport:
    valid: bool
    issues: tuple[ValidationIssue, ...] = field(default_factory=tuple)
    manifest: ForgeManifest | None = None

    @classmethod
    def invalid(cls, code: str, path: str, message: str) -> ValidationReport:
        return cls(False, (ValidationIssue(code, path, message),), None)

    @property
    def errors(self) -> tuple[ValidationIssue, ...]:
        return tuple(issue for issue in self.issues if issue.severity == "error")


def _pydantic_issues(error: ValidationError) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for detail in error.errors(include_url=False):
        location = ".".join(str(part) for part in detail["loc"])
        issues.append(
            ValidationIssue("schema", f"$.{location}" if location else "$", detail["msg"])
        )
    return issues


def _walk_expressions(value: object, path: str) -> list[tuple[str, Expression]]:
    found: list[tuple[str, Expression]] = []
    if isinstance(value, dict):
        if "kind" in value:
            try:
                found.append((path, ExpressionAdapter.validate_python(value, strict=True)))
                return found
            except ValidationError:
                return found
        for key, child in value.items():
            found.extend(_walk_expressions(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(_walk_expressions(child, f"{path}[{index}]"))
    return found


def _validate_ref(
    path: str,
    ref: RefExpr,
    manifest: ForgeManifest,
    issues: list[ValidationIssue],
    *,
    allow_event: bool,
    allowed_data_paths: frozenset[str],
) -> None:
    reference = ref.path
    if reference.startswith(("data.", "item.")):
        if reference not in allowed_data_paths:
            issues.append(
                ValidationIssue("unknown_data_path", path, f"unknown data path: {reference}")
            )
    elif reference.startswith("state."):
        key = reference.split(".")[1]
        if key not in manifest.state.values:
            issues.append(
                ValidationIssue("unknown_state_path", path, f"unknown state path: {reference}")
            )
    elif reference.startswith("event.") and (
        not allow_event or reference not in {"event.value", "event.key", "event.item"}
    ):
        issues.append(
            ValidationIssue(
                "event_context_forbidden",
                path,
                "event paths are only allowed in an action payload",
            )
        )


def _expression_references(expression: Expression) -> list[RefExpr]:
    if isinstance(expression, RefExpr):
        return [expression]
    if isinstance(expression, (CallExpr, OpExpr)):
        return [
            reference
            for argument in expression.args
            for reference in _expression_references(argument)
        ]
    return []


def _validate_expressions(
    value: object,
    path: str,
    manifest: ForgeManifest,
    issues: list[ValidationIssue],
    *,
    allow_event: bool = False,
    allowed_data_paths: frozenset[str],
) -> None:
    for expression_path, expression in _walk_expressions(value, path):
        depth, nodes = expression_metrics(expression)
        if depth > 8 or nodes > 64:
            issues.append(
                ValidationIssue(
                    "expression_limit", expression_path, "expression exceeds complexity budget"
                )
            )
        for reference in _expression_references(expression):
            _validate_ref(
                expression_path,
                reference,
                manifest,
                issues,
                allow_event=allow_event,
                allowed_data_paths=allowed_data_paths,
            )


def _validate_graph(manifest: ForgeManifest, issues: list[ValidationIssue]) -> set[str]:
    if manifest.root not in manifest.elements:
        issues.append(
            ValidationIssue("missing_root", "$.root", "root does not refer to an element")
        )
        return set()
    reachable: set[str] = set()
    visiting: set[str] = set()

    def visit(element_id: str, depth: int) -> None:
        if depth > MAX_GRAPH_DEPTH:
            issues.append(
                ValidationIssue(
                    "graph_depth", f"$.elements.{element_id}", "graph exceeds depth limit"
                )
            )
            return
        if element_id in visiting:
            issues.append(
                ValidationIssue(
                    "graph_cycle", f"$.elements.{element_id}", "element graph contains a cycle"
                )
            )
            return
        if element_id in reachable:
            return
        reachable.add(element_id)
        visiting.add(element_id)
        element = manifest.elements[element_id]
        try:
            spec = component_registry.get(element.type)
            if element.children and not spec.accepts_children:
                issues.append(
                    ValidationIssue(
                        "children_not_allowed",
                        f"$.elements.{element_id}.children",
                        f"{element.type} cannot contain children",
                    )
                )
            if element.type == "repeat" and len(element.children) != 1:
                issues.append(
                    ValidationIssue(
                        "repeat_child_count",
                        f"$.elements.{element_id}.children",
                        "repeat requires exactly one template child",
                    )
                )
        except ValueError:
            # Schema validation normally intercepts this. Keep graph validation defensive.
            issues.append(
                ValidationIssue("unknown_component", f"$.elements.{element_id}.type", element.type)
            )
        for child in element.children:
            if child not in manifest.elements:
                issues.append(
                    ValidationIssue(
                        "missing_child",
                        f"$.elements.{element_id}.children",
                        f"unknown child: {child}",
                    )
                )
                continue
            visit(child, depth + 1)
        visiting.remove(element_id)

    visit(manifest.root, 1)
    issues.extend(
        ValidationIssue(
            "unreachable_element",
            f"$.elements.{element_id}",
            "element is not reachable from root",
        )
        for element_id in manifest.elements
        if element_id not in reachable
    )
    return reachable


def _validate_actions(
    manifest: ForgeManifest,
    issues: list[ValidationIssue],
    policy: ManifestPolicy,
    allowed_data_paths: frozenset[str],
) -> None:
    writable = set(manifest.state.writable)
    for action_id, action in manifest.actions.items():
        path = f"$.actions.{action_id}"
        if isinstance(
            action,
            (
                SetStateAction,
                ToggleStateAction,
                IncrementStateAction,
                AppendCollectionAction,
                UpdateCollectionAction,
                DeleteCollectionAction,
            ),
        ):
            if action.path not in writable:
                issues.append(
                    ValidationIssue(
                        "state_write_forbidden", f"{path}.path", "state path is not writable"
                    )
                )
            state_key = action.path.split(".")[1]
            state_value = manifest.state.values.get(state_key)
            if isinstance(action, ToggleStateAction) and not isinstance(state_value, bool):
                issues.append(
                    ValidationIssue(
                        "toggle_requires_boolean",
                        f"{path}.path",
                        "toggle actions require a declared boolean state value",
                    )
                )
            if isinstance(action, IncrementStateAction) and (
                isinstance(state_value, bool) or not isinstance(state_value, (int, float))
            ):
                issues.append(
                    ValidationIssue(
                        "increment_requires_number",
                        f"{path}.path",
                        "increment actions require a declared numeric state value",
                    )
                )
            if isinstance(
                action, (AppendCollectionAction, UpdateCollectionAction, DeleteCollectionAction)
            ) and not isinstance(state_value, list):
                issues.append(
                    ValidationIssue(
                        "collection_action_requires_list",
                        f"{path}.path",
                        "collection actions require a declared list state value",
                    )
                )
            for expression_key in ("value", "amount", "match"):
                expression = getattr(action, expression_key, None)
                if expression is not None:
                    _validate_expressions(
                        expression.model_dump(mode="python"),
                        f"{path}.{expression_key}",
                        manifest,
                        issues,
                        allow_event=True,
                        allowed_data_paths=allowed_data_paths,
                    )
        elif isinstance(action, (OpenDialogAction, CloseDialogAction)):
            target = manifest.elements.get(action.target)
            if target is None or target.type != "modal":
                issues.append(
                    ValidationIssue(
                        "invalid_modal_target", f"{path}.target", "target must be a modal element"
                    )
                )
        elif isinstance(action, SubmitFormAction):
            form = manifest.elements.get(action.form)
            if form is None or form.type != "form":
                issues.append(
                    ValidationIssue(
                        "invalid_form_target", f"{path}.form", "form must be a form element"
                    )
                )
            if action.capability not in policy.capabilities:
                issues.append(
                    ValidationIssue(
                        "unknown_capability",
                        f"{path}.capability",
                        "capability is not registered for this ForgeUI instance",
                    )
                )
        elif isinstance(action, InvokeCapabilityAction) and action.payload is not None:
            _validate_expressions(
                action.payload.model_dump(mode="python"),
                f"{path}.payload",
                manifest,
                issues,
                allow_event=True,
                allowed_data_paths=allowed_data_paths,
            )
        if (
            isinstance(action, InvokeCapabilityAction)
            and action.capability not in policy.capabilities
        ):
            issues.append(
                ValidationIssue(
                    "unknown_capability",
                    f"{path}.capability",
                    "capability is not registered for this ForgeUI instance",
                )
            )
        if isinstance(action, RefreshDataAction) and action.source != manifest.data.source:
            issues.append(
                ValidationIssue(
                    "source_refresh_forbidden",
                    f"{path}.source",
                    "an action may refresh only the manifest's registered data source",
                )
            )
        if isinstance(action, NavigateAction) and action.destination not in policy.destinations:
            issues.append(
                ValidationIssue(
                    "unknown_destination",
                    f"{path}.destination",
                    "navigation destination is not registered for this ForgeUI instance",
                )
            )


def _validate_collection_fields(
    element_id: str,
    component_type: str,
    props: Mapping[str, object],
    allowed_data_paths: frozenset[str],
    issues: list[ValidationIssue],
) -> None:
    """Reject safe-but-unknown row keys before they become empty UI output."""

    raw_data = props.get("data")
    if not isinstance(raw_data, Mapping) or raw_data.get("kind") != "ref":
        return
    base_path = raw_data.get("path")
    if not isinstance(base_path, str) or not base_path.startswith("data."):
        return
    fields: list[tuple[str, str]] = []
    if component_type == "table":
        columns = props.get("columns")
        if isinstance(columns, list):
            for index, column in enumerate(columns):
                if isinstance(column, Mapping) and isinstance(column.get("key"), str):
                    fields.append((f"columns[{index}].key", str(column["key"])))
    if component_type in {"line-chart", "bar-chart", "donut-chart"}:
        if isinstance(props.get("x_key"), str):
            fields.append(("x_key", str(props["x_key"])))
        series = props.get("series")
        if isinstance(series, list):
            for index, item in enumerate(series):
                if isinstance(item, Mapping) and isinstance(item.get("value"), str):
                    fields.append((f"series[{index}].value", str(item["value"])))
    if component_type == "aggregate-metric" and isinstance(props.get("value_key"), str):
        fields.append(("value_key", str(props["value_key"])))
    filters = props.get("filters", [])
    for index, rule in enumerate(filters if isinstance(filters, list) else []):
        if isinstance(rule, Mapping) and isinstance(rule.get("key"), str):
            fields.append((f"filters[{index}].key", str(rule["key"])))
    if component_type == "sparkline" and isinstance(props.get("value"), str):
        fields.append(("value", str(props["value"])))
    if isinstance(props.get("filter_key"), str):
        fields.append(("filter_key", str(props["filter_key"])))
    for field_path, key in fields:
        if (
            f"{base_path}.{key}" not in allowed_data_paths
            and f"item.{key}" not in allowed_data_paths
        ):
            issues.append(
                ValidationIssue(
                    "unknown_collection_field",
                    f"$.elements.{element_id}.props.{field_path}",
                    f"field is not declared by the active data contract: {key}",
                )
            )


def _validate_semantics(
    manifest: ForgeManifest, issues: list[ValidationIssue], policy: ManifestPolicy
) -> None:
    contract_paths = policy.paths_for(manifest.data.contract)
    if not contract_paths:
        issues.append(
            ValidationIssue(
                "unknown_data_contract",
                "$.data.contract",
                "data contract is not registered for this ForgeUI instance",
            )
        )
    source_contract = policy.sources.get(manifest.data.source)
    if source_contract is None:
        issues.append(
            ValidationIssue(
                "unknown_data_source",
                "$.data.source",
                "data source is not registered for this ForgeUI instance",
            )
        )
    elif source_contract != manifest.data.contract:
        issues.append(
            ValidationIssue(
                "source_contract_mismatch",
                "$.data",
                "data source does not provide the declared contract",
            )
        )
    writable = set(manifest.state.writable)
    for element_id, element in manifest.elements.items():
        path = f"$.elements.{element_id}"
        if not component_registry.is_compatible(element.type, manifest.design.name):
            issues.append(
                ValidationIssue(
                    "profile_incompatible",
                    f"{path}.type",
                    f"{element.type} is not available in {manifest.design.name}",
                )
            )
        if element.action is not None:
            action = manifest.actions.get(element.action)
            if action is None:
                issues.append(
                    ValidationIssue(
                        "missing_action", f"{path}.action", "element action is not declared"
                    )
                )
            elif not component_registry.get(element.type).supports_action:
                issues.append(
                    ValidationIssue(
                        "action_not_supported",
                        f"{path}.action",
                        f"{element.type} does not expose an interactive action affordance",
                    )
                )
            elif element.type not in {"button", "form"} and not isinstance(action, NavigateAction):
                issues.append(
                    ValidationIssue(
                        "surface_action_requires_navigation",
                        f"{path}.action",
                        "dashboard surface drill-downs require a registered navigate action",
                    )
                )
        if element.type == "breadcrumbs":
            items = element.props.get("items")
            if isinstance(items, list):
                for index, item in enumerate(items):
                    if (
                        isinstance(item, Mapping)
                        and item.get("destination") not in policy.destinations
                    ):
                        issues.append(
                            ValidationIssue(
                                "unknown_destination",
                                f"{path}.props.items[{index}].destination",
                                "breadcrumb destination is not registered for this "
                                "ForgeUI instance",
                            )
                        )
        for binding_key in ("state_path", "page_state", "filter_state"):
            binding_path = element.props.get(binding_key)
            if isinstance(binding_path, str) and binding_path not in writable:
                issues.append(
                    ValidationIssue(
                        "state_binding_forbidden",
                        f"{path}.props.{binding_key}",
                        "interactive component must bind a declared writable state path",
                    )
                )
        filters = element.props.get("filters", [])
        for index, rule in enumerate(filters if isinstance(filters, list) else []):
            if rule["state_path"] not in writable:
                issues.append(
                    ValidationIssue(
                        "state_binding_forbidden",
                        f"{path}.props.filters[{index}].state_path",
                        "filter must bind declared writable state",
                    )
                )
        _validate_expressions(
            element.props,
            f"{path}.props",
            manifest,
            issues,
            allowed_data_paths=contract_paths,
        )
        _validate_collection_fields(
            element_id,
            element.type,
            element.props,
            contract_paths,
            issues,
        )
        if element.visible is not None:
            _validate_expressions(
                element.visible.model_dump(mode="python"),
                f"{path}.visible",
                manifest,
                issues,
                allowed_data_paths=contract_paths,
            )
    _validate_actions(manifest, issues, policy, contract_paths)


def validate_manifest(
    candidate: ForgeManifest | Mapping[str, object],
    *,
    dry_render: Callable[[ForgeManifest], None] | None = None,
    policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY,
) -> ValidationReport:
    """Validate a candidate before it is persisted or passed to a renderer.

    ``dry_render`` is injected by the renderer phase and must be free of persistence side effects.
    """

    try:
        raw = (
            candidate.model_dump(mode="json") if isinstance(candidate, ForgeManifest) else candidate
        )
        encoded = json.dumps(raw, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    except (TypeError, ValueError) as exc:
        return ValidationReport.invalid("non_json", "$", str(exc))
    if len(encoded) > MAX_MANIFEST_BYTES:
        return ValidationReport.invalid("manifest_size", "$", "manifest exceeds 256 KiB")
    try:
        manifest = (
            candidate
            if isinstance(candidate, ForgeManifest)
            else ForgeManifest.model_validate(candidate, strict=True)
        )
    except ValidationError as exc:
        return ValidationReport(False, tuple(_pydantic_issues(exc)))
    issues: list[ValidationIssue] = []
    _validate_graph(manifest, issues)
    _validate_semantics(manifest, issues, policy)
    if not issues and dry_render is not None:
        try:
            dry_render(manifest)
        except Exception as exc:  # renderer is an integration boundary, not trusted input
            issues.append(ValidationIssue("dry_render_failed", "$", str(exc)))
    return ValidationReport(
        not any(issue.severity == "error" for issue in issues),
        tuple(issues),
        manifest if not issues else None,
    )


def manifest_json_schema(
    policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY,
) -> dict[str, Any]:
    """Return the schema the model receives; it is generated from the same runtime models."""

    schema = component_registry.manifest_schema()
    definitions = schema.get("$defs")
    if not isinstance(definitions, dict):
        return schema

    def restrict(definition: str, property_name: str, values: list[str]) -> None:
        model = definitions.get(definition)
        if not isinstance(model, dict):
            return
        properties = model.get("properties")
        if not isinstance(properties, dict):
            return
        prop = properties.get(property_name)
        if isinstance(prop, dict):
            prop["enum"] = values
            prop.pop("pattern", None)

    restrict("DataContractDeclaration", "contract", sorted(policy.contracts))
    restrict("DataContractDeclaration", "source", sorted(policy.sources))
    restrict("RefreshDataAction", "source", sorted(policy.sources))
    restrict("SubmitFormAction", "capability", sorted(policy.capabilities))
    restrict("InvokeCapabilityAction", "capability", sorted(policy.capabilities))
    restrict("NavigateAction", "destination", sorted(policy.destinations))
    restrict("BreadcrumbItem", "destination", sorted(policy.destinations))
    return schema
