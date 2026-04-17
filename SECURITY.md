# Security Policy

## Supported Versions

Forge UI is at version 0.1.x. Until 1.0, only the latest minor release receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

**Do not open a public issue for security reports.**

Use one of these private channels:

1. **Preferred — GitHub Private Vulnerability Reporting:** <https://github.com/dvsklj/ForgeUI/security/advisories/new>
2. **Email:** davor.skulj@gmail.com with subject line `[forgeui-security]`

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
- The published IIFE artifact at `dist/forge.js`

Out of scope:
- Vulnerabilities in dependencies with upstream fixes — please report to the dependency first and send us the CVE link
- Issues that require the attacker to already have write access to a trusted manifest (we assume manifest authors are trusted; the attack surface is *rendering* untrusted manifests, not authoring them)
- Denial-of-service via resource exhaustion in self-hosted `@forge/server` deployments (operators should rate-limit at their edge)

## Known hardening work

See `SECURITY-REVIEW.md` for a current internal audit. Public vulnerability advisories live under GitHub Security → Advisories.
