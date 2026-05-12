# Security Policy

## Supported versions

Forge UI is at version 0.1.x. Until 1.0, only the latest minor release receives security fixes.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x: |

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Use GitHub's private reporting flow:

- **GitHub Private Vulnerability Reporting:** <https://github.com/dvsklj/ForgeUI/security/advisories/new>

Include:

- A description of the vulnerability and its impact.
- Steps to reproduce, ideally with a minimal manifest or HTTP request.
- Affected version(s) and environment: browser, Node, server, connector, etc.
- Your suggested severity: low, medium, high, critical. Optional but helpful.

### Response expectations

| Stage | Target |
| ----- | ------ |
| Acknowledgement of report | 72 hours |
| Initial assessment and triage | 7 days |
| Fix or mitigation for confirmed high/critical issues | 30 days |
| Public disclosure via GitHub advisory | After fix is released |

These are targets, not guarantees — Forge UI is maintained by a single developer in spare time. For critical issues, please allow a reasonable window before any public disclosure.

## Scope

In scope for security reports:

- `src/validation/` — manifest validation, URL checks, injection defenses, patch validation.
- `src/renderer/` — Lit-based manifest rendering and static component dispatch.
- `src/server/` — HTTP API, SQLite persistence, CORS, auth, body limits, rate limiting, CSP.
- `src/connect/` — MCP stdio server and untrusted JSON-RPC/tool input.
- `src/state/` — state path resolution, expression evaluation, and declarative actions.
- `src/runtime/` — `<forgeui-app>` lifecycle, persistence, undo/redo, manifest initialization.
- Published runtime artifacts such as `dist/forgeui.js`.

Out of scope:

- Vulnerabilities in dependencies with upstream fixes — report to the dependency first and send us the CVE/advisory link.
- Issues that require the attacker to already have write access to a trusted manifest, unless rendering that manifest can escape Forge's documented constraints.
- Denial-of-service via intentionally expensive self-hosted deployments without operator rate limiting or resource controls.

## Known limitations

Component-specific prop validation is not exhaustively enforced by the manifest-level JSON Schema. The schema leaves `element.props` open because prop shapes vary per component type.

Server write paths differ today:

- `POST /api/apps` checks JSON/body size and the app ID format, but it does **not** run full `validateManifest()` before writing.
- `PUT /api/apps/:id` validates the full replacement manifest before writing.
- `PATCH /api/apps/:id` validates the patch envelope, merges it, validates the merged manifest, and writes only if validation passes.

The browser runtime always validates before normal rendering and shows validation errors instead of silently rendering invalid manifests.

When `FORGEUI_API_TOKEN` is unset, server write routes are unauthenticated. If `NODE_ENV=production` and no token is configured, the current server logs a warning but does not reject writes. Public deployments should set `FORGEUI_API_TOKEN` and enforce TLS at the reverse proxy or hosting layer.

Ring 2 operators deploying `@nedast/forgeui-server` as a multi-tenant service should treat manifest writes as trusted input at render time, not as fully sanitized content at store time. A malformed props object should render as an error state in the browser rather than crash the runtime, but it may persist in the database until overwritten.

Hosted app pages allow broad image sources (`img-src * data: blob:`) for compatibility. Tighten this with a reverse proxy or a downstream fork if your deployment needs stricter image-source policy.

## Public advisories

Disclosed vulnerabilities live under GitHub Security → Advisories on this repository.
