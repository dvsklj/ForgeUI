"""Strict `forgeui/1` manifest models.  Semantic checks live in validation."""

from __future__ import annotations

from typing import Annotated, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, Field, model_validator

from forgeui.expressions.ast import Expression

MANIFEST_SPEC = "forgeui/1"
MAX_MANIFEST_BYTES = 262_144
MAX_ELEMENTS = 80
MAX_CHILDREN = 12
MAX_ACTIONS = 40
MAX_RENDERED_ROWS = 100
MAX_CHART_POINTS = 120
MAX_CHART_SERIES = 6

Identifier = Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_-]*$")]
ElementId = Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_-]*$")]
RuntimeIdentifier = Annotated[
    str,
    Field(
        min_length=1,
        max_length=120,
        pattern=r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$",
    ),
]
ContractId = Annotated[
    str,
    Field(
        min_length=3,
        max_length=120,
        pattern=r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*/[1-9][0-9]*$",
    ),
]
StatePath = Annotated[
    str,
    Field(
        min_length=7,
        max_length=160,
        pattern=r"^state(\.[a-z][a-z0-9_]*)+$",
    ),
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class ManifestMetadata(StrictModel):
    title: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    version: str = Field(default="1", min_length=1, max_length=32, pattern=r"^[A-Za-z0-9._-]+$")


class DesignProfile(StrictModel):
    name: Literal["ops-compact", "signal-cards", "executive-summary", "calm-neutral"]
    color_mode: Literal["system", "light", "dark"] = "system"


class ManifestContext(StrictModel):
    """A bounded, descriptive context. It never names a URL or template."""

    locale: Literal["en-US"] = "en-US"
    timezone: Literal["UTC"] = "UTC"
    refresh_seconds: int = Field(default=60, ge=10, le=3600)


class DataContractDeclaration(StrictModel):
    """Host-registered data contract and source IDs; never an endpoint or executable handle."""

    contract: ContractId = "device-health/1"
    source: RuntimeIdentifier = "device-health"


JsonScalar: TypeAlias = str | int | float | bool | None
StateValue: TypeAlias = JsonScalar | list[JsonScalar]


class StateDeclaration(StrictModel):
    values: dict[Identifier, StateValue] = Field(default_factory=dict, max_length=32)
    writable: list[StatePath] = Field(default_factory=list, max_length=32)

    @model_validator(mode="after")
    def writable_paths_exist(self) -> StateDeclaration:
        for path in self.writable:
            first_segment = path.split(".")[1]
            if first_segment not in self.values:
                raise ValueError(f"writable path does not refer to declared state: {path}")
        return self


class SetStateAction(StrictModel):
    type: Literal["set_state"]
    path: StatePath
    value: Expression


class ToggleStateAction(StrictModel):
    type: Literal["toggle_state"]
    path: StatePath


class IncrementStateAction(StrictModel):
    type: Literal["increment_state"]
    path: StatePath
    amount: Expression


class AppendCollectionAction(StrictModel):
    type: Literal["append_collection"]
    path: StatePath
    value: Expression


class UpdateCollectionAction(StrictModel):
    type: Literal["update_collection"]
    path: StatePath
    match: Expression
    value: Expression


class DeleteCollectionAction(StrictModel):
    type: Literal["delete_collection"]
    path: StatePath
    match: Expression


class RefreshDataAction(StrictModel):
    type: Literal["refresh_source"]
    source: RuntimeIdentifier


class OpenDialogAction(StrictModel):
    type: Literal["open_modal"]
    target: ElementId


class CloseDialogAction(StrictModel):
    type: Literal["close_modal"]
    target: ElementId


class ToastAction(StrictModel):
    type: Literal["toast"]
    message: Expression
    level: Literal["info", "success", "warning", "error"] = "info"


class SubmitFormAction(StrictModel):
    type: Literal["submit_form"]
    form: ElementId
    capability: RuntimeIdentifier


class NavigateAction(StrictModel):
    type: Literal["navigate"]
    destination: RuntimeIdentifier


class InvokeCapabilityAction(StrictModel):
    type: Literal["invoke_capability"]
    capability: RuntimeIdentifier
    payload: Expression | None = None


Action: TypeAlias = Annotated[
    SetStateAction
    | ToggleStateAction
    | IncrementStateAction
    | AppendCollectionAction
    | UpdateCollectionAction
    | DeleteCollectionAction
    | RefreshDataAction
    | OpenDialogAction
    | CloseDialogAction
    | ToastAction
    | SubmitFormAction
    | NavigateAction
    | InvokeCapabilityAction,
    Field(discriminator="type"),
]


class Element(StrictModel):
    """Flat graph node. Its prop model is selected by the catalog at validation time."""

    type: str = Field(min_length=1, max_length=48, pattern=r"^[a-z][a-z0-9-]*$")
    props: dict[str, object] = Field(default_factory=dict, max_length=24)
    children: list[ElementId] = Field(default_factory=list, max_length=MAX_CHILDREN)
    visible: Expression | None = None
    action: Identifier | None = None

    @model_validator(mode="after")
    def parse_component_props(self) -> Element:
        # Local import prevents a domain/catalog import cycle while preserving Pydantic parsing.
        from forgeui.catalog.registry import component_registry

        model = component_registry.parse_props(self.type, self.props)
        self.props = model.model_dump(mode="python")
        return self


class ForgeManifest(StrictModel):
    """The immutable, validated description a later service may persist and render."""

    spec: Literal["forgeui/1"] = "forgeui/1"
    metadata: ManifestMetadata
    design: DesignProfile
    context: ManifestContext = Field(default_factory=ManifestContext)
    data: DataContractDeclaration = Field(default_factory=DataContractDeclaration)
    state: StateDeclaration = Field(default_factory=StateDeclaration)
    root: ElementId
    elements: dict[ElementId, Element] = Field(min_length=1, max_length=MAX_ELEMENTS)
    actions: dict[Identifier, Action] = Field(default_factory=dict, max_length=MAX_ACTIONS)
