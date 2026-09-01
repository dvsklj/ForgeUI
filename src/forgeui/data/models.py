"""SQLAlchemy records. JSON is encoded with the canonical helpers in repositories."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class AppRecord(Base):
    __tablename__ = "apps"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    visibility: Mapped[str] = mapped_column(String(16), nullable=False, default="private")
    current_revision_id: Mapped[str | None] = mapped_column(String(48), nullable=True)
    last_known_good_revision_id: Mapped[str | None] = mapped_column(String(48), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    __table_args__ = (
        CheckConstraint("visibility IN ('private', 'public')", name="ck_apps_visibility"),
    )


class ManifestRevisionRecord(Base):
    __tablename__ = "manifest_revisions"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    app_id: Mapped[str] = mapped_column(ForeignKey("apps.id", ondelete="CASCADE"), nullable=False)
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    parent_revision_id: Mapped[str | None] = mapped_column(String(48), nullable=True)
    manifest_json: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    __table_args__ = (
        UniqueConstraint("app_id", "revision_number", name="uq_manifest_revision_number"),
        Index("ix_manifest_revisions_app_created", "app_id", "created_at"),
    )


class AppStateRecord(Base):
    __tablename__ = "app_state"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    app_id: Mapped[str] = mapped_column(ForeignKey("apps.id", ondelete="CASCADE"), nullable=False)
    scope: Mapped[str] = mapped_column(String(16), nullable=False)
    scope_key: Mapped[str] = mapped_column(String(160), nullable=False)
    value_json: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )

    __table_args__ = (
        CheckConstraint("scope IN ('session', 'global')", name="ck_app_state_scope"),
        UniqueConstraint("app_id", "scope", "scope_key", name="uq_app_state_scope"),
    )


class GenerationJobRecord(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    app_id: Mapped[str | None] = mapped_column(
        ForeignKey("apps.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    prompt_json: Mapped[str] = mapped_column(Text, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    claimed_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    result_revision_id: Mapped[str | None] = mapped_column(String(48), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')",
            name="ck_generation_status",
        ),
        CheckConstraint("progress >= 0 AND progress <= 100", name="ck_generation_progress"),
        Index("ix_generation_jobs_status_created", "status", "created_at"),
    )


class DeviceSnapshotRecord(Base):
    __tablename__ = "device_snapshots"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    app_id: Mapped[str | None] = mapped_column(
        ForeignKey("apps.id", ondelete="SET NULL"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(48), nullable=False, default="device-health")
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    generated_at: Mapped[str] = mapped_column(String(40), nullable=False)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    __table_args__ = (Index("ix_device_snapshots_app_ingested", "app_id", "ingested_at"),)


class CollectionRowRecord(Base):
    __tablename__ = "collection_rows"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    snapshot_id: Mapped[str] = mapped_column(
        ForeignKey("device_snapshots.id", ondelete="CASCADE"), nullable=False
    )
    collection: Mapped[str] = mapped_column(String(32), nullable=False)
    item_id: Mapped[str] = mapped_column(String(80), nullable=False)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    value_json: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint("snapshot_id", "collection", "item_id", name="uq_collection_row_item"),
        Index("ix_collection_rows_snapshot_collection", "snapshot_id", "collection", "ordinal"),
    )


class AuditEventRecord(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(48), primary_key=True)
    app_id: Mapped[str | None] = mapped_column(
        ForeignKey("apps.id", ondelete="SET NULL"), nullable=True
    )
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    actor: Mapped[str | None] = mapped_column(String(120), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )

    __table_args__ = (Index("ix_audit_events_app_created", "app_id", "created_at"),)


JsonObject = dict[str, Any]
