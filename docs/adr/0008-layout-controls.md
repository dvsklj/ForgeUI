# 0008 — Typed responsive layout controls

Status: accepted

ForgeUI layout is declarative, but a model-generated manifest must remain portable across a full
dashboard, a nested embed, a standalone document, and an inert HTML export. The model therefore
chooses semantic catalog values while the renderer owns CSS implementation and responsive behavior.

`grid.columns` keeps the numeric 1-4 presets and adds `auto` with a trusted minimum card width.
An alternate `responsive` object selects bounded small/medium/large counts at container-query
breakpoints. These modes are mutually exclusive. `grid-item` supplies bounded column and row spans;
auto-fit grids require a one-column span because their track count changes with width. Ratios are
equal, first-main 2:1, or second-main 2:1, and are valid only for one- or two-column compositions.

Spacing, padding, density, alignment, and equal-height behavior are enum tokens. Cards can use
ordered header/body/footer slots, and `content-group` gives one child a semantic description or
caption relationship. `disclosure` is native `<details>` markup with no action runtime, so browser
keyboard support remains available in static exports.

Validation rejects invalid parentage, slot order, spans, and ambiguous grid combinations. It emits a
warning for wrappers proven to have no potentially visible content while preserving valid rendering
for data-driven visibility. A separate `forgeui-layout.css` asset carries these optional styles;
the core stylesheet remains within its existing footprint budget, and all surfaces load the same
trusted layout implementation.

The model cannot provide classes, CSS, breakpoint maps, arbitrary sizes, HTML, or executable layout
expressions. Future drag-and-drop coordinates, masonry algorithms, and user-authored breakpoints
require a separate contract and accessibility review.
