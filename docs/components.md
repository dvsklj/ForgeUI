# Component catalog and design profiles

ForgeUI ships 46 catalog entries. The catalog is server-owned: it maps an element type to strict
Pydantic props, a fixed Jinja template, schema/prompt documentation, and allowed design profiles.
Models select a profile ID, never individual colors, fonts, classes, CSS, or SVG paths.

All profiles inherit a compact ForgeUI foundation: system typography, deep-teal accents,
cool-neutral surfaces, restrained 6 px radii, dense operational tables, and a charcoal shell. The
legacy checkout was used only as a visual reference. A profile can safely alter emphasis, density,
and composition without replacing that visual identity or exposing low-level styling to a model.

## Profiles

| Profile | Intended use |
| --- | --- |
| `ops-compact` | Dense fleet monitoring and operational triage. |
| `signal-cards` | KPI- and chart-forward health summaries. |
| `executive-summary` | Spacious high-level summaries with non-data layout/content controls. |
| `calm-neutral` | Quiet, detail-oriented status views. |

Each profile has trusted light, dark, and system-mode styling. Data-rich components are compatible
with `ops-compact`, `signal-cards`, and `calm-neutral`; the semantic validator rejects an
incompatible `executive-summary` combination.

## Catalog

| Group | Types |
| --- | --- |
| Structure | `page`, `page-header`, `container`, `stack`, `inline`, `grid`, `card`, `section`, `divider`, `repeat` |
| Content | `heading`, `text`, `badge`, `icon`, `key-value`, `metric`, `alert`, `progress`, `empty-state` |
| Data and charts | `table`, `status-list`, `timeline`, `sparkline`, `line-chart`, `bar-chart`, `donut-chart` |
| Controls | `button`, `modal`, `form`, `field-group`, `field`, `text-input`, `textarea`, `number-input`, `select`, `radio-group`, `checkbox`, `toggle`, `search`, `tabs`, `date-range`, `breadcrumbs`, `pagination`, `toast` |
| Assets | `image`, `file-upload` |

`image` and `file-upload` use constrained catalog props; they do not create a general remote-media
or filesystem escape hatch. Icons are names from a fixed catalog. Charts are trusted server SVG
with bounded numeric data and accessible summaries, not model-authored SVG.

The fixed icon catalog and trusted shell controls use selected 24 px outline paths from
[Heroicons](https://github.com/tailwindlabs/heroicons). Icons inherit `currentColor`, remain
legible at 16–20 px, and use consistent 1.5 px strokes. The model chooses only semantic names such
as `cpu`, `device`, or `warning`; it cannot provide SVG or path data. See
[third-party notices](../THIRD_PARTY_NOTICES.md).

Tables, repeaters, and timelines can opt into one exact-match allowlisted data-field filter backed
by a declared writable state path. Tables also support bounded server-side pagination
(5/10/25/50/100 rows); the paired `pagination` component uses the same data/filter declarations to
disable invalid page movement. Models cannot supply a predicate, callback, query language, or
arbitrary field name.

Table columns and key/value rows may select one renderer-owned display format: `text`, `number`,
`percent`, `status`, `datetime`, `temperature`, or `duration-ms`. These are fixed enum choices,
not user-defined format strings, expressions, or locale templates.

## Accessibility behavior

Trusted templates provide semantic headings, labels, tables/forms, visible focus treatment, and
native dialog behavior. The shell owns light/dark/system selection and reduced-motion behavior.
Model-authored plain text is escaped by Jinja and cannot select a template or safety filter.

For exact props and compatibility, query `GET /api/catalog`; it is generated from the same registry
the renderer and validator use.
