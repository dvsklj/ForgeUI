# ForgeUI agent rules

- ForgeUI is a greenfield Python project. Use the legacy checkout only as a product reference.
- Keep the model boundary strict: manifests never contain HTML, JavaScript, CSS, Tailwind classes, URLs, SQL, file paths, or arbitrary executable expressions.
- Keep the component catalog, Pydantic models, JSON Schema, renderer dispatch, and prompt documentation in sync.
- Reject invalid manifests before persistence or rendering. Do not silently weaken security rules while repairing output.
- Prefer server-owned state, immutable manifest revisions, and trusted capability/data-source registries.
- Keep UI behavior accessible: semantic HTML, visible focus, labelled inputs, keyboard support, reduced motion, and tested light/dark themes.
- Do not edit `<local-legacy-checkout>`; its worktree contains user changes.
- Agents working concurrently must have disjoint file ownership.
- Run focused tests for changed code and report exact commands and failures.
- Avoid vague production-readiness claims. State implemented controls, checks, and remaining risks precisely.
