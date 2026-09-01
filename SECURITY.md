# Security policy

## Supported versions

ForgeUI is currently alpha software. Security fixes are applied to the newest published alpha;
older alphas are not maintained as separate supported branches.

## Reporting a vulnerability

Use GitHub's **Report a vulnerability** form in the repository Security tab. Do not open a public
issue for a suspected vulnerability and do not include credentials, production data, or private
endpoints in a report.

Include the affected version or commit, the violated security boundary, reproducible steps, and
the smallest safe proof of impact. Reports are evaluated against the guarantees documented in
[docs/security.md](docs/security.md).

The project will acknowledge a report through GitHub's private advisory channel, validate the
finding, prepare a fix and regression test, and coordinate disclosure appropriate to the impact.

## Scope

The manifest parser, validation and repair pipeline, renderer, state/action authorization,
capability and data-source registries, HTTP adapter, persistence boundaries, and web security
middleware are in scope. Vulnerabilities in a host application's own authentication, registered
handlers, model deployment, data sources, or infrastructure remain the host operator's
responsibility unless ForgeUI bypasses the documented boundary.
