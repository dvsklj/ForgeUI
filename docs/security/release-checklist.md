# Security Release Checklist

Run these checks before cutting `0.1.0` or publishing package artifacts:

- Install from the lockfile with `npm ci`.
- Run dependency audit with `npm run audit:deps`.
- Run code gates: `npm run typecheck`, `npm test`, `npm run build`, `npm run ci:size`, `npm run validate`, `npm run e2e`, and `npm run smoke:pack`.
- Confirm `NODE_ENV=production` deployments set `FORGEUI_API_TOKEN`; production writes must reject unauthenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests.
- When changing manifests, server writes, URL props, or schema rules, run the relevant validation and server-hardening tests.
- Treat stored manifests as untrusted input until `validateManifest()` passes.
- Record every unresolved dependency audit exception with package, advisory, owner, reason, and review date.
- Update the Google A2UI adapter only when A2UI behavior changes.
