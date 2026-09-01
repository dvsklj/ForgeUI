"""Validated device-health snapshots and deliberately bounded data projection."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime
from typing import cast

from forgeui.data.models import DeviceSnapshotRecord
from forgeui.data.repositories import ForgeRepository, JsonValue, canonical_json, parse_json
from forgeui.domain.device_health import DeviceHealthSnapshot
from forgeui.services.exceptions import ForbiddenError, NotFoundError

MAX_SNAPSHOT_BYTES = 262_144
MAX_QUERY_LIMIT = 100
MAX_QUERY_OFFSET = 10_000
DEVICE_FILTER_FIELDS = frozenset({"id", "name", "platform", "status"})
DEVICE_PROJECTION_FIELDS = frozenset(
    {
        "id",
        "name",
        "platform",
        "status",
        "cpu",
        "memory",
        "disk",
        "temperature",
        "latency",
        "last_seen",
        "active_alert_count",
    }
)


@dataclass(frozen=True, slots=True)
class SnapshotView:
    id: str
    app_id: str | None
    checksum: str
    snapshot: DeviceHealthSnapshot


@dataclass(frozen=True, slots=True)
class DeviceQueryPage:
    snapshot_id: str
    checksum: str
    offset: int
    limit: int
    total: int
    rows: tuple[dict[str, JsonValue], ...]


class DeviceHealthService:
    """Only this service writes the first trusted device-health contract."""

    def __init__(self, repository: ForgeRepository) -> None:
        self.repository = repository

    @staticmethod
    def _snapshot_view(record: DeviceSnapshotRecord) -> SnapshotView:
        raw = parse_json(record.payload_json)
        if not isinstance(raw, dict):
            raise RuntimeError("stored snapshot is not an object")
        return SnapshotView(
            record.id,
            record.app_id,
            record.checksum,
            DeviceHealthSnapshot.model_validate(raw, strict=True),
        )

    @staticmethod
    def _validate_generated_at(value: str) -> None:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ForbiddenError("snapshot generated_at must be ISO-8601") from exc
        if parsed.tzinfo is None:
            raise ForbiddenError("snapshot generated_at must include a UTC offset")

    def push(
        self,
        snapshot: DeviceHealthSnapshot | Mapping[str, object],
        *,
        app_id: str | None = None,
    ) -> SnapshotView:
        try:
            parsed = (
                snapshot
                if isinstance(snapshot, DeviceHealthSnapshot)
                else DeviceHealthSnapshot.model_validate(snapshot, strict=True)
            )
        except ValueError as exc:
            raise ForbiddenError("invalid device-health snapshot") from exc
        self._validate_generated_at(parsed.generated_at)
        payload = cast(dict[str, JsonValue], parsed.model_dump(mode="json"))
        if len(canonical_json(payload).encode("utf-8")) > MAX_SNAPSHOT_BYTES:
            raise ForbiddenError("device-health snapshot exceeds 256 KiB")
        if app_id is not None and self.repository.get_app(app_id) is None:
            raise NotFoundError("app not found")
        rows: list[tuple[str, str, int, Mapping[str, JsonValue]]] = []
        for ordinal, device in enumerate(parsed.devices):
            rows.append(("devices", device.id, ordinal, device.model_dump(mode="json")))
        for ordinal, incident in enumerate(parsed.incidents):
            rows.append(("incidents", incident.id, ordinal, incident.model_dump(mode="json")))
        for ordinal, point in enumerate(parsed.series):
            rows.append(("series", f"{ordinal}", ordinal, point.model_dump(mode="json")))
        with self.repository.transaction() as session:
            record = self.repository.add_snapshot_in_session(
                session,
                app_id=app_id,
                payload=payload,
                generated_at=parsed.generated_at,
                rows=rows,
            )
            return self._snapshot_view(record)

    def latest(self, *, app_id: str | None = None) -> SnapshotView | None:
        record = self.repository.latest_snapshot(app_id)
        return None if record is None else self._snapshot_view(record)

    def query_devices(
        self,
        *,
        app_id: str | None = None,
        filters: Mapping[str, str] | None = None,
        projection: Sequence[str] | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> DeviceQueryPage:
        if not 0 <= offset <= MAX_QUERY_OFFSET:
            raise ForbiddenError("offset is outside the allowed query window")
        if not 1 <= limit <= MAX_QUERY_LIMIT:
            raise ForbiddenError("limit must be 1..100")
        accepted_filters = dict(filters or {})
        if set(accepted_filters) - DEVICE_FILTER_FIELDS:
            raise ForbiddenError("device filter field is not allowed")
        if any(len(value) > 120 for value in accepted_filters.values()):
            raise ForbiddenError("device filter value is too long")
        selected = tuple(projection or sorted(DEVICE_PROJECTION_FIELDS))
        if not selected or len(selected) > len(DEVICE_PROJECTION_FIELDS):
            raise ForbiddenError("invalid device projection")
        if set(selected) - DEVICE_PROJECTION_FIELDS:
            raise ForbiddenError("device projection field is not allowed")
        snapshot = self.latest(app_id=app_id)
        if snapshot is None:
            raise NotFoundError("no device-health snapshot is available")
        # At most one contract's bounded collection (100 rows) is decoded, then
        # filtering/projection is done in Python. No user data reaches SQL syntax.
        raw_rows = self.repository.collection_rows(snapshot.id, "devices", limit=MAX_QUERY_LIMIT)
        rows: list[dict[str, JsonValue]] = []
        for raw_row in raw_rows:
            value = parse_json(raw_row.value_json)
            if not isinstance(value, dict):
                continue
            if any(value.get(field) != expected for field, expected in accepted_filters.items()):
                continue
            rows.append({field: value[field] for field in selected if field in value})
        return DeviceQueryPage(
            snapshot.id,
            snapshot.checksum,
            offset,
            limit,
            len(rows),
            tuple(rows[offset : offset + limit]),
        )
