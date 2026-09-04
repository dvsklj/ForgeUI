"""The small, closed rendering boundary for ForgeUI manifests.

The manifest never determines a template, tag, class, URL, or executable value.
Only this module dispatches to component templates from :mod:`forgeui.catalog`.
"""

from __future__ import annotations

import logging
import math
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from types import MappingProxyType
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape
from markupsafe import Markup, escape
from pydantic import BaseModel, ValidationError

from forgeui import __version__
from forgeui.analytics import aggregate, filter_rows
from forgeui.catalog.registry import component_registry
from forgeui.domain.models import ForgeManifest
from forgeui.expressions import EvaluationError, evaluate_expression
from forgeui.expressions.ast import CallExpr, ExpressionAdapter, LiteralExpr, OpExpr, RefExpr
from forgeui.icons import render_heroicon
from forgeui.renderer.diagrams import diagram_svg
from forgeui.surfaces import PersistenceMode, SurfaceMode, surface_presentation

MAX_RENDER_ROWS = 100
MAX_CHART_POINTS = 120
_EMPTY: Mapping[str, Any] = MappingProxyType({})
logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class RenderContext:
    """Read-only input namespaces available to a rendered manifest.

    No ambient request, filesystem, environment, or callable objects are exposed.
    ``item`` is populated only while rendering a ``repeat`` child. ``event`` is
    intentionally empty for passive rendering and action execution happens in a
    separate, server-owned layer.
    """

    data: Mapping[str, Any] = field(default_factory=lambda: _EMPTY)
    state: Mapping[str, Any] = field(default_factory=lambda: _EMPTY)
    item: Mapping[str, Any] = field(default_factory=lambda: _EMPTY)
    event: Mapping[str, Any] = field(default_factory=lambda: _EMPTY)

    def __post_init__(self) -> None:
        """Detach namespace maps from callers so a render sees a stable top-level snapshot."""

        for namespace in ("data", "state", "item", "event"):
            value = getattr(self, namespace)
            object.__setattr__(self, namespace, MappingProxyType(dict(value)))

    def namespaces(self) -> Mapping[str, Mapping[str, Any]]:
        return MappingProxyType(
            {"data": self.data, "state": self.state, "item": self.item, "event": self.event}
        )

    def with_item(self, item: Mapping[str, Any]) -> RenderContext:
        """Create an isolated context for exactly one repeater row."""

        return RenderContext(self.data, self.state, MappingProxyType(dict(item)), self.event)


@dataclass(frozen=True, slots=True)
class _ComponentView:
    element_id: str
    type: str
    props: Mapping[str, Any]
    action: str | None
    action_icon: Markup | None


def _template_directory() -> Path:
    return Path(__file__).resolve().parents[1] / "web" / "templates"


def _asset_version() -> str:
    """Fingerprint trusted local assets so layout releases cannot remain stale in browsers."""

    digest = sha256()
    static_directory = _template_directory().parent / "static"
    try:
        for filename in ("forgeui.css", "forgeui.js", "forgeui-embed.js", "favicon.svg"):
            digest.update((static_directory / filename).read_bytes())
    except OSError:
        return __version__
    return f"{__version__}-{digest.hexdigest()[:12]}"


_ASSET_VERSION = _asset_version()


def _as_mapping(value: Any) -> Mapping[str, Any]:
    if isinstance(value, Mapping):
        return value
    return _EMPTY


def _normalise_data(value: Any) -> Any:
    """Convert Pydantic models to inert JSON-like values without exposing methods."""

    if isinstance(value, BaseModel):
        return value.model_dump(mode="python")
    return value


def _trusted_markup(value: str) -> Markup:
    """Mark only HTML composed by trusted templates or escaped renderer primitives.

    Keeping the conversion in one function makes the security boundary auditable. Callers must
    never pass a raw manifest or data value here.
    """

    return Markup(value)  # nosec B704  # noqa: S704 - reviewed trusted-renderer boundary


