# ForgeUI agent rules

- If `AGENTS.local.md` exists, read it before starting work. It contains machine-specific rules and
  must remain untracked.
- ForgeUI is a standalone Python project.
- Keep the model boundary strict: manifests never contain HTML, JavaScript, CSS, Tailwind classes, URLs, SQL, file paths, or arbitrary executable expressions.
- Keep the component catalog, Pydantic models, JSON Schema, renderer dispatch, and prompt documentation in sync.
- Reject invalid manifests before persistence or rendering. Do not silently weaken security rules while repairing output.
- Prefer server-owned state, immutable manifest revisions, and trusted capability/data-source registries.
- Keep UI behavior accessible: semantic HTML, visible focus, labelled inputs, keyboard support, reduced motion, and tested light/dark themes.
- Treat adjacent checkouts as read-only; they may contain user changes.
- Agents working concurrently must have disjoint file ownership.
- Run focused tests for changed code and report exact commands and failures.
- Avoid vague production-readiness claims. State implemented controls, checks, and remaining risks precisely.

- For analytics, KPI dashboards, or Mermaid flowcharts, read `docs/analytics.md`;
  use the generic contract in `examples/analytics_host.py` with
  `examples/manifests/sales-analytics.json`.
