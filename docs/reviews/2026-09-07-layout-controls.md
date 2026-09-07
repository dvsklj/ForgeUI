# ForgeUI 0.1.0a5 layout-controls review

This review covers the requested reusable layout controls for responsive grids, flexible sizing,
spacing/alignment, content grouping, passive disclosure, and pre-render diagnostics.

## Decision and implementation

The manifest boundary remains a flat, strict JSON graph. The catalog now exposes 54 typed entries:

- `grid` accepts numeric presets or `auto` with a bounded minimum item width, or a mutually
  exclusive small/medium/large responsive count map. `grid-item` provides bounded column and row
  spans. Equal, first-main 2:1, and second-main 2:1 ratios are predefined renderer tokens.
- `gap_x`, `gap_y`, `padding`, density, alignment, and equal-height behavior map to trusted CSS
  classes. Numeric spans clamp when a responsive grid collapses; auto-fit grids require span 1.
- `card-header`, `card-body`, and `card-footer` provide ordered slots. `content-group` associates
  a description/caption with exactly one child through semantic figure markup and ARIA description.
- `disclosure` uses native `<details>/<summary>` markup with title, optional summary, nested
  children, and initial `expanded` state. It has no action field or runtime dependency.
- Layout validation emits actionable parent, slot, span, and empty-layout diagnostics. Provably
  empty wrappers are warnings so valid data-driven layouts can still render; structural errors
  remain blocking before persistence or rendering.

The layout extension is shipped as `forgeui-layout.css`, loaded after the core stylesheet by the
trusted document shell and advertised by the portable renderer. Container queries make nested
fragments respond to their own available width. Static exports retain the same semantic markup and
layout styles while disabling state and action runtimes.

## Security and compatibility

All new values are strict Pydantic enums or bounded integers and are reflected automatically in JSON
Schema and prompt documentation. Models cannot supply CSS, HTML, arbitrary sizes, breakpoint maps,
grid formulas, URLs, or executable expressions. Existing numeric grids, default gaps, profiles,
and manifests remain compatible. Older ForgeUI versions reject manifests that use the new catalog
entries, as expected for a manifest-contract extension.

## Verification

- `uv sync --frozen --all-extras` — passed.
- `uv run ruff format --check .`, `uv run ruff check .`, `uv run mypy src/forgeui`, and
  `uv run bandit -q -r src/forgeui` — passed.
- `uv run pytest -q -m "not browser and not docker and not ollama" --cov=forgeui` — passed;
  497 tests, 89.50% total coverage.
- `uv run pytest -q -m browser` — passed; Chromium covers auto-fit reflow, nested container
  queries, spans/ratios, density and gaps, equal-height cards, fragments, static exports,
  standalone pages, light/dark themes, reduced motion, and keyboard disclosure toggling.
- Core `forgeui.css` remains 32,726 bytes raw and 6,136 bytes gzip, within the existing budgets.
  The separate typed layout asset is 5,797 bytes raw and about 1.3 KiB gzip.
- `git diff --check` — passed.

The existing Starlette/httpx test-client deprecation warning remains. Firefox/WebKit, live Ollama,
and a production PyPI Trusted Publishing run are outside this local verification.
