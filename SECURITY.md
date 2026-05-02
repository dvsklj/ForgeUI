# Security Policy

## Supported Versions

Forge UI is at version 0.1.x. Until 1.0, only the latest minor release receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

**Do not open a public issue for security reports.**

Use GitHub's private reporting flow:

- **GitHub Private Vulnerability Reporting:** <https://github.com/dvsklj/ForgeUI/security/advisories/new>

Include:
- A description of the vulnerability and its impact
- Steps to reproduce (a minimal manifest or HTTP request if applicable)
- Affected version(s) and environment (browser / Node / etc.)
- Your suggested severity (low / medium / high / critical) — optional but helpful

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
- `src/validation/` — manifest validation, URL allowlisting, injection defenses
- `src/renderer/` — Lit-based manifest rendering (XSS surface)
- `src/server/` — HTTP API, SQLite persistence, middleware (CORS, auth, body limits)
- `src/connect/` — MCP stdio server (untrusted JSON-RPC input)
- `src/state/` — state path resolution, expression evaluation
- The published IIFE artifact at `dist/forgeui.js`

Out of scope:
- Vulnerabilities in dependencies with upstream fixes — please report to the dependency first and send us the CVE link
- Issues that require the attacker to already have write access to a trusted manifest (we assume manifest authors are trusted; the attack surface is *rendering* untrusted manifests, not authoring them)
- Denial-of-service via resource exhaustion in self-hosted `@nedast/forgeui-server` deployments (operators should rate-limit at their edge)

## Known limitations

Per-component prop validation runs client-side (Zod, at render time), not on the server. The manifest-level JSON Schema leaves `element.props` open because prop shapes vary per component type — a Text element has different valid props than a Table element, and enumerating all permutations in a single JSON Schema is impractical.

Ring 2 operators deploying `@nedast/forgeui-server` as a multi-tenant service should treat manifest writes as trusted input at render time, not at store time. The server validates the manifest envelope (structure, element types, required fields, URL safety, injection patterns) but not component-specific prop contents. A malformed props object renders as an error state in the browser, not a crash, but it will persist in the database until overwritten by a valid manifest.

## Public advisories

Disclosed vulnerabilities live under GitHub Security → Advisories on this repository.
