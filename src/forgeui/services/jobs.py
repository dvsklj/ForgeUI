"""Legal generation-job lifecycle operations."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

from forgeui.data.models import GenerationJobRecord, ManifestRevisionRecord, utc_now
from forgeui.data.repositories import ForgeRepository, JsonValue, canonical_json, parse_json
from forgeui.services.exceptions import InvalidTransitionError, NotFoundError


@dataclass(frozen=True, slots=True)
class GenerationJobView:
    id: str
    app_id: str | None
    status: str
    prompt: dict[str, JsonValue]
    progress: int
    attempt: int
    claimed_by: str | None
    result_revision_id: str | None
    error_code: str | None


class GenerationJobService:
    """Own generation state transitions; provider calls belong in generation.py."""

    def __init__(self, repository: ForgeRepository) -> None:
        self.repository = repository

    @staticmethod
    def _view(record: GenerationJobRecord) -> GenerationJobView:
        raw = parse_json(record.prompt_json)
        if not isinstance(raw, dict):
            raise RuntimeError("stored job prompt is not an object")
        return GenerationJobView(
            record.id,
            record.app_id,
            record.status,
            raw,
            record.progress,
            record.attempt,
            record.claimed_by,
            record.result_revision_id,
            record.error_code,
        )

    def create(self, *, app_id: str | None, prompt: Mapping[str, JsonValue]) -> GenerationJobView:
        if len(canonical_json(dict(prompt)).encode("utf-8")) > 16_384:
            raise ValueError("generation prompt exceeds 16 KiB")
        if app_id is not None and self.repository.get_app(app_id) is None:
            raise NotFoundError("app not found")
        return self._view(self.repository.create_job(app_id, prompt))

    def get(self, job_id: str) -> GenerationJobView:
        record = self.repository.get_job(job_id)
        if record is None:
            raise NotFoundError("generation job not found")
        return self._view(record)

    def claim_next(self, worker_id: str) -> GenerationJobView | None:
        if not 1 <= len(worker_id) <= 120:
            raise ValueError("worker id must be 1..120 characters")
        record = self.repository.claim_next_job(worker_id)
        return None if record is None else self._view(record)

    def progress(
        self, job_id: str, *, value: int, worker_id: str | None = None
    ) -> GenerationJobView:
        if not 0 <= value <= 99:
            raise ValueError("progress must be 0..99 while a job is running")
        with self.repository.transaction() as session:
            job = session.get(GenerationJobRecord, job_id)
            if job is None:
                raise NotFoundError("generation job not found")
            if job.status != "running":
                raise InvalidTransitionError("only running jobs can report progress")
            if worker_id is not None and job.claimed_by != worker_id:
                raise InvalidTransitionError("job is claimed by another worker")
            if value < job.progress:
                raise InvalidTransitionError("job progress cannot decrease")
            updated = self.repository.transition_job_in_session(
                session,
                job_id=job_id,
                expected_statuses=("running",),
                values={"progress": value},
                claimed_by=worker_id,
                maximum_progress=value,
            )
            if updated is None:
                raise InvalidTransitionError("generation job changed concurrently")
            return self._view(updated)

    def succeed(
        self, job_id: str, *, revision_id: str, worker_id: str | None = None
    ) -> GenerationJobView:
        with self.repository.transaction() as session:
            job = session.get(GenerationJobRecord, job_id)
            if job is None:
                raise NotFoundError("generation job not found")
            if job.status != "running":
                raise InvalidTransitionError("only running jobs can succeed")
            if worker_id is not None and job.claimed_by != worker_id:
                raise InvalidTransitionError("job is claimed by another worker")
            revision = session.get(ManifestRevisionRecord, revision_id)
            if revision is None:
                raise NotFoundError("manifest revision not found")
            if job.app_id is not None and revision.app_id != job.app_id:
                raise InvalidTransitionError("result revision belongs to a different app")
            updated = self.repository.transition_job_in_session(
                session,
                job_id=job_id,
                expected_statuses=("running",),
                values={
                    "status": "succeeded",
                    "progress": 100,
                    "result_revision_id": revision_id,
                    "finished_at": utc_now(),
                },
                claimed_by=worker_id,
            )
            if updated is None:
                raise InvalidTransitionError("generation job changed concurrently")
            return self._view(updated)

    def fail(
        self, job_id: str, *, error_code: str, worker_id: str | None = None
    ) -> GenerationJobView:
        if not 1 <= len(error_code) <= 64:
            raise ValueError("error code must be 1..64 characters")
        with self.repository.transaction() as session:
            job = session.get(GenerationJobRecord, job_id)
            if job is None:
                raise NotFoundError("generation job not found")
            if job.status != "running":
                raise InvalidTransitionError("only running jobs can fail")
            if worker_id is not None and job.claimed_by != worker_id:
                raise InvalidTransitionError("job is claimed by another worker")
            updated = self.repository.transition_job_in_session(
                session,
                job_id=job_id,
                expected_statuses=("running",),
                values={
                    "status": "failed",
                    "error_code": error_code,
                    "finished_at": utc_now(),
                },
                claimed_by=worker_id,
            )
            if updated is None:
                raise InvalidTransitionError("generation job changed concurrently")
            return self._view(updated)

    def cancel(self, job_id: str) -> GenerationJobView:
        with self.repository.transaction() as session:
            job = session.get(GenerationJobRecord, job_id)
            if job is None:
                raise NotFoundError("generation job not found")
            if job.status not in {"queued", "running"}:
                raise InvalidTransitionError("only queued or running jobs can be cancelled")
            updated = self.repository.transition_job_in_session(
                session,
                job_id=job_id,
                expected_statuses=("queued", "running"),
                values={"status": "cancelled", "finished_at": utc_now()},
            )
            if updated is None:
                raise InvalidTransitionError("generation job changed concurrently")
            return self._view(updated)
