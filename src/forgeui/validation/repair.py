"""Provider-independent bounded repair orchestration interfaces."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from hashlib import sha256
from typing import Protocol

from forgeui.validation.parser import ManifestParseError, parse_manifest_candidate
from forgeui.validation.validator import (
    DEFAULT_MANIFEST_POLICY,
    ManifestPolicy,
    ValidationReport,
    validate_manifest,
)

MAX_REPAIR_CALLS = 2


class CandidateRepairer(Protocol):
    """Implemented later by an LLM adapter; it is intentionally not an Ollama API."""

    def repair(self, candidate: str, issues: list[dict[str, str]], attempt: int) -> str: ...


@dataclass(frozen=True, slots=True)
class RepairAttempt:
    attempt: int
    candidate_hash: str
    report: ValidationReport


def validate_with_repairs(
    initial_candidate: str,
    repairer: CandidateRepairer,
    *,
    dry_render: Callable[[object], None] | None = None,
    policy: ManifestPolicy = DEFAULT_MANIFEST_POLICY,
) -> tuple[ValidationReport, tuple[RepairAttempt, ...]]:
    """Attempt the initial answer plus at most two non-repeated, policy-bound repairs."""

    candidate = initial_candidate
    attempts: list[RepairAttempt] = []
    seen: set[str] = set()
    last_report = ValidationReport.invalid("parse_error", "$", "no candidate evaluated")
    for attempt in range(MAX_REPAIR_CALLS + 1):
        digest = sha256(candidate.encode("utf-8")).hexdigest()
        if digest in seen:
            last_report = ValidationReport.invalid(
                "repeated_candidate", "$", "provider repeated a candidate"
            )
            attempts.append(RepairAttempt(attempt, digest, last_report))
            break
        seen.add(digest)
        try:
            parsed = parse_manifest_candidate(candidate)
            report = validate_manifest(parsed, dry_render=dry_render, policy=policy)
        except ManifestParseError as exc:
            report = ValidationReport.invalid("parse_error", "$", str(exc))
        attempts.append(RepairAttempt(attempt, digest, report))
        last_report = report
        if report.valid or attempt == MAX_REPAIR_CALLS:
            break
        candidate = repairer.repair(
            candidate, [issue.as_dict() for issue in report.issues], attempt + 1
        )
    return last_report, tuple(attempts)
