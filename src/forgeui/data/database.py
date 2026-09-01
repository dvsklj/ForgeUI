"""Explicit, synchronous SQLAlchemy database construction.

The application owns a :class:`Database` instance and passes it to services.  This
deliberately avoids a module-level engine/session singleton, which is important for
tests and for applications that mount ForgeUI more than once.
"""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Protocol, cast

from sqlalchemy import Engine, create_engine, event, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from forgeui.data.models import Base


class Database:
    """A small owner for an engine and a configured synchronous session factory."""

    def __init__(self, url: str, *, echo: bool = False) -> None:
        parsed = make_url(url)
        connect_args: dict[str, object] = {}
        engine_options: dict[str, object] = {"echo": echo, "future": True}
        if parsed.drivername.startswith("sqlite"):
            if parsed.database and parsed.database != ":memory:":
                Path(parsed.database).expanduser().resolve().parent.mkdir(
                    parents=True, exist_ok=True
                )
            connect_args["check_same_thread"] = False
            # Each connection to :memory: has a separate database. StaticPool makes
            # a test database consistent across the sessions a service creates.
            if parsed.database in {None, "", ":memory:"}:
                engine_options["poolclass"] = StaticPool
        self.engine: Engine = create_engine(url, connect_args=connect_args, **engine_options)
        if parsed.drivername.startswith("sqlite"):
            self._configure_sqlite(parsed.database)
        self.session_factory: sessionmaker[Session] = sessionmaker(
            bind=self.engine, autoflush=False, expire_on_commit=False
        )

    def _configure_sqlite(self, database_name: str | None) -> None:
        is_file_database = bool(database_name and database_name not in {":memory:"})

        @event.listens_for(self.engine, "connect")
        def configure_connection(dbapi_connection: object, _connection_record: object) -> None:
            cursor = cast(_DbapiConnection, dbapi_connection).cursor()
            try:
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA busy_timeout=5000")
                if is_file_database:
                    cursor.execute("PRAGMA journal_mode=WAL")
            finally:
                cursor.close()

    def create_schema(self) -> None:
        """Create the greenfield release schema. Existing records are untouched."""

        Base.metadata.create_all(self.engine)

    def ping(self) -> None:
        """Force a minimal database round trip for readiness checks."""

        with self.session() as session:
            session.execute(text("SELECT 1"))

    def dispose(self) -> None:
        self.engine.dispose()

    @contextmanager
    def session(self) -> Iterator[Session]:
        """Yield a transactional session, rolling back every failed operation."""

        session = self.session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def sqlite_file(cls, path: Path) -> Database:
        """Construct a SQLite database without interpolating a user-provided URL."""

        return cls(f"sqlite:///{path.resolve()}")


class _Cursor(Protocol):
    def execute(self, statement: str) -> object: ...

    def close(self) -> None: ...


class _DbapiConnection(Protocol):
    def cursor(self) -> _Cursor: ...
