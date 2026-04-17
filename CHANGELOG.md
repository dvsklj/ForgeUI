# Changelog

All notable changes to Forge UI are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and is pre-1.0 (minor versions may contain breaking changes).

## [Unreleased]

## [0.1.0] — UNRELEASED

Initial public release.

### Security
- XSS hardening: property-bound attribute rendering prevents HTML attribute injection. See `docs/security/2026-04-xss-repro.md` for the reproduction that motivated the fix.
- Prototype pollution defense in PATCH: manifest patches reject `__proto__`, `prototype`, and `constructor` keys at parse time, before any merge happens.
- `VALID_APP_ID` regex enforced on all six app-id endpoints.
- Content Security Policy with per-request nonce on rendered app pages.
- Server middleware: CORS allowlist (`FORGE_CORS_ORIGINS`), body size limit (`FORGE_MAX_BODY_BYTES`, default 1 MB), query-param clamping on LIST, optional Bearer-token auth (`FORGE_API_TOKEN`) on writes, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on `/api/*`.
- Transactional PATCH: validation now happens **before** database write; invalid merged manifests no longer touch disk.

### Added
- WCAG 2.1 AA baseline across all 19 core components. Highlights: Dialog focus trap + Escape + `role="dialog"`+`aria-modal`; Toggle as `<button role="switch">` with keyboard + `aria-checked`; Alert/Error live regions (`role="alert"` / `role="status"` by variant); Progress `role="progressbar"` + `aria-valuenow/min/max`; label/input linkage across all form inputs; `prefers-reduced-motion` respected.
- Tabs: arrow-key navigation with roving tabindex and `aria-controls`/`aria-labelledby` linkage.
- Button: optional `aria-pressed` for toggle-state buttons.
- Text: heading variants render semantic `<h1>`/`<h2>`/`<h3>`.
- Table: row-action rows are keyboard-activatable.
- Renderer fault tolerance: per-element `try`/`catch` falls back to `<forge-error>`; `setItemContext` wrapped in `try`/`finally` to prevent module-global leaks on child-render failure.
- GitHub Actions CI gate: typecheck, tests, build, and bundle-size ratchet on every PR.
- MIT LICENSE.

### Changed
- **Bundle size (IIFE gzip):** ~95 KB → ~47 KB. Roughly half the size.
  - Zod removed from runtime path (was leaking via catalog re-exports). Zod remains the build-time source of truth; runtime ships pre-generated JSON.
  - Ajv compiler removed via standalone precompilation. `validateManifest()` now runs a precompiled validator — also faster per call.

### Fixed
- PATCH endpoint was silently returning 400 while writing to the database — `validateManifest()` was called on the wrong object. Invalid PATCH responses now reflect reality.
- `evaluateVisibility()` now fails-visible on malformed `$when` conditions instead of throwing.

### Internal
- 108-test Vitest suite covering XSS defense, prototype-pollution resistance, patch endpoint integration, server hardening, renderer robustness, CSP headers, and a11y across all 19 core components.
- ADR 0001: Ring 2 interfaces land in OSS first.

[Unreleased]: https://github.com/dvsklj/ForgeUI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dvsklj/ForgeUI/releases/tag/v0.1.0
