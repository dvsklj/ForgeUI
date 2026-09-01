from __future__ import annotations

import pytest
from conftest import manifest

from forgeui.data import ForgeRepository
from forgeui.services import AppService, AuditService, DeviceHealthService, GenerationJobService
from forgeui.services.exceptions import ForbiddenError, InvalidTransitionError


def snapshot(status: str = "healthy") -> dict[str, object]:
    return {
        "contract": "device-health/1",
        "generated_at": "2026-07-24T10:00:00Z",
        "summary": {
            "total": 2,
            "healthy": 1,
            "warning": 1,
            "critical": 0,
            "offline": 0,
            "fleet_cpu": 0.2,
            "fleet_memory": 0.3,
            "fleet_disk": 0.4,
        },
        "devices": [
            {
                "id": "one",
                "name": "One",
                "platform": "linux",
                "status": status,
                "cpu": 0.1,
                "memory": 0.2,
                "disk": 0.3,
                "temperature": 42.0,
                "latency": 10.0,
                "last_seen": "2026-07-24T10:00:00Z",
                "active_alert_count": 0,
            },
            {
                "id": "two",
                "name": "Two",
                "platform": "windows",
                "status": "warning",
                "cpu": 0.8,
                "memory": 0.7,
                "disk": 0.6,
                "temperature": 55.0,
                "latency": 20.0,
                "last_seen": "2026-07-24T10:00:00Z",
                "active_alert_count": 2,
            },
        ],
    }


def test_job_lifecycle_guards(repository: ForgeRepository, apps: AppService) -> None:
    app = apps.create_app("Fleet")
    revision = apps.save_manifest(app.id, manifest())
    jobs = GenerationJobService(repository)
    job = jobs.create(app_id=app.id, prompt={"brief": "fleet health"})
    claimed = jobs.claim_next("worker-a")
    assert claimed is not None
    assert claimed.id == job.id
    assert claimed.status == "running"
    assert jobs.progress(job.id, value=25, worker_id="worker-a").progress == 25
    assert jobs.succeed(job.id, revision_id=revision.id, worker_id="worker-a").status == "succeeded"
    with pytest.raises(InvalidTransitionError):
        jobs.cancel(job.id)
    cancellable = jobs.create(app_id=app.id, prompt={"brief": "again"})
    assert jobs.cancel(cancellable.id).status == "cancelled"


def test_job_transitions_detect_a_concurrent_winner(
    repository: ForgeRepository, apps: AppService, monkeypatch: pytest.MonkeyPatch
) -> None:
    app = apps.create_app("Fleet")
    jobs = GenerationJobService(repository)
    job = jobs.create(app_id=app.id, prompt={"brief": "fleet health"})
    assert jobs.claim_next("worker-a") is not None

    original = repository.transition_job_in_session

    def lose_transition(*args: object, **kwargs: object) -> None:
        return None

    monkeypatch.setattr(repository, "transition_job_in_session", lose_transition)
    with pytest.raises(InvalidTransitionError, match="changed concurrently"):
        jobs.fail(job.id, error_code="provider_timeout", worker_id="worker-a")
    monkeypatch.setattr(repository, "transition_job_in_session", original)

    assert jobs.fail(job.id, error_code="provider_timeout", worker_id="worker-a").status == "failed"


def test_snapshot_validation_latest_write_and_bounded_projection(
    devices: DeviceHealthService,
) -> None:
    first = devices.push(snapshot())
    second = devices.push(snapshot("critical"))
    latest = devices.latest()
    assert latest is not None
    assert latest.id == second.id
    page = devices.query_devices(filters={"status": "critical"}, projection=["id", "status"])
    assert page.snapshot_id == second.id
    assert page.total == 1
    assert page.rows == ({"id": "one", "status": "critical"},)
    with pytest.raises(ForbiddenError):
        devices.query_devices(projection=["__class__"])
    invalid = snapshot()
    invalid["generated_at"] = "not-a-date"
    with pytest.raises(ForbiddenError):
        devices.push(invalid)
    assert first.checksum != second.checksum


def test_audit_events_are_bounded_and_scoped(repository: ForgeRepository, apps: AppService) -> None:
    app = apps.create_app("Fleet")
    audit = AuditService(repository)
    saved = audit.record(
        app_id=app.id,
        event_type="manifest.saved",
        actor="operator",
        payload={"revision": "safe-id"},
    )
    assert saved.payload == {"revision": "safe-id"}
    assert audit.list(app.id)[0].id == saved.id
    with pytest.raises(ForbiddenError):
        audit.record(app_id=app.id, event_type="INVALID EVENT")
