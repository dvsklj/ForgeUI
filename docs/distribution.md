# Distribution and private integration packages

ForgeUI is one public Python distribution with dependency extras. Keeping the manifest contract,
component catalog, Pydantic models, JSON Schema, renderer dispatch, and model prompt in one release
prevents version skew. Extras change installed third-party dependencies; they do not create
separately versioned copies of ForgeUI.

## Installation choices

Install the smallest layer needed by the host:

```bash
python -m pip install forgeui
python -m pip install 'forgeui[web]'
python -m pip install 'forgeui[web,http]'
python -m pip install 'forgeui[web,ollama]'
python -m pip install 'forgeui[app]'
```

The base package contains the strict manifest, validation, Google A2UI adapter, component catalog,
and renderer. `web` adds the mountable FastAPI runtime and persistence, `http` adds the fixed remote
JSON adapter, `ollama` adds the Ollama transport, and `app` installs the complete reference service.

Pin a compatible minor line in applications rather than installing an unconstrained latest
version:

```text
forgeui[web,ollama]>=0.1,<0.2
```

With uv:

```bash
uv add 'forgeui[web,ollama]>=0.1,<0.2'
```

## Publishing public releases to PyPI

The `publish.yml` workflow builds and tests a release, enforces the 128 KiB wheel budget, uploads
the verified artifacts between isolated jobs, and publishes with short-lived GitHub OIDC
credentials. It contains no PyPI API token.

One-time maintainer setup:

1. Enable MFA on the maintainer's PyPI account.
2. In PyPI's pending Trusted Publisher form, register project `forgeui`, owner `dvsklj`, repository
   `ForgeUI`, workflow `publish.yml`, and environment `pypi`.
3. Create a GitHub environment named `pypi` and require a maintainer's deployment approval.
4. Protect `main` and release tags so the publishing workflow cannot be changed by an unreviewed
   contribution.

For each release:

1. Update `project.version` in `pyproject.toml` and the source-checkout fallback in
   `src/forgeui/__init__.py`.
2. Merge the tested change to `main`.
3. Create a GitHub release whose tag is exactly `v<project.version>`, such as `v0.1.0`.
4. Approve the `pypi` deployment after the build job passes.

The workflow rejects a tag whose version does not match `pyproject.toml`. Once published, users
install the release with ordinary pip commands; no GitHub access is needed.

At the time this guide was written, PyPI's JSON endpoint returned no existing `forgeui` project.
That is not a permanent reservation: configure the pending publisher before the first release and
confirm the name again immediately before publishing.

## Installing before the first PyPI release

Pip can install directly from a Git tag:

```bash
python -m pip install 'forgeui[web] @ git+https://github.com/dvsklj/ForgeUI.git@v0.1.0'
```

For reproducible containers, build once and copy the wheel into the image:

```bash
uv build
python -m pip install 'dist/forgeui-0.1.0-py3-none-any.whl[web,ollama]'
```

```dockerfile
COPY dist/forgeui-0.1.0-py3-none-any.whl /tmp/forgeui.whl
RUN python -m pip install --no-cache-dir '/tmp/forgeui.whl[web,ollama]'
```

A release asset or internal artifact registry is preferable to building from Git inside every
production image because it provides one immutable, auditable wheel.

## The private work package

Company-specific code belongs in a separate private distribution, suggested name
`forgeui-work`. It should contain only host-owned integration code:

- strict Pydantic data contracts and allowlisted expression paths;
- adapters to existing typed services or fixed endpoints;
- tenant and role authorizers;
- narrowly scoped capability handlers;
- company deployment defaults and optional trusted presentation assets.

It must not fork the ForgeUI manifest schema, renderer, catalog, or prompt. The host imports its
runtime explicitly:

```python
from fastapi import FastAPI
from forgeui.app import mount_forgeui
from forgeui.config import Settings
from forgeui.sources import SourceContext
from forgeui_work import build_runtime


def load_latest(context: SourceContext) -> object:
    return work_report_service.latest_for_tenant(context.principal.tenant_id)


def authorize(context: SourceContext) -> bool:
    return context.principal.authenticated and context.principal.tenant_id is not None


app = FastAPI()
runtime = build_runtime(load_latest=load_latest, authorize=authorize)
mount_forgeui(app, "/forgeui", settings=Settings(), runtime=runtime)
```

Explicit construction is intentional. ForgeUI does not auto-discover installed plugins or grant
authority through package entry points.

### Private pip delivery

The simplest option for a private GitHub repository is a pinned Git dependency:

```text
forgeui-work @ git+ssh://git@github.com/<your-organization>/forgeui-work.git@<commit-sha>
```

For Docker BuildKit, use an SSH mount so credentials never enter an image layer:

```dockerfile
# syntax=docker/dockerfile:1.7
RUN --mount=type=ssh \
    python -m pip install \
    'forgeui-work @ git+ssh://git@github.com/<your-organization>/forgeui-work.git@<commit-sha>'
```

For teams and CI, publish the private wheel to an authenticated package index such as GitHub
Packages, an internal PEP 503 index, Artifactory, or cloud artifact storage, then use an index URL
configured outside source control:

```bash
python -m pip install --extra-index-url "$COMPANY_PYPI_URL" 'forgeui-work==0.1.0'
```

Avoid placing index passwords in `requirements.txt`, Dockerfiles, or pip command history. Prefer a
CI secret mount, workload identity, or a short-lived package token. Give the internal distribution
a company-specific name and reserve that name publicly when feasible to reduce dependency-confusion
risk. If the private package depends on an unpublished ForgeUI version, serve both wheels from the
same authenticated index or install the pinned ForgeUI wheel first.
