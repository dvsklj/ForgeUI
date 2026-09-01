from __future__ import annotations

from hypothesis import given
from hypothesis import strategies as st

from forgeui.domain.models import MAX_ELEMENTS
from forgeui.validation import ManifestPolicy, manifest_json_schema, validate_manifest


def valid_manifest() -> dict[str, object]:
    return {
        "spec": "forgeui/1",
        "metadata": {"title": "Fleet health", "description": "Current device health."},
        "design": {"name": "ops-compact", "color_mode": "system"},
        "state": {"values": {"query": "", "page": 1}, "writable": ["state.query", "state.page"]},
        "root": "page",
        "elements": {
            "page": {"type": "page", "children": ["title", "search", "devices"]},
            "title": {"type": "heading", "props": {"text": "Fleet health", "level": 1}},
            "search": {"type": "search", "props": {"state_path": "state.query"}},
            "devices": {
                "type": "table",
                "props": {
                    "data": {"kind": "ref", "path": "data.devices"},
                    "columns": [
                        {"key": "name", "label": "Device"},
                        {"key": "status", "label": "Status"},
                    ],
                },
            },
        },
        "actions": {
            "clear-query": {
                "type": "set_state",
                "path": "state.query",
                "value": {"kind": "literal", "value": ""},
            }
        },
    }


def codes(candidate: dict[str, object]) -> set[str]:
    return {issue.code for issue in validate_manifest(candidate).issues}


def test_valid_dashboard_is_accepted_and_can_dry_render() -> None:
    received: list[str] = []
    report = validate_manifest(
        valid_manifest(), dry_render=lambda manifest: received.append(manifest.root)
    )
    assert report.valid
    assert received == ["page"]
    assert report.manifest is not None


def test_unknown_keys_and_unsafe_text_fail_at_schema_boundary() -> None:
    candidate = valid_manifest()
    candidate["unexpected"] = True
    assert "schema" in codes(candidate)
    candidate = valid_manifest()
    candidate["elements"]["title"]["props"]["text"] = "<script>alert(1)</script>"  # type: ignore[index]
    assert "schema" in codes(candidate)


def test_graph_missing_cycle_and_unreachable_are_rejected() -> None:
    missing = valid_manifest()
    missing["elements"]["page"]["children"].append("missing")  # type: ignore[index]
    assert "missing_child" in codes(missing)
    cycle = valid_manifest()
    cycle["elements"]["devices"]["children"] = ["page"]  # type: ignore[index]
    assert "graph_cycle" in codes(cycle)
    unreachable = valid_manifest()
    unreachable["elements"]["spare"] = {"type": "text", "props": {"text": "Spare"}}  # type: ignore[index]
    assert "unreachable_element" in codes(unreachable)


def test_profile_expression_and_action_restrictions() -> None:
    profile = valid_manifest()
    profile["design"] = {"name": "executive-summary"}
    assert "profile_incompatible" in codes(profile)
    action = valid_manifest()
    action["actions"]["clear-query"]["path"] = "state.other"  # type: ignore[index]
    assert "state_write_forbidden" in codes(action)
    binding = valid_manifest()
    binding["elements"]["search"]["props"]["state_path"] = "state.other"  # type: ignore[index]
    assert "state_binding_forbidden" in codes(binding)
    unknown_ref = valid_manifest()
    unknown_ref["elements"]["title"]["props"]["text"] = {"kind": "ref", "path": "data.secret"}  # type: ignore[index]
    assert "unknown_data_path" in codes(unknown_ref)

    unknown_column = valid_manifest()
    unknown_column["elements"]["devices"]["props"]["columns"][0]["key"] = "secret"  # type: ignore[index]
    assert "unknown_collection_field" in codes(unknown_column)


def test_custom_runtime_policy_controls_contract_source_fields_and_schema() -> None:
    policy = ManifestPolicy(
        contracts={"ai-search/1": frozenset({"data.results", "data.results.title", "item.title"})},
        sources={"ai-search.latest": "ai-search/1"},
        capabilities=frozenset({"search.export"}),
        destinations=frozenset({"search-result"}),
    )
    candidate = valid_manifest()
    candidate["data"] = {"contract": "ai-search/1", "source": "ai-search.latest"}
    candidate["elements"]["devices"]["props"]["data"]["path"] = "data.results"  # type: ignore[index]
    candidate["elements"]["devices"]["props"]["columns"] = [  # type: ignore[index]
        {"key": "title", "label": "Result"}
    ]
    assert validate_manifest(candidate, policy=policy).valid

    mismatch = valid_manifest()
    mismatch["data"] = {"contract": "ai-search/1", "source": "device-health"}
    report = validate_manifest(mismatch, policy=policy)
    assert {issue.code for issue in report.issues} >= {
        "unknown_data_source",
        "unknown_data_path",
    }

    schema = manifest_json_schema(policy)
    declaration = schema["$defs"]["DataContractDeclaration"]["properties"]
    assert declaration["contract"]["enum"] == ["ai-search/1"]
    assert declaration["source"]["enum"] == ["ai-search.latest"]
    assert schema["$defs"]["NavigateAction"]["properties"]["destination"]["enum"] == [
        "search-result"
    ]


def test_limits_and_dry_render_error_are_reported() -> None:
    candidate = valid_manifest()
    for number in range(MAX_ELEMENTS):
        candidate["elements"][f"extra-{number}"] = {"type": "text", "props": {"text": "extra"}}  # type: ignore[index]
    assert "schema" in codes(candidate)
    report = validate_manifest(
        valid_manifest(),
        dry_render=lambda _manifest: (_ for _ in ()).throw(RuntimeError("no template")),
    )
    assert not report.valid
    assert report.issues[0].code == "dry_render_failed"


