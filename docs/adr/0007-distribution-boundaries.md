# 0007 — Distribution and integration package boundaries

## Decision

The public manifest kernel, catalog, validator, renderer, A2UI adapter, and optional runtime layers
remain one `forgeui` distribution and one repository. Third-party dependency sets are exposed as
pip extras. Company-specific contracts, sources, capabilities, authentication glue, and deployment
defaults live in a separate private distribution that explicitly depends on a compatible ForgeUI
minor version.

ForgeUI will not auto-discover integration packages. The host imports an integration package and
passes its frozen `RuntimeRegistries` to `mount_forgeui`.

## Consequences

Schema, prompt, renderer, and catalog releases cannot drift independently. Base installations stay
small because optional dependencies remain opt-in. Private endpoints and authorization code never
enter the public repository. Integrators must publish and pin their own wheel, and compatibility is
verified at the ordinary Python dependency and test boundaries.
