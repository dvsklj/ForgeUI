"""Transactional repository operations with canonical JSON serialization."""

from __future__ import annotations

import hashlib
import json
import uuid
from collections.abc import Callable, Iterator, Mapping, Sequence
from contextlib import contextmanager
from datetime import UTC, datetime
from typing import Any, TypeVar, cast

from sqlalchemy import Select, and_, delete, desc, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from forgeui.data.database import Database
from forgeui.data.models import (
    AppRecord,
    AppStateRecord,
    AuditEventRecord,
    CollectionRowRecord,
    DeviceSnapshotRecord,
    GenerationJobRecord,
    ManifestRevisionRecord,
    utc_now,
)

JsonValue = str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
T = TypeVar("T")


def new_id() -> str:
    """Return an unguessable UUID identifier suitable for server-owned records."""

    return uuid.uuid4().hex


def canonical_json(value: JsonValue) -> str:
    """Serialize JSON deterministically for stored content and checksums."""

    return json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
    )


def parse_json(value: str) -> JsonValue:
    parsed: object = json.loads(value)
    if not isinstance(parsed, str | int | float | bool | list | dict) and parsed is not None:
        raise ValueError("stored value is not JSON")
    return cast(JsonValue, parsed)


def content_hash(value: JsonValue) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo is not None else value.replace(tzinfo=UTC)