def test_expression_complexity_limit_is_enforced() -> None:
    expression: dict[str, object] = {"kind": "literal", "value": True}
    for _ in range(8):
        expression = {"kind": "op", "op": "not", "args": [expression]}
    candidate = valid_manifest()
    candidate["elements"]["title"]["props"]["text"] = expression  # type: ignore[index]
    assert "expression_limit" in codes(candidate)


def test_bounded_state_actions_and_modal_targets_are_validated() -> None:
    candidate = valid_manifest()
    candidate["state"]["values"]["notes"] = []  # type: ignore[index]
    candidate["state"]["values"]["show_notes"] = False  # type: ignore[index]
    candidate["state"]["writable"].append("state.notes")  # type: ignore[index]
    candidate["state"]["writable"].append("state.show_notes")  # type: ignore[index]
    candidate["elements"]["page"]["children"].append("note-modal")  # type: ignore[index]
    candidate["elements"]["note-modal"] = {"type": "modal", "props": {"title": "Note"}}  # type: ignore[index]
    candidate["actions"].update(  # type: ignore[index]
        {
            "toggle-notes": {"type": "toggle_state", "path": "state.show_notes"},
            "increment-page": {
                "type": "increment_state",
                "path": "state.page",
                "amount": {"kind": "literal", "value": 1},
            },
            "append-note": {
                "type": "append_collection",
                "path": "state.notes",
                "value": {"kind": "ref", "path": "event.item"},
            },
            "show-modal": {"type": "open_modal", "target": "note-modal"},
            "go-devices": {"type": "navigate", "destination": "devices"},
            "acknowledge": {"type": "invoke_capability", "capability": "incident.acknowledge"},
        }
    )
    assert validate_manifest(candidate).valid


def test_only_registered_destinations_and_actionable_components_can_navigate() -> None:
    candidate = valid_manifest()
    candidate["actions"]["go-devices"] = {  # type: ignore[index]
        "type": "navigate",
        "destination": "devices",
    }
    candidate["elements"]["devices"]["action"] = "go-devices"  # type: ignore[index]
    assert validate_manifest(candidate).valid

    unknown = valid_manifest()
    unknown["actions"]["go-secret"] = {  # type: ignore[index]
        "type": "navigate",
        "destination": "secret",
    }
    assert "unknown_destination" in codes(unknown)

    unsupported = valid_manifest()
    unsupported["elements"]["title"]["action"] = "clear-query"  # type: ignore[index]
    assert "action_not_supported" in codes(unsupported)

    non_navigation = valid_manifest()
    non_navigation["elements"]["devices"]["action"] = "clear-query"  # type: ignore[index]
    assert "surface_action_requires_navigation" in codes(non_navigation)


def test_breadcrumb_destinations_use_the_same_host_allowlist() -> None:
    candidate = valid_manifest()
    candidate["elements"]["page"]["children"].append("breadcrumbs")  # type: ignore[index]
    candidate["elements"]["breadcrumbs"] = {  # type: ignore[index]
        "type": "breadcrumbs",
        "props": {"items": [{"label": "Fleet", "destination": "devices"}]},
    }
    assert validate_manifest(candidate).valid

    candidate["elements"]["breadcrumbs"]["props"]["items"][0]["destination"] = "secret"  # type: ignore[index]
    assert "unknown_destination" in codes(candidate)


def test_removed_compatibility_names_are_rejected() -> None:
    for component_type in ("chart", "dialog"):
        candidate = valid_manifest()
        candidate["elements"]["page"]["children"].append("old-name")  # type: ignore[index]
        candidate["elements"]["old-name"] = {  # type: ignore[index]
            "type": component_type,
            "props": {},
        }
        assert "schema" in codes(candidate)

    for action_type in ("refresh_data", "open_dialog", "close_dialog"):
        candidate = valid_manifest()
        candidate["actions"]["old-name"] = {  # type: ignore[index]
            "type": action_type,
            "source": "device-health",
            "target": "page",
        }
        assert "schema" in codes(candidate)


def test_collection_actions_reject_non_collection_state() -> None:
    candidate = valid_manifest()
    candidate["actions"]["append"] = {  # type: ignore[index]
        "type": "append_collection",
        "path": "state.query",
        "value": {"kind": "literal", "value": "item"},
    }
    assert "collection_action_requires_list" in codes(candidate)


def test_repeat_requires_exactly_one_template_child() -> None:
    candidate = valid_manifest()
    candidate["elements"]["page"]["children"].append("repeater")  # type: ignore[index]
    candidate["elements"]["repeater"] = {  # type: ignore[index]
        "type": "repeat",
        "props": {"data": {"kind": "ref", "path": "data.devices"}},
        "children": [],
    }
    assert "repeat_child_count" in codes(candidate)


@given(st.text(alphabet=st.characters(blacklist_categories=("Cs",)), min_size=1, max_size=40))
def test_plain_text_is_data_not_an_expression(value: str) -> None:
    candidate = valid_manifest()
    candidate["elements"]["title"]["props"]["text"] = value  # type: ignore[index]
    report = validate_manifest(candidate)
    # Strings are never evaluated as code; unsafe markup is rejected at the manifest boundary.
    assert all(issue.code != "unknown_data_path" for issue in report.issues)
