# Portable integration review and implementation plan

The proposal's intent/host boundary is accepted. ForgeUI remains one synchronized Python
package and `forgeui/1` remains declarative JSON. Existing extras already isolate web,
HTTP and model-provider dependencies; existing runtime registries already freeze host authority.

This release implements a persistence-free renderer protocol and HTML adapter with capability
checks, structured issues, interaction modes and asset identifiers; common bounded row filtering;
filtered sample KPI aggregates; formatted authoritative metrics with absolute comparisons;
and structured, deterministic flowcharts with safe Mermaid interchange.

See [analytics authoring](analytics.md) for generic data-provider examples.

Deferred: React/native implementations, arbitrary component extension registration, manifest
requirements syntax, localization beyond the existing locale, distributed state/job adapters,
asset/theme plugins, and a TypeScript SDK. These need conformance designs before broadening the
public contract. Existing global catalog is closed and immutable; runtime source/capability
registries remain instance scoped. Do not claim these deferred features are implemented.

Verification covers semantic and schema validation, every catalog renderer, filtering and numeric
edge cases, Mermaid rejection/correction, host authorization, and browser light/dark/mobile views.
Release gates are lint, formatting, typing, Bandit, test coverage, wheel checks and CI before PyPI.