class Renderer:
    """Render a validated manifest through an allowlisted Jinja environment."""

    def __init__(self, template_directory: Path | None = None) -> None:
        self.template_directory = template_directory or _template_directory()
        self.environment = Environment(
            loader=FileSystemLoader(str(self.template_directory)),
            autoescape=select_autoescape(("html", "xml"), default_for_string=True),
            undefined=StrictUndefined,
            auto_reload=False,
        )

    def render(self, manifest: ForgeManifest, context: RenderContext | None = None) -> str:
        """Render a safe HTML fragment, never raising for a model expression failure."""

        return self.render_element(manifest, manifest.root, context)

    def render_element(
        self,
        manifest: ForgeManifest,
        element_id: str,
        context: RenderContext | None = None,
    ) -> str:
        """Render one validated manifest subtree for host-owned composition."""

        if not isinstance(manifest, ForgeManifest):
            raise TypeError("Renderer.render_element requires a validated ForgeManifest")
        if element_id not in manifest.elements:
            raise KeyError(f"manifest element {element_id!r} does not exist")
        render_context = context or RenderContext()
        try:
            return str(self._render_element(manifest, element_id, render_context, set()))
        except (KeyError, ValueError, ValidationError) as exc:
            return str(
                self._failure(element_id, "Renderer rejected this dashboard component.", exc)
            )

    def render_document(
        self,
        manifest: ForgeManifest,
        context: RenderContext | None = None,
        *,
        surface: SurfaceMode = SurfaceMode.DASHBOARD,
        persistence: PersistenceMode = PersistenceMode.STATEFUL,
        tailwind_cdn_url: str | None = None,
        tailwind_sri: str | None = None,
        htmx_cdn_url: str | None = None,
        htmx_sri: str | None = None,
        csrf_token: str | None = None,
        static_prefix: str = "/static",
        home_url: str = "/",
        action_url_template: str = "",
        state_url_template: str = "",
        state_version: int = 0,
        initial_state_json: str = "{}",
        element_id: str | None = None,
    ) -> str:
        """Render the trusted application shell around a manifest fragment."""

        return self.render_shell(
            title=manifest.metadata.title,
            description=manifest.metadata.description or "",
            profile=manifest.design.name,
            color_mode=manifest.design.color_mode,
            content=(
                self.render_element(manifest, element_id, context)
                if element_id is not None
                else self.render(manifest, context)
            ),
            surface=surface,
            persistence=persistence,
            tailwind_cdn_url=tailwind_cdn_url,
            tailwind_sri=tailwind_sri,
            htmx_cdn_url=htmx_cdn_url,
            htmx_sri=htmx_sri,
            csrf_token=csrf_token,
            static_prefix=static_prefix,
            home_url=home_url,
            action_url_template=action_url_template,
            state_url_template=state_url_template,
            state_version=state_version,
            initial_state_json=initial_state_json,
        )

    def render_shell(
        self,
        *,
        title: str,
        content: str,
        description: str = "",
        profile: str = "calm-neutral",
        color_mode: str = "system",
        surface: SurfaceMode = SurfaceMode.DASHBOARD,
        persistence: PersistenceMode = PersistenceMode.STATEFUL,
        tailwind_cdn_url: str | None = None,
        tailwind_sri: str | None = None,
        htmx_cdn_url: str | None = None,
        htmx_sri: str | None = None,
        csrf_token: str | None = None,
        static_prefix: str = "/static",
        home_url: str = "/",
        action_url_template: str = "",
        state_url_template: str = "",
        state_version: int = 0,
        initial_state_json: str = "{}",
    ) -> str:
        """Wrap trusted, server-composed content in the common application shell."""

        presentation = surface_presentation(surface)
        return self.environment.get_template("base.html").render(
            title=title,
            description=description,
            profile=profile,
            color_mode=color_mode,
            surface_mode=surface.value,
            persistence_mode=persistence.value,
            show_shell_header=presentation.show_shell_header,
            theme_icons={
                mode: render_heroicon(mode, class_name="forge-theme-icon")
                for mode in ("light", "system", "dark")
            },
            content=_trusted_markup(content),
            tailwind_cdn_url=tailwind_cdn_url,
            tailwind_sri=tailwind_sri,
            htmx_cdn_url=htmx_cdn_url,
            htmx_sri=htmx_sri,
            csrf_token=csrf_token,
            static_prefix=static_prefix.rstrip("/"),
            asset_version=_ASSET_VERSION,
            home_url=home_url,
            action_url_template=action_url_template,
            state_url_template=state_url_template,
            state_version=state_version,
            initial_state_json=initial_state_json,
        )

    def _render_element(
        self,
        manifest: ForgeManifest,
        element_id: str,
        context: RenderContext,
        trail: set[str],
    ) -> Markup:
        if element_id in trail or element_id not in manifest.elements:
            return self._failure(element_id, "A component reference could not be rendered.")
        element = manifest.elements[element_id]
        try:
            spec = component_registry.get(element.type)
        except ValueError:
            return self._failure(element_id, "This component is not in the approved catalog.")
        if element.visible is not None:
            try:
                if not bool(evaluate_expression(element.visible, context.namespaces())):
                    return _trusted_markup("")
            except EvaluationError as exc:
                return self._failure(element_id, "A visibility rule could not be evaluated.", exc)
        try:
            props = self._resolve_value(element.props, context)
        except EvaluationError as exc:
            return self._failure(element_id, "A component value could not be evaluated.", exc)
        if not isinstance(props, Mapping):
            return self._failure(element_id, "Component properties are malformed.")
        children = self._render_children(manifest, element_id, context, trail | {element_id})
        extra = self._component_extra(element.type, props, context)
        view = _ComponentView(
            element_id,
            element.type,
            props,
            element.action,
            (
                render_heroicon("chevron-right", class_name="forge-surface-action-icon")
                if element.action
                else None
            ),
        )
        try:
            # The registry supplies this path; no manifest value can select it.
            result = self.environment.get_template(spec.template).render(
                component=view,
                children=children,
                extra=extra,
            )
        except Exception as exc:  # Jinja errors remain an inert user-visible failure.
            return self._failure(element_id, "The approved component template failed safely.", exc)
        return _trusted_markup(result)

    def _render_children(
        self,
        manifest: ForgeManifest,
        element_id: str,
        context: RenderContext,
        trail: set[str],
    ) -> Markup:
        element = manifest.elements[element_id]
        if element.type == "repeat":
            return self._render_repeat(manifest, element_id, context, trail)
        return _trusted_markup(
            "".join(
                str(self._render_element(manifest, child, context, trail))
                for child in element.children
            )
        )

    def _render_repeat(
        self,
        manifest: ForgeManifest,
        element_id: str,
        context: RenderContext,
        trail: set[str],
    ) -> Markup:
        element = manifest.elements[element_id]
        if len(element.children) != 1:
            return self._failure(element_id, "A repeater requires one approved child template.")
        data = self._resolve_value(element.props.get("data"), context)
        if not isinstance(data, Sequence) or isinstance(data, str | bytes | bytearray):
            return self._failure(element_id, "The repeater data is unavailable.")
        rows = self._filter_rows(list(data[:MAX_RENDER_ROWS]), element.props, context)
        if not rows:
            message = element.props.get("empty_message")
            if message:
                try:
                    message = self._resolve_value(message, context)
                except EvaluationError:
                    message = "No items are available."
                return _trusted_markup(
                    f'<p class="forge-empty-inline" role="status">{escape(str(message))}</p>'
                )
            return _trusted_markup("")
        child = element.children[0]
        rendered: list[str] = []
        for row in rows:
            mapping = _as_mapping(_normalise_data(row))
            if not mapping:
                rendered.append(str(self._failure(element_id, "A repeater item is invalid.")))
                continue
            rendered.append(
                str(self._render_element(manifest, child, context.with_item(mapping), trail))
            )
        return _trusted_markup("".join(rendered))

    def _resolve_value(self, value: Any, context: RenderContext) -> Any:
        if isinstance(value, LiteralExpr | RefExpr | CallExpr | OpExpr):
            return evaluate_expression(value, context.namespaces())
        if isinstance(value, Mapping):
            if "kind" in value:
                try:
                    expression = ExpressionAdapter.validate_python(value, strict=True)
                except ValidationError:
                    return {
                        key: self._resolve_value(child, context) for key, child in value.items()
                    }
                return evaluate_expression(expression, context.namespaces())
            return {key: self._resolve_value(child, context) for key, child in value.items()}
        if isinstance(value, list):
            return [self._resolve_value(child, context) for child in value]
        return _normalise_data(value)

    def _component_extra(
        self, component_type: str, props: Mapping[str, Any], context: RenderContext
    ) -> Mapping[str, Any]:
        if component_type == "icon":
            return {"icon": self._icon(str(props.get("name", "activity")))}
        if component_type == "modal":
            return {"close_icon": render_heroicon("close", class_name="forge-button-icon")}
        if component_type in {"line-chart", "bar-chart", "donut-chart", "sparkline"}:
            return self._chart_extra(
                component_type,
                {
                    **props,
                    "data": self._filter_rows(
                        (
                            props["data"][:MAX_RENDER_ROWS]
                            if isinstance(props.get("data"), list)
                            else []
                        ),
                        props,
                        context,
                    ),
                },
            )
        if component_type == "metric":
            value, previous = props.get("value"), props.get("comparison")
            delta = None
            if (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
                and isinstance(previous, (int, float))
                and not isinstance(previous, bool)
                and math.isfinite(value)
                and math.isfinite(previous)
            ):
                difference = value - previous
                if math.isfinite(difference):
                    delta = ("+" if difference > 0 else "") + self._format_cell(
                        difference,
                        str(props.get("format", "number"))
                        if props.get("format") != "text"
                        else "number",
                    )
            return {
                "value": self._format_cell(value, str(props.get("format", "text"))),
                "delta": delta,
            }
        if component_type == "aggregate-metric":
            raw = props.get("data", [])
            rows = self._filter_rows(
                raw[:MAX_RENDER_ROWS] if isinstance(raw, list) else [], props, context
            )
            value = aggregate(rows, str(props["operation"]), props.get("value_key"))
            return {
                "value": "—" if value is None else self._format_cell(value, str(props["format"]))
            }
        if component_type == "mermaid":
            selected = context.state.get(str(props.get("filter_state", "")).removeprefix("state."))
            nodes = [
                node
                for node in props["nodes"]
                if selected in (None, "", "all") or node.get("group") == selected
            ]
            ids = {node["id"] for node in nodes}
            edges = [
                edge for edge in props["edges"] if edge["source"] in ids and edge["target"] in ids
            ]
            return {
                "nodes": nodes,
                "edges": edges,
                "svg": _trusted_markup(
                    diagram_svg(nodes, edges, str(props["direction"]), str(props["title"]))
                ),
                "selected": context.state.get(
                    str(props.get("state_path", "")).removeprefix("state."), ""
                ),
            }

        if component_type == "key-value":
            items = props.get("items", [])
            rows = items if isinstance(items, list) else []
            return {
                "rows": [
                    {
                        "label": row.get("label", ""),
                        "value": self._format_cell(
                            row.get("value"), str(row.get("format", "text"))
                        ),
                    }
                    for raw_row in rows
                    if (row := _as_mapping(raw_row))
                ]
            }
        if component_type == "progress":
            value = props.get("value", 0)
            maximum = props.get("maximum", 100)
            display = self._format_number(value)
            if isinstance(maximum, (int, float)) and not isinstance(maximum, bool) and maximum == 1:
                display = self._format_percent(value)
            return {"display_value": display}
        if component_type == "table":
            data = props.get("data", [])
            rows = data[:MAX_RENDER_ROWS] if isinstance(data, list) else []
            rows = self._filter_rows(rows, props, context)
            page = self._page(props, context, len(rows))
            page_size = int(props.get("page_size", 25))
            start = (page - 1) * page_size
            return {
                "rows": self._format_table_rows(
                    rows[start : start + page_size], props.get("columns", [])
                ),
                "page": page,
                "total_rows": len(rows),
            }
        if component_type in {"status-list", "timeline"}:
            data = props.get("data", [])
            rows = data[:MAX_RENDER_ROWS] if isinstance(data, list) else []
            rows = self._filter_rows(rows, props, context)
            if component_type == "timeline":
                timeline_rows: list[dict[str, Any]] = []
                for raw_row in rows:
                    row = _as_mapping(_normalise_data(raw_row))
                    timeline_rows.append(
                        {
                            **dict(row),
                            "display_time": self._format_cell(
                                row.get("opened", row.get("timestamp", "")), "datetime"
                            ),
                        }
                    )
                return {"rows": timeline_rows}
            return {"rows": [_normalise_data(row) for row in rows]}
        if component_type == "pagination":
            data = props.get("data", [])
            rows = data[:MAX_RENDER_ROWS] if isinstance(data, list) else []
            rows = self._filter_rows(rows, props, context)
            page = self._page(props, context, len(rows))
            page_size = int(props.get("page_size", 25))
            return {
                "state_value": page,
                "max_page": max(1, math.ceil(len(rows) / page_size)),
            }
        if component_type in {
            "text-input",
            "textarea",
            "number-input",
            "select",
            "checkbox",
            "toggle",
            "search",
            "radio-group",
            "date-range",
        }:
            state_path = str(props.get("state_path", props.get("page_state", "")))
            state_key = state_path.split(".", 1)[1] if "." in state_path else ""
            return {"state_value": context.state.get(state_key, "")}
        return _EMPTY

    @classmethod
    def _format_table_rows(cls, rows: list[Any], columns: object) -> list[dict[str, Any]]:
        column_items = columns if isinstance(columns, list) else []
        formatted: list[dict[str, Any]] = []
        for raw_row in rows:
            row = _as_mapping(_normalise_data(raw_row))
            output: dict[str, Any] = {}
            for raw_column in column_items:
                column = _as_mapping(raw_column)
                key = str(column.get("key", ""))
                output[key] = cls._format_cell(row.get(key), str(column.get("format", "text")))
            formatted.append(output)
        return formatted

    @classmethod
    def _format_cell(cls, value: object, display: str) -> Any:
        if display == "percent":
            return cls._format_percent(value)
        if display == "number":
            return cls._format_number(value)
        if display == "status" and isinstance(value, str):
            return value.replace("_", " ").replace("-", " ").title()
        if display == "datetime" and isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return value
            zone = parsed.tzname() or ""
            return f"{parsed:%d %b %Y, %H:%M}{f' {zone}' if zone else ''}"
        if display == "temperature":
            return f"{cls._format_number(value)} °C"
        if (
            display == "duration-ms"
            and isinstance(value, (int, float))
            and not isinstance(value, bool)
        ):
            if not math.isfinite(value):
                return str(value)
            if value >= 60_000:
                return f"{cls._format_number(value / 60_000)} min"
            if value >= 1_000:
                return f"{cls._format_number(value / 1_000)} s"
            return f"{cls._format_number(value)} ms"
        return value

    @staticmethod
    def _format_number(value: object) -> str:
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            return str(value)
        if float(value).is_integer():
            return f"{int(value):,}"
        return f"{value:,.2f}".rstrip("0").rstrip(".")

    @classmethod
    def _format_percent(cls, value: object) -> str:
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            return str(value)
        return f"{cls._format_number(value * 100)}%"

    @staticmethod
    def _filter_rows(
        rows: list[Any], props: Mapping[str, Any], context: RenderContext
    ) -> list[Any]:
        return filter_rows(rows, props, context.state)

    @staticmethod
    def _page(props: Mapping[str, Any], context: RenderContext, row_count: int) -> int:
        state_path = props.get("page_state")
        page_size = int(props.get("page_size", 25))
        if not isinstance(state_path, str):
            return 1
        state_key = state_path.split(".", 1)[1] if "." in state_path else ""
        raw_page = context.state.get(state_key, 1)
        page = raw_page if isinstance(raw_page, int) and not isinstance(raw_page, bool) else 1
        return max(1, min(page, max(1, math.ceil(row_count / page_size))))

    @staticmethod
    def _failure(element_id: str, message: str, error: Exception | None = None) -> Markup:
        if error is not None:
            logger.warning(
                "dashboard component failed safely",
                extra={"error_code": type(error).__name__, "element_id": element_id},
            )
        body = "<strong>Dashboard component unavailable.</strong> "
        body += f"{escape(message)}"
        return _trusted_markup(
            f'<section id="forge-element-{escape(element_id)}" class="forge-render-error" '
            f'role="alert">{body}</section>'
        )

    @staticmethod
    def _icon(name: str) -> Markup:
        return render_heroicon(name)

    def _chart_extra(self, component_type: str, props: Mapping[str, Any]) -> Mapping[str, Any]:
        raw = props.get("data", [])
        points = raw[:MAX_CHART_POINTS] if isinstance(raw, list) else []
        series = (
            props.get("series", [])
            if component_type != "sparkline"
            else [{"value": props.get("value"), "label": props.get("label")}]
        )
        cleaned = [series_item for series_item in series if isinstance(series_item, Mapping)][:6]
        values: list[list[float]] = []
        labels: list[str] = []
        for series_item in cleaned:
            key = str(series_item.get("value", ""))
            labels.append(str(series_item.get("label", key)))
            numeric: list[float] = []
            for point in points:
                point_map = _as_mapping(_normalise_data(point))
                raw_number = point_map.get(key, 0)
                try:
                    number = float(raw_number)
                except (TypeError, ValueError):
                    number = 0.0
                numeric.append(number if math.isfinite(number) else 0.0)
            values.append(numeric)
        value_format = str(props.get("value_format", "number"))
        maximum = max((abs(number) for line in values for number in line), default=1.0) or 1.0
        if value_format == "percent":
            maximum = max(maximum, 1.0)
        x_key = props.get("x_key")
        x_values = (
            [
                self._chart_x_value(_as_mapping(_normalise_data(point)).get(str(x_key), ""))
                for point in points
            ]
            if x_key
            else []
        )
        if component_type == "line-chart":
            chart_kind = "area" if props.get("kind") == "area" else "line"
        elif component_type == "bar-chart":
            chart_kind = "bar"
        elif component_type == "donut-chart":
            chart_kind = "donut"
        else:
            chart_kind = "line"
        x_axis_label = str(props.get("x_axis_label", "Observation"))
        y_axis_label = str(props.get("y_axis_label", "Value"))
        svg = self._chart_svg(
            chart_kind,
            values,
            labels,
            maximum,
            x_values,
            x_axis_label,
            y_axis_label,
            value_format,
        )
        formatter = self._format_percent if value_format == "percent" else self._format_number
        table_rows = [
            {
                "label": labels[index],
                "minimum": formatter(min(line, default=0)),
                "maximum": formatter(max(line, default=0)),
                "latest": formatter(line[-1] if line else 0),
            }
            for index, line in enumerate(values)
        ]
        return {"chart_svg": svg, "chart_rows": table_rows}

    @staticmethod
    def _chart_x_value(value: object) -> str:
        if isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                return parsed.strftime("%H:%M")
            except ValueError:
                return value if len(value) <= 16 else f"{value[:15]}…"
        return str(value)

    @staticmethod
    def _chart_svg(
        kind: str,
        values: list[list[float]],
        labels: list[str],
        maximum: float,
        x_values: list[str],
        x_axis_label: str,
        y_axis_label: str,
        value_format: str,
    ) -> Markup:
        width, height = 560, 210
        left, right, top, bottom = 70, 14, 14, 44
        plot_width = width - left - right
        plot_height = height - top - bottom
        minimum = min(0.0, min((number for line in values for number in line), default=0.0))
        span = maximum - minimum or 1.0
        zero_y = top + plot_height * maximum / span
        aria_label = escape(f"{y_axis_label} by {x_axis_label}; {len(values)} series")

        def point_label(series_index: int, point_index: int, value: float) -> str:
            observation = (
                x_values[point_index]
                if point_index < len(x_values) and x_values[point_index]
                else f"Observation {point_index + 1}"
            )
            formatted = (
                Renderer._format_percent(value)
                if value_format == "percent"
                else Renderer._format_number(value)
            )
            return f"{labels[series_index]} — {observation}: {formatted}"

        lines: list[str] = [
            (
                f'<svg class="forge-chart-svg" viewBox="0 0 {width} {height}" role="img" '
                f'aria-label="{aria_label}">'
            ),
        ]
        if kind != "donut":
            for fraction in (0.0, 0.5, 1.0):
                y = top + plot_height * (1 - fraction)
                raw_tick = minimum + span * fraction
                tick = f"{raw_tick * 100:.0f}%" if value_format == "percent" else f"{raw_tick:g}"
                lines.extend(
                    (
                        f'<line x1="{left}" y1="{y:.2f}" x2="{width - right}" '
                        f'y2="{y:.2f}" class="forge-chart-grid"/>',
                        f'<text x="{left - 8}" y="{y + 4:.2f}" text-anchor="end" '
                        f'class="forge-chart-label">{escape(tick)}</text>',
                    )
                )
            lines.append(
                f'<line x1="{left}" y1="{top + plot_height}" x2="{width - right}" '
                f'y2="{top + plot_height}" class="forge-chart-axis"/>'
            )
            point_count = max((len(line) for line in values), default=0)
            if point_count and x_values:
                tick_indexes = sorted({0, point_count // 2, point_count - 1})
                for index in tick_indexes:
                    if index >= len(x_values):
                        continue
                    x = (
                        left + plot_width * (index + 0.5) / point_count
                        if kind == "bar"
                        else left + plot_width * index / max(point_count - 1, 1)
                    )
                    anchor = (
                        "middle"
                        if kind == "bar"
                        else "start"
                        if index == 0
                        else "end"
                        if index == point_count - 1
                        else "middle"
                    )
                    lines.append(
                        f'<text x="{x:.2f}" y="{height - 23}" text-anchor="{anchor}" '
                        f'class="forge-chart-label">{escape(x_values[index])}</text>'
                    )
            lines.extend(
                (
                    f'<text x="{left + plot_width / 2:.2f}" y="{height - 5}" '
                    f'text-anchor="middle" class="forge-chart-axis-title">'
                    f"{escape(x_axis_label)}</text>",
                    f'<text x="12" y="{top + plot_height / 2:.2f}" text-anchor="middle" '
                    f'transform="rotate(-90 12 {top + plot_height / 2:.2f})" '
                    f'class="forge-chart-axis-title">{escape(y_axis_label)}</text>',
                )
            )
        for series_index, line in enumerate(values):
            if not line:
                continue
            series_class = f"forge-chart-series--{series_index % 6 + 1}"
            count = max(len(line) - 1, 1)
            coordinates = [
                (
                    left + plot_width * index / count,
                    top + plot_height * (maximum - value) / span,
                )
                for index, value in enumerate(line)
            ]
            if kind == "bar":
                bar_width = max(2.0, plot_width / max(len(line), 1) / max(len(values), 1) - 2)
                for index, (_, y) in enumerate(coordinates):
                    x = (
                        left
                        + plot_width * index / max(len(line), 1)
                        + series_index * (bar_width + 2)
                    )
                    bar_height = abs(zero_y - y)
                    y = min(y, zero_y)
                    label = escape(point_label(series_index, index, line[index]))
                    focus = (
                        f' tabindex="0" role="img" aria-label="{label}"'
                        if index == len(line) - 1
                        else ' aria-hidden="true"'
                    )
                    lines.append(
                        f'<rect class="forge-chart-series {series_class} forge-chart-fill" '
                        f'data-forge-chart-point data-forge-chart-series="{series_index + 1}" '
                        f'data-forge-chart-label="{label}"{focus} '
                        f'x="{x:.2f}" y="{y:.2f}" width="{bar_width:.2f}" '
                        f'height="{bar_height:.2f}"><title>{label}</title></rect>'
                    )
            elif kind == "donut":
                if any(value < 0 for value in line):
                    raise ValueError("donut charts require non-negative values")
                total = sum(line) or 1.0
                if not math.isfinite(total):
                    raise ValueError("donut total exceeds numeric range")
                circumference = 2 * math.pi * 58
                offset = 0.0
                for index, value in enumerate(line):
                    length = circumference * value / total
                    label = escape(point_label(series_index, index, value))
                    parts_class = f"forge-chart-series--{index % 6 + 1}"
                    lines.append(
                        f'<circle class="forge-chart-series {parts_class} forge-chart-line" '
                        f'role="img" tabindex="0" aria-label="{label}" '
                        f'cx="280" cy="90" r="58" fill="none" stroke-width="24" '
                        f'stroke-dasharray="{length:.2f} {circumference - length:.2f}" '
                        f'stroke-dashoffset="{-offset:.2f}" transform="rotate(-90 280 90)">'
                        f"<title>{label}</title></circle>"
                    )
                    offset += length
                break
            else:
                path = " ".join(
                    (f"M {x:.2f} {y:.2f}" if index == 0 else f"L {x:.2f} {y:.2f}")
                    for index, (x, y) in enumerate(coordinates)
                )
                if kind == "area" and len(coordinates) > 1:
                    first_x, _ = coordinates[0]
                    last_x, _ = coordinates[-1]
                    area = f"{path} L {last_x:.2f} {zero_y} L {first_x:.2f} {zero_y} Z"
                    lines.append(
                        f'<path class="forge-chart-series {series_class} forge-chart-area" '
                        f'd="{area}"/>'
                    )
                lines.append(
                    f'<path class="forge-chart-series {series_class} forge-chart-line" '
                    f'd="{path}" fill="none" stroke-width="2"/>'
                )
                for index, (x, y) in enumerate(coordinates):
                    label = escape(point_label(series_index, index, line[index]))
                    focus = (
                        f' tabindex="0" role="img" aria-label="{label}"'
                        if index == len(coordinates) - 1
                        else ' aria-hidden="true"'
                    )
                    lines.append(
                        f'<circle class="forge-chart-series {series_class} forge-chart-point" '
                        f'data-forge-chart-point data-forge-chart-series="{series_index + 1}" '
                        f'data-forge-chart-label="{label}"{focus} '
                        f'cx="{x:.2f}" cy="{y:.2f}" r="3.5">'
                        f"<title>{label}</title></circle>"
                    )
        lines.append("</svg>")
        return _trusted_markup("".join(lines))


def render_manifest(
    manifest: ForgeManifest,
    *,
    data: Mapping[str, Any] | Any | None = None,
    state: Mapping[str, Any] | None = None,
    renderer: Renderer | None = None,
    element_id: str | None = None,
) -> str:
    """Render a validated manifest, or one subtree, into an inert fragment."""

    data_value = _normalise_data(data) if data is not None else _EMPTY
    selected = renderer or Renderer()
    context = RenderContext(data=_as_mapping(data_value), state=state or _EMPTY)
    if element_id is not None:
        return selected.render_element(manifest, element_id, context)
    return selected.render(manifest, context)