class ForgeRepository:
    """Persistence operations; all methods open an explicit short transaction.

    Services may use :meth:`transaction` and the ``*_in_session`` helpers to make
    related mutations atomic. Repository methods never interpolate values into SQL.
    """

    def __init__(self, database: Database) -> None:
        self.database = database

    @contextmanager
    def transaction(self) -> Iterator[Session]:
        with self.database.session() as session:
            yield session

    def _one_or_none(self, session: Session, statement: Select[tuple[T]]) -> T | None:
        return session.execute(statement).scalar_one_or_none()

    # Apps -----------------------------------------------------------------
    def create_app(self, title: str, visibility: str = "private") -> AppRecord:
        with self.transaction() as session:
            return self.create_app_in_session(session, title, visibility)

    def create_app_in_session(self, session: Session, title: str, visibility: str) -> AppRecord:
        record = AppRecord(id=new_id(), title=title, visibility=visibility)
        session.add(record)
        session.flush()
        return record

    def get_app(self, app_id: str) -> AppRecord | None:
        with self.transaction() as session:
            return self.get_app_in_session(session, app_id)

    def get_app_in_session(self, session: Session, app_id: str) -> AppRecord | None:
        return session.get(AppRecord, app_id)

    def list_apps(self, *, visibility: str | None = None, limit: int = 100) -> list[AppRecord]:
        bounded = max(1, min(limit, 100))
        with self.transaction() as session:
            query = select(AppRecord).order_by(desc(AppRecord.updated_at)).limit(bounded)
            if visibility is not None:
                query = query.where(AppRecord.visibility == visibility)
            return list(session.scalars(query))

    def update_app(
        self, app_id: str, *, title: str | None = None, visibility: str | None = None
    ) -> AppRecord | None:
        with self.transaction() as session:
            record = self.get_app_in_session(session, app_id)
            if record is None:
                return None
            if title is not None:
                record.title = title
            if visibility is not None:
                record.visibility = visibility
            record.updated_at = utc_now()
            session.flush()
            return record

    def delete_app(self, app_id: str) -> bool:
        with self.transaction() as session:
            # Delete snapshots explicitly as well as declaring the database cascade.
            # This keeps databases created with the earlier SET NULL constraint from
            # reclassifying app-private snapshots as global snapshots.
            session.execute(
                delete(DeviceSnapshotRecord).where(DeviceSnapshotRecord.app_id == app_id)
            )
            result = session.execute(delete(AppRecord).where(AppRecord.id == app_id))
            return bool(cast(Any, result).rowcount)

    # Immutable manifest revisions ----------------------------------------
    def get_revision(self, revision_id: str) -> ManifestRevisionRecord | None:
        with self.transaction() as session:
            return session.get(ManifestRevisionRecord, revision_id)

    def list_revisions(self, app_id: str, *, limit: int = 100) -> list[ManifestRevisionRecord]:
        with self.transaction() as session:
            query = (
                select(ManifestRevisionRecord)
                .where(ManifestRevisionRecord.app_id == app_id)
                .order_by(desc(ManifestRevisionRecord.revision_number))
                .limit(max(1, min(limit, 100)))
            )
            return list(session.scalars(query))

    def create_revision_in_session(
        self,
        session: Session,
        *,
        app: AppRecord,
        manifest: Mapping[str, JsonValue],
        parent_revision_id: str | None,
        created_by: str | None,
    ) -> ManifestRevisionRecord | None:
        # Revision objects are append-only. The only mutation is the app pointer.
        next_number = (
            session.scalar(
                select(ManifestRevisionRecord.revision_number)
                .where(ManifestRevisionRecord.app_id == app.id)
                .order_by(desc(ManifestRevisionRecord.revision_number))
                .limit(1)
            )
            or 0
        ) + 1
        manifest_object = dict(manifest)
        record = ManifestRevisionRecord(
            id=new_id(),
            app_id=app.id,
            revision_number=next_number,
            parent_revision_id=parent_revision_id,
            manifest_json=canonical_json(manifest_object),
            content_hash=content_hash(manifest_object),
            created_by=created_by,
        )
        session.add(record)
        session.flush()
        # The conditional pointer write is the revision precondition. It protects
        # against a stale service instance even when SQLite cannot provide row
        # locks. If it loses the race, the caller raises and this whole transaction
        # rolls back, including the newly inserted immutable row.
        result = session.execute(
            update(AppRecord)
            .where(AppRecord.id == app.id, AppRecord.current_revision_id == parent_revision_id)
            .values(
                current_revision_id=record.id,
                last_known_good_revision_id=record.id,
                updated_at=utc_now(),
            )
        )
        if cast(Any, result).rowcount != 1:
            return None
        session.flush()
        return record

    # State ---------------------------------------------------------------
    def get_state(self, app_id: str, scope: str, scope_key: str) -> AppStateRecord | None:
        with self.transaction() as session:
            return self.get_state_in_session(session, app_id, scope, scope_key)

    def get_state_in_session(
        self, session: Session, app_id: str, scope: str, scope_key: str
    ) -> AppStateRecord | None:
        return self._one_or_none(
            session,
            select(AppStateRecord).where(
                and_(
                    AppStateRecord.app_id == app_id,
                    AppStateRecord.scope == scope,
                    AppStateRecord.scope_key == scope_key,
                )
            ),
        )

    def put_state_in_session(
        self,
        session: Session,
        *,
        app_id: str,
        scope: str,
        scope_key: str,
        value: Mapping[str, JsonValue],
        expected_version: int | None,
    ) -> AppStateRecord | None:
        existing = self.get_state_in_session(session, app_id, scope, scope_key)
        encoded = canonical_json(dict(value))
        if existing is None:
            if expected_version not in {None, 0}:
                return None
            record = AppStateRecord(
                id=new_id(), app_id=app_id, scope=scope, scope_key=scope_key, value_json=encoded
            )
            session.add(record)
            session.flush()
            return record
        if expected_version is not None and existing.version != expected_version:
            return None
        expected = existing.version
        result = session.execute(
            update(AppStateRecord)
            .where(AppStateRecord.id == existing.id, AppStateRecord.version == expected)
            .values(value_json=encoded, version=expected + 1, updated_at=utc_now())
        )
        if cast(Any, result).rowcount != 1:
            return None
        session.flush()
        return session.get(AppStateRecord, existing.id)

    # Generation jobs ----------------------------------------------------
    def create_job(
        self, app_id: str | None, prompt: Mapping[str, JsonValue]
    ) -> GenerationJobRecord:
        with self.transaction() as session:
            record = GenerationJobRecord(
                id=new_id(), app_id=app_id, prompt_json=canonical_json(dict(prompt))
            )
            session.add(record)
            session.flush()
            return record

    def get_job(self, job_id: str) -> GenerationJobRecord | None:
        with self.transaction() as session:
            return session.get(GenerationJobRecord, job_id)

    def claim_next_job(self, worker_id: str) -> GenerationJobRecord | None:
        """Atomically change one queued job to running, including on SQLite."""

        with self.transaction() as session:
            candidate = session.scalar(
                select(GenerationJobRecord)
                .where(GenerationJobRecord.status == "queued")
                .order_by(GenerationJobRecord.created_at)
                .limit(1)
            )
            if candidate is None:
                return None
            result = session.execute(
                update(GenerationJobRecord)
                .where(
                    GenerationJobRecord.id == candidate.id,
                    GenerationJobRecord.status == "queued",
                )
                .values(
                    status="running",
                    claimed_by=worker_id,
                    started_at=utc_now(),
                    attempt=GenerationJobRecord.attempt + 1,
                )
            )
            if cast(Any, result).rowcount != 1:
                return None
            session.flush()
            return session.get(GenerationJobRecord, candidate.id)

    def update_job_in_session(
        self, session: Session, job: GenerationJobRecord, **values: object
    ) -> GenerationJobRecord:
        for name, value in values.items():
            setattr(job, name, value)
        session.flush()
        return job

    def transition_job_in_session(
        self,
        session: Session,
        *,
        job_id: str,
        expected_statuses: Sequence[str],
        values: Mapping[str, object],
        claimed_by: str | None = None,
        maximum_progress: int | None = None,
    ) -> GenerationJobRecord | None:
        """Compare-and-swap a job transition.

        The service performs richer error reporting before this call, while this
        conditional update closes the race between that check and the write.
        """

        predicates = [
            GenerationJobRecord.id == job_id,
            GenerationJobRecord.status.in_(tuple(expected_statuses)),
        ]
        if claimed_by is not None:
            predicates.append(GenerationJobRecord.claimed_by == claimed_by)
        if maximum_progress is not None:
            predicates.append(GenerationJobRecord.progress <= maximum_progress)
        result = session.execute(
            update(GenerationJobRecord).where(*predicates).values(**dict(values))
        )
        if cast(Any, result).rowcount != 1:
            return None
        session.flush()
        return session.get(GenerationJobRecord, job_id)

    # Device snapshots ---------------------------------------------------
    def add_snapshot_in_session(
        self,
        session: Session,
        *,
        app_id: str | None,
        payload: Mapping[str, JsonValue],
        generated_at: str,
        rows: Sequence[tuple[str, str, int, Mapping[str, JsonValue]]],
    ) -> DeviceSnapshotRecord:
        data = dict(payload)
        snapshot = DeviceSnapshotRecord(
            id=new_id(),
            app_id=app_id,
            payload_json=canonical_json(data),
            checksum=content_hash(data),
            generated_at=generated_at,
        )
        session.add(snapshot)
        session.flush()
        for collection, item_id, ordinal, row_value in rows:
            session.add(
                CollectionRowRecord(
                    id=new_id(),
                    snapshot_id=snapshot.id,
                    collection=collection,
                    item_id=item_id,
                    ordinal=ordinal,
                    value_json=canonical_json(dict(row_value)),
                )
            )
        session.flush()
        return snapshot

    def latest_snapshot(self, app_id: str | None) -> DeviceSnapshotRecord | None:
        with self.transaction() as session:
            query = (
                select(DeviceSnapshotRecord)
                .order_by(desc(DeviceSnapshotRecord.ingested_at))
                .limit(1)
            )
            query = (
                query.where(DeviceSnapshotRecord.app_id.is_(None))
                if app_id is None
                else query.where(DeviceSnapshotRecord.app_id == app_id)
            )
            return session.scalar(query)

    def collection_rows(
        self, snapshot_id: str, collection: str, *, limit: int
    ) -> list[CollectionRowRecord]:
        with self.transaction() as session:
            query = (
                select(CollectionRowRecord)
                .where(
                    CollectionRowRecord.snapshot_id == snapshot_id,
                    CollectionRowRecord.collection == collection,
                )
                .order_by(CollectionRowRecord.ordinal)
                .limit(max(1, min(limit, 100)))
            )
            return list(session.scalars(query))

    # Audit --------------------------------------------------------------
    def add_audit_event(
        self,
        *,
        app_id: str | None,
        event_type: str,
        actor: str | None,
        target_id: str | None,
        payload: Mapping[str, JsonValue],
    ) -> AuditEventRecord:
        with self.transaction() as session:
            record = AuditEventRecord(
                id=new_id(),
                app_id=app_id,
                event_type=event_type,
                actor=actor,
                target_id=target_id,
                payload_json=canonical_json(dict(payload)),
            )
            session.add(record)
            session.flush()
            return record

    def list_audit_events(self, app_id: str | None, *, limit: int = 100) -> list[AuditEventRecord]:
        with self.transaction() as session:
            query = (
                select(AuditEventRecord)
                .order_by(desc(AuditEventRecord.created_at))
                .limit(max(1, min(limit, 100)))
            )
            query = (
                query.where(AuditEventRecord.app_id.is_(None))
                if app_id is None
                else query.where(AuditEventRecord.app_id == app_id)
            )
            return list(session.scalars(query))

    @staticmethod
    def json(record_value: str) -> JsonValue:
        return parse_json(record_value)

    @staticmethod
    def timestamp(value: datetime) -> datetime:
        return _utc(value)

    @staticmethod
    def ignore_integrity(operation: Callable[[], T]) -> T | None:
        """Small helper for optional idempotent callers; normal services raise errors."""

        try:
            return operation()
        except IntegrityError:
            return None
