# Changelog

All notable changes to Forge UI are documented in this file. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and is pre-1.0 (minor versions may contain breaking changes).

## [Unreleased]

## [0.1.0] — 2026-04-17

Initial public release.

### Security
- XSS hardening: property-bound attribute rendering prevents HTML attribute injection. See `docs/security/2026-04-xss-repro.md` for the reproduction that motivated the fix.
- Prototype pollution defense in PATCH: manifest patches reject `__proto__`, `prototype`, and `constructor` keys at parse time, before any merge happens.
- Schema strictness: `additionalProperties: false` at every level of the manifest JSON Schema (top-level, `schema`, `elements[id]`, `dataAccess`). Previously `additionalProperties: true` at the top allowed arbitrary keys through validation.
- `VALID_APP_ID` regex enforced on all six app-id endpoints.
- Content Security Policy with per-request nonce on rendered app pages.
- Server middleware: CORS allowlist (`FORGEUI_CORS_ORIGINS`), body size limit (`FORGEUI_MAX_BODY_BYTES`, default 1 MB), query-param clamping on LIST, optional Bearer-token auth (`FORGEUI_API_TOKEN`) on writes, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on `/api/*`.
- Transactional PATCH: validation now happens **before** database write; invalid merged manifests no longer touch disk.
- All 31 WCAG 2.1 AA findings from the 2026-04 core-components audit resolved (8 P0, 19 P1, 4 P2).

### Added
- WCAG 2.1 AA baseline across all 19 core components. Highlights: Dialog focus trap + Escape + `role="dialog"`+`aria-modal`; Toggle as `<button role="switch">` with keyboard + `aria-checked`; Alert/Error live regions (`role="alert"` / `role="status"` by variant); Progress `role="progressbar"` + `aria-valuenow/min/max`; label/input linkage across all form inputs; `prefers-reduced-motion` respected.
- `extractManifest(rawText)` helper — strips Markdown code fences from LLM output for direct piping into `JSON.parse` → `validateManifest`.
- Type declarations (`.d.ts`) emitted for `@forgeui/runtime`, `@forgeui/server`, and `@forgeui/catalog`.
- Server library split: `@forgeui/server` now exports `createForgeUIServer` as an importable library (`dist/forgeui-server.js`) alongside the CLI runner (`dist/forgeui-cli.js`).
- Gauntlet harness: 50-archetype LLM manifest generation test (`npm run gauntlet`).
- Tabs: arrow-key navigation with roving tabindex and `aria-controls`/`aria-labelledby` linkage.
- Button: optional `aria-pressed` for toggle-state buttons.
- Text: heading variants render semantic `<h1>`/`<h2>`/`<h3>`.
- Table: row-action rows are keyboard-activatable.
- Renderer fault tolerance: per-element `try`/`catch` falls back to `<forgeui-error>`; `setItemContext` wrapped in `try`/`finally` to prevent module-global leaks on child-render failure.
- GitHub Actions CI gate: typecheck, tests, build, and bundle-size ratchet on every PR.
- MIT LICENSE.
- Expression engine audit (`docs/security/2026-04-expression-audit.md`) — grammar documentation and pathological-input corpus.
- Expression engine fuzz harness — 30-case corpus plus seeded 1000-iteration generative fuzz across `$state:`, `$computed:`, `$expr:`, `$item:`.
- Per-IP token-bucket rate limiting on `/api/*` — `FORGEUI_RATE_LIMIT_RPM`, `FORGEUI_RATE_LIMIT_BURST`, `FORGEUI_RATE_LIMIT_DISABLE`.
- Request body size cap — `FORGEUI_MAX_BODY_BYTES` (default 1 MB), enforced at both Content-Length precheck and streaming.
- `FORGEUI_TRUST_PROXY` env var gating `X-Forwarded-For` / `X-Real-IP` honoring.
- Table `caption` prop renders `<caption>` as first child of `<table>`.
- `--forgeui-color-chart-6` through `--forgeui-color-chart-10` design tokens; Chart palette no longer uses hardcoded hex for slots 6–10.

### Changed
- **Bundle size (IIFE gzip):** ~95 KB → ~47 KB. Roughly half the size.
  - Zod removed from runtime path (was leaking via catalog re-exports). Zod remains the build-time source of truth; runtime ships pre-generated JSON.
  - Ajv compiler removed via standalone precompilation. `validateManifest()` now runs a precompiled validator — also faster per call.
- npm scope renamed from `@forge` to `@forgeui` (Atlassian owns `@forge`). Affects `@forgeui/runtime`, `@forgeui/catalog`, `@forgeui/connect`, `@forgeui/server`. Runtime identifiers (`ForgeUIApp`, `<forgeui-app>`, `forge-` tag prefix, `FORGE_*` env vars, `--forge-*` CSS props, `forge` CLI binary) unchanged.

### Fixed
- PATCH endpoint was silently returning 400 while writing to the database — `validateManifest()` was called on the wrong object. Invalid PATCH responses now reflect reality.
- `evaluateVisibility()` now fails-visible on malformed `$when` conditions instead of throwing.
- Prototype-chain property access (`__proto__`, `prototype`, `constructor`) rejected in `$item:` and `$expr:` paths.
- Nested `{{ }}` substitution no longer produces malformed output; unbalanced delimiters leave literal text.
- Object-form refs (`{ $expr: 'item.name' }`) resolve recursively instead of being passed through as objects.
- Unicode-normalized (NFC) path segments checked against forbidden-name set, closing `__\u0070roto__`-shaped bypasses.
- Unclosed quote literals in `$expr:` / `$computed:` rejected instead of silently mis-parsed.
- `$computed:` / `$expr:` / substitution-template length caps (1024 / 1024 / 4096 chars) prevent pathological-input DoS.
- `$state:` refs validated against manifest state section at validation time (warn-level).

### Internal
- 194-test Vitest suite covering XSS defense, prototype-pollution resistance, patch endpoint integration, server hardening, renderer robustness, CSP headers, and a11y across all 19 core components.
- ADR 0001: Ring 2 interfaces land in OSS first.
- Dead code removed: `src/validation/migration.ts`, `src/catalog/schema-utils.ts`, `src/catalog/schemas/index.ts`.
- Stale `ajv` dependency removed from `@forgeui/catalog`.
- `.gitignore` tightened.
- `README.md` rewritten for pre-release audience.

[Unreleased]: https://github.com/dvsklj/ForgeUI/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/dvsklj/ForgeUI/releases/tag/v0.1.0
