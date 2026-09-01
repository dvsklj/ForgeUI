"""Contract tests for the pinned A2UI v0.9.1 snapshot importer.

The small fixture follows the official v0.9.1 create/update/data structure but
uses original device-health content rather than copying an official sample.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import pytest

from forgeui.a2ui import (
    A2UI_BASIC_CATALOG_ID,
    A2UI_MIME_TYPE,
    A2UI_SERVER_SCHEMA_URL,
    A2UI_SPEC_COMMIT,
    A2UI_VERSION,
    A2UIAdapterError,
    A2UIManifestValidationError,
    InvalidA2UIMessageError,
    UnsupportedA2UIFeatureError,
    UnsupportedA2UIVersionError,
    adapt_a2ui_jsonl,
    adapt_a2ui_messages,
)
from forgeui.a2ui.models import MAX_A2UI_BYTES, MAX_A2UI_MESSAGES
from forgeui.validation import validate_manifest

FIXTURE = Path(__file__).parent / "fixtures" / "device_health_dashboard_v0_9_1.jsonl"


def fixture_messages() -> list[dict[str, Any]]:
    return [json.loads(line) for line in FIXTURE.read_text(encoding="utf-8").splitlines()]


def test_official_version_and_schema_commit_are_explicitly_pinned() -> None:
    assert A2UI_VERSION == "v0.9.1"
    assert A2UI_SPEC_COMMIT == "d4723f29254520e1214d5004cb555d83eaafb828"
    assert A2UI_MIME_TYPE == "application/a2ui+json"
    assert A2UI_SERVER_SCHEMA_URL == ("https://a2ui.org/specification/v0_9_1/server_to_client.json")
    assert A2UI_BASIC_CATALOG_ID == (
        "https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json"
    )


def test_officially_shaped_snapshot_translates_and_revalidates() -> None:
    result = adapt_a2ui_jsonl(FIXTURE.read_bytes())

    assert result.surface_id == "fleet-health"
    assert result.data_model is not None
    assert result.data_model.summary.healthy == 38
    assert result.manifest.spec == "forgeui/1"
    assert result.manifest.design.name == "ops-compact"
    assert result.manifest.state.values == {}
    assert result.manifest.actions == {}
    assert result.manifest.elements["root"].type == "stack"
    assert result.manifest.elements["summary-row"].type == "inline"
    assert result.manifest.elements["healthy-card"].type == "card"
    assert result.manifest.elements["title"].props == {
        "text": "Fleet health",
        "level": 1,
    }
    assert result.manifest.elements["healthy-value"].props["text"] == {
        "kind": "ref",
        "path": "data.summary.healthy",
    }
    assert validate_manifest(result.manifest).valid


@pytest.mark.parametrize("version", ["v0.8", "v0.9", "v0.10", "v1.0", 9, None])
def test_every_unpinned_version_is_rejected(version: object) -> None:
    messages = fixture_messages()
    messages[0]["version"] = version

    with pytest.raises(UnsupportedA2UIVersionError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "unsupported_version"


def test_missing_version_is_not_treated_as_an_older_protocol() -> None:
    messages = fixture_messages()
    del messages[0]["version"]

    with pytest.raises(InvalidA2UIMessageError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "missing_version"


@pytest.mark.parametrize(
    ("mutation", "expected_code"),
    [
        ({"catalogId": "https://example.invalid/catalog.json"}, "active_content"),
        (
            {
                "catalogId": A2UI_BASIC_CATALOG_ID,
                "theme": {"primaryColor": "#ff0000"},
            },
            "invalid_create_surface",
        ),
        (
            {"catalogId": A2UI_BASIC_CATALOG_ID, "sendDataModel": True},
            "invalid_create_surface",
        ),
    ],
)
def test_custom_catalogs_themes_and_data_model_echo_are_rejected(
    mutation: dict[str, object],
    expected_code: str,
) -> None:
    messages = fixture_messages()
    create = messages[0]["createSurface"]
    assert isinstance(create, dict)
    create.update(mutation)

    with pytest.raises(A2UIAdapterError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == expected_code


@pytest.mark.parametrize("component_name", ["Button", "Image", "List", "Metric", "raw-html"])
def test_unknown_or_unmapped_components_are_rejected(component_name: str) -> None:
    messages = fixture_messages()
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    components = update["components"]
    assert isinstance(components, list)
    components[1] = {"id": "title", "component": component_name}

    with pytest.raises(UnsupportedA2UIFeatureError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "unsupported_component"


def test_unknown_properties_and_actions_are_rejected() -> None:
    messages = fixture_messages()
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    components = update["components"]
    assert isinstance(components, list)
    title = components[1]
    assert isinstance(title, dict)
    title["action"] = {"event": {"name": "run"}}

    with pytest.raises(InvalidA2UIMessageError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "invalid_component"


@pytest.mark.parametrize(
    "unsafe_text",
    [
        "<img src=x onerror=alert(1)>",
        "https://example.invalid/telemetry",
        "body { color: red; }",
        "javascript:alert(1)",
        "mailto:operator@example.invalid",
        "/admin/devices",
        "[status](//example.invalid)",
        "data:text/html,unsafe",
    ],
)
def test_urls_html_css_scripts_and_markup_are_rejected(unsafe_text: str) -> None:
    messages = fixture_messages()
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    components = update["components"]
    assert isinstance(components, list)
    title = components[1]
    assert isinstance(title, dict)
    title["text"] = unsafe_text

    with pytest.raises(InvalidA2UIMessageError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "active_content"


def test_active_content_is_also_rejected_in_device_data() -> None:
    messages = fixture_messages()
    update = messages[2]["updateDataModel"]
    assert isinstance(update, dict)
    value = update["value"]
    assert isinstance(value, dict)
    value["incidents"] = [
        {
            "id": "incident-1",
            "device_id": "device-1",
            "severity": "critical",
            "message": "<script>alert(1)</script>",
            "opened": "2026-07-24T10:00:00Z",
            "status": "open",
        }
    ]

    with pytest.raises(InvalidA2UIMessageError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "active_content"


def test_duplicate_ids_are_rejected_across_update_batches() -> None:
    messages = fixture_messages()
    messages.insert(
        2,
        {
            "version": A2UI_VERSION,
            "updateComponents": {
                "surfaceId": "fleet-health",
                "components": [{"id": "title", "component": "Text", "text": "Replacement"}],
            },
        },
    )

    with pytest.raises(InvalidA2UIMessageError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "duplicate_component"


@pytest.mark.parametrize(
    ("components", "expected_code"),
    [
        (
            [{"id": "not-root", "component": "Text", "text": "No root"}],
            "missing_root",
        ),
        (
            [
                {"id": "root", "component": "Column", "children": ["missing"]},
            ],
            "manifest_validation_failed",
        ),
        (
            [
                {"id": "root", "component": "Column", "children": ["child"]},
                {"id": "child", "component": "Column", "children": ["root"]},
            ],
            "manifest_validation_failed",
        ),
        (
            [
                {"id": "root", "component": "Text", "text": "Visible"},
                {"id": "orphan", "component": "Text", "text": "Unreachable"},
            ],
            "manifest_validation_failed",
        ),
    ],
)
def test_bad_roots_missing_children_cycles_and_orphans_are_rejected(
    components: list[dict[str, object]],
    expected_code: str,
) -> None:
    messages = fixture_messages()[:2]
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    update["components"] = components

    with pytest.raises(A2UIAdapterError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == expected_code


def test_graph_depth_is_bounded_by_forgeui_validation() -> None:
    components: list[dict[str, object]] = []
    for index in range(13):
        component_id = "root" if index == 0 else f"level-{index}"
        child_id = f"level-{index + 1}"
        components.append({"id": component_id, "component": "Column", "children": [child_id]})
    components.append({"id": "level-13", "component": "Text", "text": "Too deep"})
    messages = fixture_messages()[:2]
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    update["components"] = components

    with pytest.raises(A2UIManifestValidationError) as error:
        adapt_a2ui_messages(messages)

    assert "graph_depth" in {issue.code for issue in error.value.issues}


def test_only_fixed_device_health_bindings_are_supported() -> None:
    messages = fixture_messages()
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    components = update["components"]
    assert isinstance(components, list)
    value = components[4]
    assert isinstance(value, dict)
    value["text"] = {"path": "/secrets/token"}

    with pytest.raises(UnsupportedA2UIFeatureError) as error:
        adapt_a2ui_messages(messages)

    assert error.value.code == "unsupported_data_binding"


def test_data_updates_must_be_one_complete_root_device_snapshot() -> None:
    partial = fixture_messages()
    partial_update = partial[2]["updateDataModel"]
    assert isinstance(partial_update, dict)
    partial_update["path"] = "/summary/healthy"
    partial_update["value"] = 39

    with pytest.raises(InvalidA2UIMessageError) as partial_error:
        adapt_a2ui_messages(partial)
    assert partial_error.value.code == "invalid_update_data_model"

    invalid = fixture_messages()
    invalid_update = invalid[2]["updateDataModel"]
    assert isinstance(invalid_update, dict)
    invalid_value = invalid_update["value"]
    assert isinstance(invalid_value, dict)
    del invalid_value["summary"]

    with pytest.raises(InvalidA2UIMessageError) as invalid_error:
        adapt_a2ui_messages(invalid)
    assert invalid_error.value.code == "invalid_device_health_data"

    repeated = fixture_messages()
    repeated.append(copy.deepcopy(repeated[2]))
    with pytest.raises(UnsupportedA2UIFeatureError) as repeated_error:
        adapt_a2ui_messages(repeated)
    assert repeated_error.value.code == "unsupported_data_update"


def test_surface_order_and_identity_are_strict() -> None:
    messages = fixture_messages()
    messages[0], messages[1] = messages[1], messages[0]
    with pytest.raises(InvalidA2UIMessageError) as order_error:
        adapt_a2ui_messages(messages)
    assert order_error.value.code == "surface_order"

    messages = fixture_messages()
    update = messages[1]["updateComponents"]
    assert isinstance(update, dict)
    update["surfaceId"] = "another-surface"
    with pytest.raises(InvalidA2UIMessageError) as identity_error:
        adapt_a2ui_messages(messages)
    assert identity_error.value.code == "surface_mismatch"


def test_delete_and_unknown_envelopes_are_not_imported() -> None:
    for operation in ("deleteSurface", "beginRendering", "surfaceUpdate"):
        messages = fixture_messages()[:1]
        messages.append({"version": A2UI_VERSION, operation: {"surfaceId": "fleet-health"}})
        with pytest.raises(UnsupportedA2UIFeatureError) as error:
            adapt_a2ui_messages(messages)
        assert error.value.code == "unsupported_message"


def test_message_element_and_byte_budgets_are_enforced() -> None:
    create = fixture_messages()[0]
    too_many_messages = [create] + [
        {
            "version": A2UI_VERSION,
            "updateComponents": {
                "surfaceId": "fleet-health",
                "components": [
                    {
                        "id": f"item-{index}",
                        "component": "Text",
                        "text": "Item",
                    }
                ],
            },
        }
        for index in range(MAX_A2UI_MESSAGES)
    ]
    with pytest.raises(InvalidA2UIMessageError) as message_error:
        adapt_a2ui_messages(too_many_messages)
    assert message_error.value.code == "message_limit"

    consumed: list[int] = []

    def untrusted_stream() -> Any:
        for index in range(MAX_A2UI_MESSAGES + 10):
            consumed.append(index)
            yield create

    with pytest.raises(InvalidA2UIMessageError):
        adapt_a2ui_messages(untrusted_stream())
    assert len(consumed) == MAX_A2UI_MESSAGES + 1

    too_many_elements = fixture_messages()[:2]
    update = too_many_elements[1]["updateComponents"]
    assert isinstance(update, dict)
    update["components"] = [
        {"id": "root", "component": "Column", "children": []},
        *[{"id": f"item-{index}", "component": "Text", "text": "Item"} for index in range(80)],
    ]
    with pytest.raises(InvalidA2UIMessageError) as element_error:
        adapt_a2ui_messages(too_many_elements)
    assert element_error.value.code == "invalid_update_components"

    oversized = (
        f'{{"version":"{A2UI_VERSION}","createSurface":{{"surfaceId":"fleet-health",'
        f'"catalogId":"{A2UI_BASIC_CATALOG_ID}","padding":"' + ("x" * MAX_A2UI_BYTES) + '"}}'
    )
    with pytest.raises(InvalidA2UIMessageError) as byte_error:
        adapt_a2ui_jsonl(oversized)
    assert byte_error.value.code == "byte_limit"


def test_jsonl_rejects_duplicate_keys_blank_records_and_non_objects() -> None:
    duplicate = (
        f'{{"version":"{A2UI_VERSION}","version":"{A2UI_VERSION}",'
        '"createSurface":{"surfaceId":"fleet-health",'
        f'"catalogId":"{A2UI_BASIC_CATALOG_ID}"'
        "}}"
    )
    with pytest.raises(InvalidA2UIMessageError) as duplicate_error:
        adapt_a2ui_jsonl(duplicate)
    assert duplicate_error.value.code == "duplicate_json_key"

    with pytest.raises(InvalidA2UIMessageError, match="blank"):
        adapt_a2ui_jsonl(FIXTURE.read_text(encoding="utf-8") + "\n\n")

    with pytest.raises(InvalidA2UIMessageError) as object_error:
        adapt_a2ui_jsonl("[]")
    assert object_error.value.code == "invalid_message"
