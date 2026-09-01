"""Single source of truth for component props, renderer names, profiles and prompt docs."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Annotated, Any, Literal, TypeAlias

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, ValidationError, model_validator

from forgeui.expressions.ast import Expression, RefExpr


def _safe_text(value: str) -> str:
    """Keep structural languages out of model-authored display fields.

    Device data remains separate from manifests and is always rendered with Jinja autoescape.
    """

    lowered = value.lower()
    forbidden = (
        "<script",
        "</",
        "{{",
        "}}",
        "javascript:",
        "data:text/html",
        "url(",
        "http://",
        "https://",
    )
    if any(fragment in lowered for fragment in forbidden):
        raise ValueError("text cannot contain markup, code, or URLs")
    return value


SafeText = Annotated[str, Field(min_length=1, max_length=240), AfterValidator(_safe_text)]
ShortText = Annotated[str, Field(min_length=1, max_length=80), AfterValidator(_safe_text)]
TextValue: TypeAlias = SafeText | Expression
NumberValue: TypeAlias = (
    Annotated[int | float, Field(ge=-1_000_000_000, le=1_000_000_000)] | Expression
)
BoolValue: TypeAlias = bool | Expression
StatePath = Annotated[str, Field(pattern=r"^state\.[a-z][a-z0-9_]*$", max_length=80)]
DataKey = Annotated[str, Field(pattern=r"^[a-z][a-z0-9_]*$", max_length=64)]
DestinationId = Annotated[str, Field(pattern=r"^[a-z][a-z0-9_-]*$", max_length=64)]
AssetId = Annotated[
    str,
    Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_-]*$"),
]
DisplayFormat = Literal[
    "text", "number", "percent", "status", "datetime", "temperature", "duration-ms"
]


class Props(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class EmptyProps(Props):
    pass


class StackProps(Props):
    gap: Literal["none", "sm", "md", "lg"] = "md"
    align: Literal["start", "stretch", "center", "baseline"] = "stretch"


class InlineProps(StackProps):
    align: Literal["start", "stretch", "center", "baseline"] = "center"
    wrap: bool = True


class ContainerProps(Props):
    width: Literal["narrow", "standard", "wide"] = "standard"


class PageHeaderProps(Props):
    title: TextValue
    subtitle: TextValue | None = None


class GridProps(Props):
    columns: Literal[1, 2, 3, 4] = 2
    gap: Literal["sm", "md", "lg"] = "md"


class CardProps(Props):
    title: TextValue | None = None
    tone: Literal["default", "subtle", "highlight"] = "default"


class SectionProps(Props):
    title: TextValue | None = None
    description: TextValue | None = None


class HeadingProps(Props):
    text: TextValue
    level: Literal[1, 2, 3, 4] = 2


class TextProps(Props):
    text: TextValue
    tone: Literal["default", "muted", "positive", "warning", "critical"] = "default"


class BadgeProps(Props):
    label: TextValue
    status: Literal["neutral", "healthy", "warning", "critical", "offline"] = "neutral"


class MetricProps(Props):
    label: TextValue
    value: TextValue | NumberValue
    detail: TextValue | None = None
    status: Literal["neutral", "healthy", "warning", "critical"] = "neutral"


class AlertProps(Props):
    title: TextValue
    message: TextValue
    level: Literal["info", "success", "warning", "error"] = "info"


class ProgressProps(Props):
    label: TextValue
    value: NumberValue
    maximum: Annotated[int | float, Field(gt=0, le=1_000_000)] = 100


class EmptyStateProps(Props):
    title: TextValue
    message: TextValue


class IconProps(Props):
    name: Literal[
        "activity",
        "alert",
        "check",
        "chevron-right",
        "cpu",
        "device",
        "disk",
        "memory",
        "search",
        "warning",
    ]
    label: SafeText | None = None


class KeyValueRow(Props):
    label: ShortText
    value: TextValue | NumberValue
    format: DisplayFormat = "text"


class KeyValueProps(Props):
    items: list[KeyValueRow] = Field(min_length=1, max_length=12)


class TableColumn(Props):
    key: DataKey
    label: ShortText
    emphasis: bool = False
    format: DisplayFormat = "text"


class TableProps(Props):
    data: RefExpr
    columns: list[TableColumn] = Field(min_length=1, max_length=6)
    empty_message: SafeText = "No devices match the current filters."
    filter_state: StatePath | None = None
    filter_key: DataKey | None = None
    page_state: StatePath | None = None
    page_size: Literal[5, 10, 25, 50, 100] = 25

    @model_validator(mode="after")
    def filter_pair_is_complete(self) -> TableProps:
        if (self.filter_state is None) != (self.filter_key is None):
            raise ValueError("filter_state and filter_key must be provided together")
        return self


class ChartSeries(Props):
    label: ShortText
    value: DataKey


class ChartProps(Props):
    title: TextValue
    data: RefExpr
    kind: Literal["bar", "line", "area"] = "bar"
    x_key: DataKey | None = None
    x_axis_label: ShortText = "Observation"
    y_axis_label: ShortText = "Value"
    value_format: Literal["number", "percent"] = "number"
    series: list[ChartSeries] = Field(min_length=1, max_length=6)


class StatusListProps(Props):
    data: RefExpr
    empty_message: SafeText = "No active items."


class TimelineProps(Props):
    data: RefExpr
    empty_message: SafeText = "No activity to show."
    filter_state: StatePath | None = None
    filter_key: DataKey | None = None

    @model_validator(mode="after")
    def filter_pair_is_complete(self) -> TimelineProps:
        if (self.filter_state is None) != (self.filter_key is None):
            raise ValueError("filter_state and filter_key must be provided together")
        return self


class SparklineProps(Props):
    data: RefExpr
    value: DataKey
    label: TextValue


class ButtonProps(Props):
    label: TextValue
    style: Literal["primary", "secondary", "quiet", "danger"] = "primary"
    disabled: BoolValue = False


class DialogProps(Props):
    title: TextValue
    description: TextValue | None = None


class FormProps(Props):
    title: TextValue
    submit_label: TextValue = "Save"


class FieldProps(Props):
    label: TextValue
    hint: TextValue | None = None
    required: bool = False


class FieldGroupProps(Props):
    legend: TextValue
    description: TextValue | None = None


class TextInputProps(Props):
    state_path: StatePath
    label: SafeText = "Text input"
    placeholder: SafeText | None = None
    input_mode: Literal["text", "search", "email"] = "text"


class NumberInputProps(Props):
    state_path: StatePath
    label: SafeText = "Number"
    minimum: int | float | None = None
    maximum: int | float | None = None


class SelectOption(Props):
    value: Annotated[str, Field(min_length=1, max_length=48, pattern=r"^[a-z0-9_-]+$")]
    label: ShortText


class SelectProps(Props):
    state_path: StatePath
    label: SafeText = "Select a value"
    options: list[SelectOption] = Field(min_length=1, max_length=12)


class CheckboxProps(Props):
    state_path: StatePath
    label: TextValue


class ToggleProps(CheckboxProps):
    pass


class SearchProps(Props):
    state_path: StatePath
    label: SafeText = "Search"
    placeholder: SafeText = "Search devices"


class TabsProps(Props):
    label: TextValue


class PaginationProps(Props):
    page_state: StatePath
    page_size: Literal[5, 10, 25, 50, 100] = 25
    data: RefExpr | None = None
    filter_state: StatePath | None = None
    filter_key: DataKey | None = None

    @model_validator(mode="after")
    def filter_pair_is_complete(self) -> PaginationProps:
        if (self.filter_state is None) != (self.filter_key is None):
            raise ValueError("filter_state and filter_key must be provided together")
        return self


class RepeatProps(Props):
    data: RefExpr
    empty_message: SafeText | None = None
    filter_state: StatePath | None = None
    filter_key: DataKey | None = None

    @model_validator(mode="after")
    def filter_pair_is_complete(self) -> RepeatProps:
        if (self.filter_state is None) != (self.filter_key is None):
            raise ValueError("filter_state and filter_key must be provided together")
        return self


class TextareaProps(Props):
    state_path: StatePath
    label: SafeText = "Text"
    placeholder: SafeText | None = None
    rows: Literal[3, 4, 5, 6] = 4


class RadioGroupProps(Props):
    state_path: StatePath
    label: SafeText = "Choose a value"
    options: list[SelectOption] = Field(min_length=2, max_length=12)


class DateRangeProps(Props):
    state_path: StatePath
    label: SafeText = "Date range"
    preset: Literal["24h", "7d", "30d"] = "24h"


class BreadcrumbItem(Props):
    label: ShortText
    destination: DestinationId


class BreadcrumbsProps(Props):
    items: list[BreadcrumbItem] = Field(min_length=1, max_length=4)


class ToastProps(Props):
    message: TextValue
    level: Literal["info", "success", "warning", "error"] = "info"


class ImageProps(Props):
    asset_id: AssetId
    alt: SafeText


class FileUploadProps(Props):
    state_path: StatePath
    accept: Literal["text/plain", "application/json"] = "text/plain"
    label: TextValue = "Upload file"


@dataclass(frozen=True, slots=True)
class ComponentSpec:
    name: str
    props_model: type[Props]
    template: str
    profiles: frozenset[str]
    accepts_children: bool = False
    supports_action: bool = False
    prompt: str = ""


class ComponentRegistry:
    """An immutable lookup table shared by validation, schema, prompts and render dispatch."""

    def __init__(self, specs: Iterable[ComponentSpec]) -> None:
        spec_items = tuple(specs)
        self._specs = {spec.name: spec for spec in spec_items}
        if not self._specs or len(self._specs) != len(spec_items):
            raise ValueError("component names must be unique")

    @property
    def names(self) -> frozenset[str]:
        return frozenset(self._specs)

    def get(self, name: str) -> ComponentSpec:
        try:
            return self._specs[name]
        except KeyError as exc:
            raise ValueError(f"unknown component type: {name}") from exc

    def parse_props(self, component_type: str, props: Mapping[str, object]) -> Props:
        try:
            return self.get(component_type).props_model.model_validate(props, strict=True)
        except ValidationError as exc:
            raise ValueError(f"invalid props for {component_type}: {exc}") from exc

    def is_compatible(self, component_type: str, profile: str) -> bool:
        return profile in self.get(component_type).profiles

    def prompt_docs(self) -> list[dict[str, object]]:
        """Compact serializable catalog documentation for the model prompt."""

        return [
            {
                "type": spec.name,
                "props": spec.props_model.model_json_schema(),
                "children": spec.accepts_children,
                "action": spec.supports_action,
                "profiles": sorted(spec.profiles),
                "note": spec.prompt,
            }
            for spec in self._specs.values()
        ]

    def manifest_schema(self) -> dict[str, Any]:
        """Generate JSON Schema from Pydantic and attach registry-controlled prop branches."""

        from forgeui.domain.models import ForgeManifest

        schema = ForgeManifest.model_json_schema()
        definitions = schema.setdefault("$defs", {})
        for spec in self._specs.values():
            definitions[f"Props_{spec.name.replace('-', '_')}"] = (
                spec.props_model.model_json_schema()
            )
        element = definitions.get("Element")
        if isinstance(element, dict):
            properties = element.setdefault("properties", {})
            type_schema = properties.get("type")
            if isinstance(type_schema, dict):
                type_schema["enum"] = sorted(self.names)
            element["allOf"] = [
                {
                    "if": {"properties": {"type": {"const": spec.name}}},
                    "then": {
                        "properties": {
                            "props": {"$ref": f"#/$defs/Props_{spec.name.replace('-', '_')}"},
                            **({} if spec.supports_action else {"action": False}),
                        }
                    },
                }
                for spec in self._specs.values()
            ]
        return schema


ALL_PROFILES = frozenset({"ops-compact", "signal-cards", "executive-summary", "calm-neutral"})
EXECUTIVE_PROFILES = frozenset({"ops-compact", "signal-cards", "executive-summary", "calm-neutral"})
DATA_PROFILES = frozenset({"ops-compact", "signal-cards", "calm-neutral"})


def _spec(
    name: str,
    props: type[Props],
    *,
    children: bool = False,
    action: bool = False,
    profiles: frozenset[str] = ALL_PROFILES,
    note: str = "",
) -> ComponentSpec:
    return ComponentSpec(
        name,
        props,
        "components/_component.html",
        profiles,
        accepts_children=children,
        supports_action=action,
        prompt=note,
    )


component_registry = ComponentRegistry(
    (
        _spec("page", EmptyProps, children=True),
        _spec("page-header", PageHeaderProps),
        _spec("container", ContainerProps, children=True),
        _spec("stack", StackProps, children=True),
        _spec("inline", InlineProps, children=True),
        _spec("grid", GridProps, children=True),
        _spec("card", CardProps, children=True, action=True),
        _spec("section", SectionProps, children=True),
        _spec("divider", EmptyProps),
        _spec("repeat", RepeatProps, children=True, profiles=DATA_PROFILES),
        _spec("heading", HeadingProps),
        _spec("text", TextProps),
        _spec("badge", BadgeProps),
        _spec("icon", IconProps),
        _spec("key-value", KeyValueProps),
        _spec("metric", MetricProps, action=True),
        _spec("alert", AlertProps, action=True),
        _spec("progress", ProgressProps, action=True),
        _spec("empty-state", EmptyStateProps, action=True),
        _spec(
            "table",
            TableProps,
            action=True,
            profiles=DATA_PROFILES,
            note="Data must be a data.* reference.",
        ),
        _spec("status-list", StatusListProps, action=True, profiles=DATA_PROFILES),
        _spec("timeline", TimelineProps, action=True, profiles=DATA_PROFILES),
        _spec("sparkline", SparklineProps, action=True, profiles=DATA_PROFILES),
        _spec(
            "line-chart",
            ChartProps,
            action=True,
            profiles=DATA_PROFILES,
            note="At most six declarative series.",
        ),
        _spec(
            "bar-chart",
            ChartProps,
            action=True,
            profiles=DATA_PROFILES,
            note="At most six declarative series.",
        ),
        _spec(
            "donut-chart",
            ChartProps,
            action=True,
            profiles=DATA_PROFILES,
            note="At most six declarative series.",
        ),
        _spec("button", ButtonProps, action=True),
        _spec("modal", DialogProps, children=True),
        _spec("form", FormProps, children=True, action=True),
        _spec("field-group", FieldGroupProps, children=True),
        _spec("field", FieldProps, children=True),
        _spec("text-input", TextInputProps),
        _spec("textarea", TextareaProps),
        _spec("number-input", NumberInputProps),
        _spec("select", SelectProps),
        _spec("radio-group", RadioGroupProps),
        _spec("checkbox", CheckboxProps),
        _spec("toggle", ToggleProps),
        _spec("search", SearchProps),
        _spec("tabs", TabsProps, children=True),
        _spec("date-range", DateRangeProps),
        _spec("breadcrumbs", BreadcrumbsProps),
        _spec("pagination", PaginationProps),
        _spec("toast", ToastProps),
        _spec("image", ImageProps),
        _spec("file-upload", FileUploadProps),
    )
)
