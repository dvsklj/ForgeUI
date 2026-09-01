"""Bounded audit event recording without application logging of event payloads."""

from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass

from forgeui.data.models import AuditEventRecord
from forgeui.data.repositories import ForgeRepository, JsonValue, canonical_json, parse_json
from forgeui.services.exceptions import ForbiddenError, NotFoundError

_EVENT_TYPE = re.compile(r"^[a-z][a-z0-9_.-]{0,79}$")


@dataclass(frozen=True, slots=True)
class AuditEventView:
    id: str
    app_id: str | None
    event_type: str
    actor: str | None
    target_id: str | None
    payload: dict[str, JsonValue]


class AuditService:
    """Records a bounded, structured audit trail; callers decide safe payload fields."""

    def __init__(self, repository: ForgeRepository) -> None:
        self.repository = repository

    @staticmethod
    def _view(record: AuditEventRecord) -> AuditEventView:
        raw = parse_json(record.payload_json)
        if not isinstance(raw, dict):
            raise RuntimeError("stored audit payload is not an object")
        return AuditEventView(
            record.id,
            record.app_id,
            record.event_type,
            record.actor,
            record.target_id,
            raw,
        )

    def record(
        self,
        *,
        app_id: str | None,
        event_type: str,
        actor: str | None = None,
        target_id: str | None = None,
        payload: Mapping[str, JsonValue] | None = None,
    ) -> AuditEventView:
        if not _EVENT_TYPE.fullmatch(event_type):
            raise ForbiddenError("audit event type is invalid")
        if actor is not None and len(actor) > 120:
            raise ForbiddenError("audit actor is too long")
        if target_id is not None and len(target_id) > 80:
            raise ForbiddenError("audit target is too long")
        event_payload = dict(payload or {})
        if len(canonical_json(event_payload).encode("utf-8")) > 16_384:
            raise ForbiddenError("audit payload exceeds 16 KiB")
        if app_id is not None and self.repository.get_app(app_id) is None:
            raise NotFoundError("app not found")
        return self._view(
            self.repository.add_audit_event(
                app_id=app_id,
                event_type=event_type,
                actor=actor,
                target_id=target_id,
                payload=event_payload,
            )
        )

    def list(self, app_id: str | None, *, limit: int = 100) -> list[AuditEventView]:
        return [
            self._view(record) for record in self.repository.list_audit_events(app_id, limit=limit)
        ]
