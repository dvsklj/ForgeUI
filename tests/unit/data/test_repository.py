from __future__ import annotations

import pytest
from sqlalchemy.exc import IntegrityError

from forgeui.data import Database, ForgeRepository
from forgeui.data.models import AppStateRecord


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
