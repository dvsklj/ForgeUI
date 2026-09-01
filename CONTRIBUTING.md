# Contributing

ForgeUI keeps its manifest and rendering boundary deliberately narrow. Before proposing a change,
read [the architecture](docs/architecture.md), [manifest contract](docs/manifest.md), and
[security boundaries](docs/security.md).

## Development

```bash
uv sync --frozen --all-extras
uv run ruff format --check .
uv run ruff check .
uv run mypy src/forgeui
uv run pytest -q --cov=forgeui --cov-fail-under=85
uv build
uv run twine check dist/*
```

Changes to a component must keep its catalog entry, strict Pydantic props, generated schema and
prompt documentation, renderer template, examples, and tests synchronized. New model-controlled
HTML, CSS, classes, URLs, paths, executable expressions, or generic transport capabilities are not
accepted.

Use focused tests while developing and run the full suite before opening a pull request. Live
Ollama, browser, and Docker checks have explicit markers because they require external runtimes.

Report security issues privately as described in [SECURITY.md](SECURITY.md).
