from __future__ import annotations

import pytest
from sqlalchemy.exc import IntegrityError

from forgeui.data import Database, ForgeRepository
from forgeui.data.models import AppStateRecord, CollectionRowRecord, DeviceSnapshotRecord


@pytest.fixture
def repository() -> ForgeRepository:
    database = Database("sqlite+pysqlite:///:memory:")
    database.create_schema()
    return ForgeRepository(database)


def test_transaction_rolls_back_on_error(repository: ForgeRepository) -> None:
    def fail_transaction() -> None:
        with repository.transaction() as session:
            repository.create_app_in_session(session, "Will roll back", "private")
            raise RuntimeError("stop")

    with pytest.raises(RuntimeError):
        fail_transaction()
    assert repository.list_apps() == []


def test_repository_instances_do_not_share_memory_database() -> None:
    first_database = Database("sqlite+pysqlite:///:memory:")
    second_database = Database("sqlite+pysqlite:///:memory:")
    first_database.create_schema()
    second_database.create_schema()
    first = ForgeRepository(first_database)
    second = ForgeRepository(second_database)
    first.create_app("Only first")
    assert len(first.list_apps()) == 1
    assert second.list_apps() == []


def test_delete_cascades_app_owned_rows(repository: ForgeRepository) -> None:
    app = repository.create_app("Disposable")
    with repository.transaction() as session:
        repository.put_state_in_session(
            session,
            app_id=app.id,
            scope="global",
            scope_key="global",
            value={"page": 1},
            expected_version=0,
        )
    assert repository.delete_app(app.id)
    assert repository.get_app(app.id) is None
    assert repository.get_state(app.id, "global", "global") is None


def test_delete_removes_app_snapshots_without_reclassifying_them_as_global(
    repository: ForgeRepository,
) -> None:
    app = repository.create_app("Private snapshot", visibility="private")
    with repository.transaction() as session:
        global_snapshot = repository.add_snapshot_in_session(
            session,
            app_id=None,
            payload={"scope": "global"},
            generated_at="2026-01-01T00:00:00Z",
            rows=[],
        )
        private_snapshot = repository.add_snapshot_in_session(
            session,
            app_id=app.id,
            payload={"scope": "private"},
            generated_at="2026-01-02T00:00:00Z",
            rows=[("devices", "private-device", 0, {"name": "Private device"})],
        )

    assert repository.delete_app(app.id)
    latest_global = repository.latest_snapshot(None)
    assert latest_global is not None
    assert latest_global.id == global_snapshot.id
    with repository.transaction() as session:
        assert session.get(DeviceSnapshotRecord, private_snapshot.id) is None
        assert (
            session.query(CollectionRowRecord)
            .filter(CollectionRowRecord.snapshot_id == private_snapshot.id)
            .count()
            == 0
        )


def test_sqlite_foreign_keys_are_enabled(repository: ForgeRepository) -> None:
    def add_orphan() -> None:
        with repository.transaction() as session:
            session.add(
                AppStateRecord(
                    id="orphan",
                    app_id="missing",
                    scope="global",
                    scope_key="global",
                    value_json="{}",
                )
            )

    with pytest.raises(IntegrityError):
        add_orphan()
