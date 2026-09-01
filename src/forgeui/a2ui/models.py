"""Validated models for ForgeUI's pinned, non-conformant A2UI import subset.

The source schemas are the closed Google A2UI v0.9.1 production specification
at commit ``d4723f29254520e1214d5004cb555d83eaafb828``:

* https://github.com/google/A2UI/blob/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1/json/server_to_client.json
* https://github.com/google/A2UI/blob/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1/catalogs/basic/catalog.json

These models intentionally represent only the fields that can be translated
without weakening ``forgeui/1``. They are not a copy of the complete schema.
"""

from __future__ import annotations

from typing import Annotated, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, Field

A2UI_VERSION = "v0.9.1"
A2UI_SPEC_COMMIT = "d4723f29254520e1214d5004cb555d83eaafb828"
A2UI_MIME_TYPE = "application/a2ui+json"
A2UI_SERVER_SCHEMA_URL = "https://a2ui.org/specification/v0_9_1/server_to_client.json"
A2UI_BASIC_CATALOG_ID = "https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json"

MAX_A2UI_BYTES = 262_144
MAX_A2UI_MESSAGES = 32

A2UIIdentifier = Annotated[
    str,
    Field(min_length=1, max_length=64, pattern=r"^[a-z][a-z0-9_-]*$"),
]


class A2UIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class A2UIDataBinding(A2UIModel):
    """The path branch of v0.9.1 ``DynamicString``; functions are unsupported."""

    path: Annotated[str, Field(min_length=2, max_length=160, pattern=r"^/[a-z0-9_/]*$")]


A2UIDynamicString: TypeAlias = str | A2UIDataBinding


class A2UICreateSurface(A2UIModel):
    surface_id: A2UIIdentifier = Field(alias="surfaceId")
    catalog_id: Literal["https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json"] = (
        Field(alias="catalogId")
    )
    send_data_model: Literal[False] = Field(default=False, alias="sendDataModel")


class A2UIUpdateComponents(A2UIModel):
    surface_id: A2UIIdentifier = Field(alias="surfaceId")
    components: list[dict[str, object]] = Field(min_length=1, max_length=80)


class A2UIUpdateDataModel(A2UIModel):
    surface_id: A2UIIdentifier = Field(alias="surfaceId")
    path: Literal["/"] = "/"
    value: dict[str, object]


class A2UIComponent(A2UIModel):
    id: A2UIIdentifier


class A2UIText(A2UIComponent):
    component: Literal["Text"]
    text: A2UIDynamicString
    variant: Literal["h1", "h2", "h3", "h4", "caption", "body"] = "body"


class A2UIColumn(A2UIComponent):
    component: Literal["Column"]
    children: list[A2UIIdentifier] = Field(max_length=12)
    justify: Literal["start"] = "start"
    align: Literal["start", "center", "stretch"] = "stretch"


class A2UIRow(A2UIComponent):
    component: Literal["Row"]
    children: list[A2UIIdentifier] = Field(max_length=12)
    justify: Literal["start"] = "start"
    align: Literal["start", "center", "stretch"] = "stretch"


class A2UICard(A2UIComponent):
    component: Literal["Card"]
    child: A2UIIdentifier


class A2UIDivider(A2UIComponent):
    component: Literal["Divider"]
    axis: Literal["horizontal"] = "horizontal"


class A2UIIcon(A2UIComponent):
    component: Literal["Icon"]
    name: Literal["check", "error", "search", "warning"]


SupportedA2UIComponent: TypeAlias = (
    A2UIText | A2UIColumn | A2UIRow | A2UICard | A2UIDivider | A2UIIcon
)

SUPPORTED_COMPONENT_MODELS: dict[str, type[A2UIComponent]] = {
    "Text": A2UIText,
    "Column": A2UIColumn,
    "Row": A2UIRow,
    "Card": A2UICard,
    "Divider": A2UIDivider,
    "Icon": A2UIIcon,
}
