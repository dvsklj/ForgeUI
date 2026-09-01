"""Application CRUD and immutable manifest revision operations."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from typing import cast

from forgeui.data.models import AppRecord, ManifestRevisionRecord
from forgeui.data.repositories import ForgeRepository, JsonValue, parse_json
from forgeui.domain.models import ForgeManifest
from forgeui.services.exceptions import ConflictError, ForbiddenError, NotFoundError
from forgeui.validation import (
    DEFAULT_MANIFEST_POLICY,
    ManifestPolicy,
    ValidationReport,
    validate_manifest,
)


@dataclass(frozen=True, slots=True)
class AppView:
    id: str
    title: str
    visibility: str
    current_revision_id: str | None
    last_known_good_revision_id: str | None


@dataclass(frozen=True, slots=True)
class ManifestRevisionView:
    id: str
    app_id: str
    number: int
    parent_revision_id: str | None
    content_hash: str
    manifest: ForgeManifest


class InvalidManifestError(ForbiddenError):
    """A candidate failed validation and was intentionally never persisted."""

    def __init__(self, report: ValidationReport) -> None:
        super().__init__("manifest validation failed")
        self.report = report


class AppService:
    """The sole persistence path for manifests and their current revision pointers."""

    def __init__(
        self,
        repository: ForgeRepository,
        *,
        dry_render: Callable[[ForgeManifest], None] | None = None,
        manifest_policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY,
    ) -> None:
        self.repository = repository
        self.dry_render = dry_render
        self.manifest_policy = manifest_policy

    @staticmethod
    def _app_view(record: AppRecord) -> AppView:
        return AppView(
            id=record.id,
            title=record.title,
            visibility=record.visibility,
            current_revision_id=record.current_revision_id,
            last_known_good_revision_id=record.last_known_good_revision_id,
        )

    @staticmethod
    def _revision_view(record: ManifestRevisionRecord) -> ManifestRevisionView:
        raw = parse_json(record.manifest_json)
        if not isinstance(raw, dict):
            raise RuntimeError("stored manifest is not an object")
        return ManifestRevisionView(
            id=record.id,
            app_id=record.app_id,
            number=record.revision_number,
            parent_revision_id=record.parent_revision_id,
            content_hash=record.content_hash,
            manifest=ForgeManifest.model_validate(raw, strict=True),
        )

    @staticmethod
    def _validate_title(title: str) -> str:
        clean = title.strip()
        if not 1 <= len(clean) <= 120:
            raise ForbiddenError("app title must be 1..120 characters")
        return clean

    @staticmethod
    def _validate_visibility(visibility: str) -> str:
        if visibility not in {"private", "public"}:
            raise ForbiddenError("visibility must be private or public")
        return visibility

    def create_app(self, title: str, *, visibility: str = "private") -> AppView:
        record = self.repository.create_app(
            self._validate_title(title), self._validate_visibility(visibility)
        )
        return self._app_view(record)

    def list_apps(self, *, include_private: bool = False, limit: int = 100) -> list[AppView]:
        visibility = None if include_private else "public"
        records = self.repository.list_apps(visibility=visibility, limit=limit)
        return [self._app_view(record) for record in records]

    def get_app(self, app_id: str, *, include_private: bool = True) -> AppView:
        record = self.repository.get_app(app_id)
        if record is None:
            raise NotFoundError("app not found")
        if record.visibility == "private" and not include_private:
            raise NotFoundError("app not found")
        return self._app_view(record)

    def update_app(
        self, app_id: str, *, title: str | None = None, visibility: str | None = None
    ) -> AppView:
        record = self.repository.update_app(
            app_id,
            title=self._validate_title(title) if title is not None else None,
            visibility=self._validate_visibility(visibility) if visibility is not None else None,
        )
        if record is None:
            raise NotFoundError("app not found")
        return self._app_view(record)

    def delete_app(self, app_id: str) -> None:
        if not self.repository.delete_app(app_id):
            raise NotFoundError("app not found")

    def save_manifest(
        self,
        app_id: str,
        candidate: ForgeManifest | Mapping[str, object],
        *,
        expected_revision_id: str | None = None,
        created_by: str | None = None,
    ) -> ManifestRevisionView:
        # This happens before opening a persistence transaction by design: invalid
        # model output cannot create any row or alter last-known-good.
        report = validate_manifest(
            candidate,
            dry_render=self.dry_render,
            policy=self.manifest_policy,
        )
        if not report.valid or report.manifest is None:
            raise InvalidManifestError(report)
        manifest_data = cast(dict[str, JsonValue], report.manifest.model_dump(mode="json"))
        with self.repository.transaction() as session:
            app = self.repository.get_app_in_session(session, app_id)
            if app is None:
                raise NotFoundError("app not found")
            if expected_revision_id is not None and app.current_revision_id != expected_revision_id:
                raise ConflictError("current manifest revision changed")
            revision = self.repository.create_revision_in_session(
                session,
                app=app,
                manifest=manifest_data,
                parent_revision_id=app.current_revision_id,
                created_by=created_by,
            )
            if revision is None:
                raise ConflictError("current manifest revision changed")
            return self._revision_view(revision)

    def get_revision(self, revision_id: str) -> ManifestRevisionView:
        record = self.repository.get_revision(revision_id)
        if record is None:
            raise NotFoundError("manifest revision not found")
        return self._revision_view(record)

    def get_current_manifest(self, app_id: str) -> ManifestRevisionView:
        app = self.repository.get_app(app_id)
        if app is None:
            raise NotFoundError("app not found")
        if app.current_revision_id is None:
            raise NotFoundError("app has no manifest")
        return self.get_revision(app.current_revision_id)

    def list_revisions(self, app_id: str, *, limit: int = 100) -> list[ManifestRevisionView]:
        if self.repository.get_app(app_id) is None:
            raise NotFoundError("app not found")
        records = self.repository.list_revisions(app_id, limit=limit)
        return [self._revision_view(record) for record in records]

    def restore_revision(
        self,
        app_id: str,
        revision_id: str,
        *,
        expected_revision_id: str | None = None,
        created_by: str | None = None,
    ) -> ManifestRevisionView:
        """Restore by appending a copy, never by moving/altering old revision data."""

        target = self.get_revision(revision_id)
        if target.app_id != app_id:
            raise ForbiddenError("revision does not belong to this app")
        return self.save_manifest(
            app_id,
            target.manifest,
            expected_revision_id=expected_revision_id,
            created_by=created_by,
        )
