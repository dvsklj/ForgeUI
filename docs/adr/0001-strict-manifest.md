# 0001 — Strict `forgeui/1` manifest

Status: accepted

ForgeUI uses a versioned, flat, ID-indexed JSON manifest. Every object is validated by strict
Pydantic models with unknown keys rejected. Components, expressions, actions, references, graph
shape, data paths, and size limits are checked before rendering or persistence.

The model cannot emit HTML, CSS, Tailwind classes, JavaScript, SVG paths, URLs, SQL, file paths, or
template names. Dynamic values use a bounded JSON expression AST instead of an expression string.

This costs some catalog development time, but makes the same contract usable for schema-guided
generation, validation, rendering, documentation, and tests.
