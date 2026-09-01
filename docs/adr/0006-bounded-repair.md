# 0006 — Bounded model repair

Status: accepted

Generation consists of one candidate and at most two repair calls. Each candidate is byte-bounded,
parsed as strict JSON, structurally and semantically validated, checked for repeated hashes, and
dry-rendered. Only a candidate that passes all checks can create a revision.

Repair receives the complete candidate plus compact machine-readable issues. Security-policy
failures are regenerated, not “fixed” by stripping fields. Exhaustion leaves the last-known-good
revision active and returns a recoverable job error.

Ordinary tests use a fake provider. Real Qwen/Ollama tests are a separate gauntlet so CI does not
depend on model availability.
