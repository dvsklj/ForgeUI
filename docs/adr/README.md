# Architectural Decision Records

This directory holds the numbered, append-only record of architectural
decisions for Forge.

## Rules

1. **Numbers are sequential and permanent.** ADR-0001, ADR-0002, and so on.
   Once an ADR has a number, that number never changes.
2. **Merged ADRs are not edited.** If a decision changes, write a new ADR
   that supersedes the old one. Mark the old one `Status: Superseded by
   ADR-NNNN` but leave its body alone — the history matters.
3. **One decision per file.** Don't bundle.
4. **ADRs are short.** A decision no one reads is a decision that won't
   hold. Aim for one page. If you need more space, the decision probably
   isn't made yet.

## Template

```markdown
# ADR NNNN — <short decision title>

Status: Proposed | Accepted | Superseded by ADR-NNNN
Date: YYYY-MM-DD

## Context

What forces the decision? What's the problem or the trade-off?

## Decision

What we're going to do. Present tense, active voice.

## Consequences

What becomes true because of this decision — good, bad, and neutral.
What doors does this close?
```

## Index

- [ADR-0001](./0001-ring-2-interfaces-oss-first.md) — Ring 2 interfaces
  land in open source first
