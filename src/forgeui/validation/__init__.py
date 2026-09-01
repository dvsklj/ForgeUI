"""Manifest parsing, validation and bounded repair interfaces."""

from forgeui.validation.parser import ManifestParseError, parse_manifest_candidate
from forgeui.validation.repair import (
    CandidateRepairer,
    RepairAttempt,
    validate_with_repairs,
)
from forgeui.validation.validator import (
    DEFAULT_MANIFEST_POLICY,
    ManifestPolicy,
    ValidationIssue,
    ValidationReport,
    manifest_json_schema,
    validate_manifest,
)

__all__ = [
    "DEFAULT_MANIFEST_POLICY",
    "CandidateRepairer",
    "ManifestParseError",
    "ManifestPolicy",
    "RepairAttempt",
    "ValidationIssue",
    "ValidationReport",
    "manifest_json_schema",
    "parse_manifest_candidate",
    "validate_manifest",
    "validate_with_repairs",
]
