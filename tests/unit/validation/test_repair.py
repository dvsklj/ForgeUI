from __future__ import annotations

import json

from forgeui.validation import ManifestPolicy, validate_with_repairs


def _manifest(title: str = "Fleet") -> str:
    return json.dumps(
        {
            "metadata": {"title": title},
            "design": {"name": "ops-compact"},
            "root": "page",
            "elements": {
                "page": {"type": "page", "children": ["heading"]},
                "heading": {
                    "type": "heading",
                    "props": {"text": title, "level": 1},
                },
            },
        }
    )


def _search_manifest(source: str) -> str:
    return json.dumps(
        {
            "metadata": {"title": "Search"},
            "design": {"name": "calm-neutral"},
            "data": {"contract": "ai-search/1", "source": source},
            "root": "page",
            "elements": {
                "page": {"type": "page", "children": ["answer"]},
                "answer": {
                    "type": "text",
                    "props": {"text": {"kind": "ref", "path": "data.answer"}},
                },
            },
        }
    )


class _Repairer:
    def __init__(self, candidates: list[str]) -> None:
        self.candidates = iter(candidates)
        self.calls: list[tuple[str, list[dict[str, str]], int]] = []

    def repair(self, candidate: str, issues: list[dict[str, str]], attempt: int) -> str:
        self.calls.append((candidate, issues, attempt))
        return next(self.candidates)


def test_valid_candidate_needs_no_repair() -> None:
    repairer = _Repairer([])
    report, attempts = validate_with_repairs(_manifest(), repairer)
    assert report.valid
    assert len(attempts) == 1
    assert repairer.calls == []


def test_parse_failure_is_repaired_with_machine_readable_issues() -> None:
    repairer = _Repairer([_manifest("Repaired")])
    report, attempts = validate_with_repairs("not-json", repairer)
    assert report.valid
    assert len(attempts) == 2
    assert repairer.calls[0][1][0]["code"] == "parse_error"
    assert repairer.calls[0][2] == 1


def test_repeated_candidate_stops_without_another_provider_call() -> None:
    invalid = json.dumps({"metadata": {"title": "Broken"}})
    repairer = _Repairer([invalid])
    report, attempts = validate_with_repairs(invalid, repairer)
    assert not report.valid
    assert report.issues[0].code == "repeated_candidate"
    assert len(attempts) == 2
    assert len(repairer.calls) == 1


def test_repair_budget_is_exactly_two_calls() -> None:
    first = json.dumps({"metadata": {"title": "First"}})
    second = json.dumps({"metadata": {"title": "Second"}})
    third = json.dumps({"metadata": {"title": "Third"}})
    repairer = _Repairer([second, third])
    report, attempts = validate_with_repairs(first, repairer)
    assert not report.valid
    assert len(attempts) == 3
    assert [call[2] for call in repairer.calls] == [1, 2]


def test_dry_render_failure_never_produces_a_valid_report() -> None:
    def fail_render(_manifest: object) -> None:
        raise ValueError("template failed")

    repairer = _Repairer([_manifest("Again"), _manifest("Last")])
    report, attempts = validate_with_repairs(_manifest("Initial"), repairer, dry_render=fail_render)
    assert not report.valid
    assert any(issue.code == "dry_render_failed" for issue in report.issues)
    assert len(attempts) == 3


def test_repairs_keep_the_host_policy_for_custom_data_sources() -> None:
    policy = ManifestPolicy(
        contracts={"ai-search/1": frozenset({"data.answer"})},
        sources={"ai-search.latest": "ai-search/1"},
    )
    repairer = _Repairer([_search_manifest("ai-search.latest")])

    report, attempts = validate_with_repairs(
        _search_manifest("unregistered-source"),
        repairer,
        policy=policy,
    )

    assert report.valid
    assert len(attempts) == 2
    assert {issue.code for issue in attempts[0].report.issues} == {"unknown_data_source"}


def test_repairs_cannot_escape_the_custom_host_policy() -> None:
    policy = ManifestPolicy(
        contracts={"ai-search/1": frozenset({"data.answer"})},
        sources={"ai-search.latest": "ai-search/1"},
    )
    repairer = _Repairer([_manifest("Fallback"), _manifest("Still fallback")])

    report, attempts = validate_with_repairs(
        _search_manifest("unregistered-source"),
        repairer,
        policy=policy,
    )

    assert not report.valid
    assert len(attempts) == 3
    assert all(not attempt.report.valid for attempt in attempts)
