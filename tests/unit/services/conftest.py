from __future__ import annotations

import pytest

from forgeui.data import Database, ForgeRepository
from forgeui.services import AppService, DeviceHealthService, StateService


def manifest() -> dict[str, object]:
    return {
        "spec": "forgeui/1",
        "metadata": {"title": "Fleet health"},
        "design": {"name": "ops-compact"},
        "state": {
            "values": {"query": "", "page": 1, "show": False, "notes": []},
            "writable": ["state.query", "state.page", "state.show", "state.notes"],
        },
        "root": "page",
        "elements": {
            "page": {"type": "page", "children": ["title"]},
            "title": {"type": "heading", "props": {"text": "Fleet health", "level": 1}},
        },
        "actions": {
            "set-query": {
                "type": "set_state",
                "path": "state.query",
                "value": {"kind": "ref", "path": "event.value"},
            },
            "toggle": {"type": "toggle_state", "path": "state.show"},
            "increment": {
                "type": "increment_state",
                "path": "state.page",
                "amount": {"kind": "literal", "value": 1},
            },
            "add-note": {
                "type": "append_collection",
                "path": "state.notes",
                "value": {"kind": "ref", "path": "event.value"},
            },
            "nav": {"type": "navigate", "destination": "devices"},
            "deny": {"type": "invoke_capability", "capability": "incident.acknowledge"},
        },
    }


@pytest.fixture
def repository() -> ForgeRepository:
    database = Database("sqlite+pysqlite:///:memory:")
    database.create_schema()
    return ForgeRepository(database)


@pytest.fixture
def apps(repository: ForgeRepository) -> AppService:
    return AppService(repository)


@pytest.fixture
def state(repository: ForgeRepository, apps: AppService) -> StateService:
    return StateService(repository, apps)


@pytest.fixture
def devices(repository: ForgeRepository) -> DeviceHealthService:
    return DeviceHealthService(repository)
