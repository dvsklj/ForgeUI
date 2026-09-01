# Package footprint

Measured from the locked Python 3.12 build on 24 August 2026:

| Boundary | Size |
| --- | ---: |
| ForgeUI wheel | 120,424 bytes (117.6 KiB) |
| Source distribution | about 225.7 KiB |
| Installed ForgeUI package (base imports) | about 0.8 MiB |
| Installed ForgeUI package (all imports/bytecode) | about 1.1 MiB |
| Cold base environment (`forgeui`) | about 10.3 MiB |
| Cold web environment (`forgeui[web]`) | about 30.7 MiB |
| Cold standalone environment (`forgeui[app]`) | about 33.4 MiB |
| CSS | 29,100 bytes raw / 5,713 bytes gzip |
| Dashboard JavaScript | 10,022 bytes raw / about 2.9 KiB gzip |
| Optional iframe host helper | 1,244 bytes raw / about 0.6 KiB gzip |

For a like-for-like published-runtime comparison, the legacy checkout's
`@nedast/forgeui-runtime` archive is 143,000 bytes (139.6 KiB) when measured with
`npm pack --dry-run`; the new complete Python wheel is about 16% smaller. The legacy catalog-only
archive is much smaller because it does not contain a renderer, web runtime, persistence, repair
loop, or browser assets, so it is not a comparable full-package target.

The local development checkout is much larger because `.venv` includes test, type-checking, and
browser tooling. That development environment is not copied into the wheel or source distribution.

The default wheel requires only Pydantic and Jinja2. FastAPI persistence, fixed HTTP sources,
Ollama transport, and standalone serving are optional `web`, `http`, `ollama`, and `serve` layers;
`app` installs the complete reference-service set. These environment figures are deliberately
pessimistic cold installs. In a typical FastAPI container, pip reuses compatible Pydantic and
Jinja2 packages already in the environment, so the incremental cost of core ForgeUI is principally
its 117.6 KiB wheel and roughly 0.8-1.1 MiB extracted package.

For a single dashboard card that receives trusted application data and calls `render_manifest`,
install only the base package. Use `web` when ForgeUI owns routes, revisions, or persistence; add
`ollama` only when ForgeUI calls Ollama itself. The `app` extra is for the optional standalone
reference application, not the normal embedding path.

The standalone runtime footprint was also reduced by using the standard library for the one-command
CLI and core Uvicorn instead of `uvicorn[standard]`. SQLAlchemy and Pydantic Core are the largest
packages in the full standalone environment. They support immutable revisions, validation, and
persistence, so replacing them would trade substantial correctness and maintenance cost for a
relatively small standalone-container saving.

Self-hosted assets are the default. CDN mode remains available for an existing HTMX/Tailwind host,
but ForgeUI's trusted CSS and JavaScript do not require a remote runtime. Responses larger than 500
bytes are gzip-compressed when the client supports it.

Contract tests enforce the following raw budgets:

- complete shipped source tree: at most 1 MiB;
- CSS: at most 32 KiB;
- dashboard JavaScript: at most 16 KiB;
- iframe host helper: at most 4 KiB;
- no Typer dependency or Uvicorn standard extras.

They also enforce gzip transfer budgets of 6 KiB for CSS, 4 KiB for dashboard JavaScript, and
1 KiB for the optional iframe helper. This keeps visual polish affordable without rewarding
source-level minification that would make the UI harder to maintain.

The post-build CI smoke test separately caps the compressed wheel at 128 KiB, then installs that
wheel into clean base, mounted-web, and complete environments. The current 117.6 KiB wheel uses
about 92% of that budget. New integrations should therefore stay optional and avoid vendored
client libraries or browser frameworks.

The Docker image size is not listed because it must be measured from an actual built image and the
local Docker daemon was unavailable. The multi-stage Dockerfile copies only the locked production
environment and `src/`; tests, documentation, examples, caches, and the development environment are
excluded from the build context or runtime layer.
