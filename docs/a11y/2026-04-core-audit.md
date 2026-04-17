# A11y audit — Core 19 components (2026-04)

## Executive summary

Of the 19 core-tier components, **zero pass all applicable checks**. The strongest performers are passive layout primitives (Stack, Grid, Card) and the well-built Button, which only misses `prefers-reduced-motion` and toggle-state ARIA. The worst offenders are **Dialog** (0/9 — no role, no focus trap, no keyboard dismiss, no aria-modal), **Toggle** (0/9 — renders a `<div>` with no keyboard access, no ARIA, no focus indicator), and **Alert** (1/9 — missing `role="alert"` despite being the canonical live-region component). A pervasive pattern is `<label>` elements rendered without `for`/`id` linkage, affecting all five form-input components. Every component that animates (Tabs, Progress, Button, Chart, Toggle) lacks `prefers-reduced-motion` respect.

## Methodology

- **Standard:** WCAG 2.1 AA (not 2.2, matching the project's stated target).
- **Checklist:** Nine items per component (see task description).
- **Method:** Source-read only. No runtime, browser, or screen-reader testing.
- **Contrast proxy:** Graded at the design-token level. Components using `var(--forgeui-color-*)` tokens throughout receive PASS; components mixing tokens with hardcoded hex literals receive PARTIAL. Real contrast verification requires rendered output against a specific theme.
- **N/A policy:** Items that structurally cannot apply (e.g., focus management on a passive text container) are graded N/A. If the item *should* apply but is missing, it is FAIL, not N/A.

## Per-component results

---

### Stack
**Status:** 2/2 applicable items pass, 0 fail.
- Lines: `src/components/index.ts:L15–L53`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | N/A | Pure layout container; no role needed |
| 2 | Keyboard operable | N/A | Passive layout |
| 3 | Focus visible | N/A | No focusable elements |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | N/A | Not stateful |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All spacing via `var(--forgeui-space-*); no hardcoded colors |

---

### Grid
**Status:** 2/2 applicable items pass, 0 fail.
- Lines: `src/components/index.ts:L56–L83`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | N/A | Pure layout container |
| 2 | Keyboard operable | N/A | Passive layout |
| 3 | Focus visible | N/A | No focusable elements |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | N/A | Not stateful |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All values via design tokens |

---

### Card
**Status:** 2/2 applicable items pass, 0 fail.
- Lines: `src/components/index.ts:L86–L116`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | N/A | Passive container; no semantic role required |
| 2 | Keyboard operable | N/A | Passive display |
| 3 | Focus visible | N/A | No focusable elements |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | N/A | Not stateful |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All colors via `var(--forgeui-color-*); all spacing via tokens |

---

### Tabs
**Status:** 2/6 applicable items pass, 3 fail, 1 partial.
- Lines: `src/components/index.ts:L137–L193`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | `role="tablist"` on container (L180), `role="tab"` on each button (L185), `role="tabpanel"` on panel (L189) |
| 2 | Keyboard operable | FAIL | No arrow-key handler (`@keydown`). Tab buttons are native `<button>` so Enter/Space work, but WAI-ARIA tab pattern requires arrow navigation between tabs |
| 3 | Focus visible | PASS | `.tab` CSS at L147 does not set `outline:none`; native `<button>` focus ring is preserved |
| 4 | Focus management | FAIL | No `aria-controls` on tab buttons linking to tabpanel. No `aria-labelledby` on tabpanel linking back. No arrow-key focus movement |
| 5 | Labels | PASS | Tab labels from `items` prop via `_itemLabel()` |
| 6 | State exposed | PARTIAL | `aria-selected` is set correctly (L185), but `aria-controls` is absent and tabpanel has no `aria-labelledby` |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | FAIL | `.tab` has `transition:var(--forgeui-transition-fast)` at L149 with no `@media (prefers-reduced-motion: reduce)` override |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### Text
**Status:** 1/2 applicable items pass, 1 fail.
- Lines: `src/components/index.ts:L265–L319`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | FAIL | All variants render `<div>` (L316). Heading variants (heading1, heading2, heading3) should render `<h1>`–`<h3>` for correct document outline. Screen readers cannot determine heading levels from `<div class="heading1">` |
| 2 | Keyboard operable | N/A | Passive text |
| 3 | Focus visible | N/A | Not focusable |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | N/A | Not stateful |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens; inline styles use token map at L297–305 |

---

### Badge
**Status:** 1/1 applicable items pass, 0 fail.
- Lines: `src/components/index.ts:L361–L377`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | N/A | Passive inline display element |
| 2 | Keyboard operable | N/A | Passive |
| 3 | Focus visible | N/A | Not focusable |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | N/A | Not stateful |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### TextInput
**Status:** 5/7 applicable items pass, 2 fail.
- Lines: `src/components/index.ts:L418–L451`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | Renders native `<input>` or `<textarea>` (L442–444) |
| 2 | Keyboard operable | PASS | Native `<input>` and `<textarea>` are keyboard operable |
| 3 | Focus visible | PASS | `box-shadow:0 0 0 3px var(--forgeui-color-primary-subtle)` on `:focus` at L426 provides a visible indicator (replaces outline) |
| 4 | Focus management | N/A | Passive input — no open/close lifecycle |
| 5 | Labels | FAIL | `<label>` rendered at L441 without `for` attribute. No `id` on the input. No `aria-label` or `aria-labelledby`. The label is visually adjacent but not programmatically associated |
| 6 | State exposed | N/A | Not a stateful component in the ARIA sense |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | PASS | `transition:border-color` at L425 is minimal; no animation |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### NumberInput
**Status:** 5/7 applicable items pass, 2 fail.
- Lines: `src/components/index.ts:L453–L475`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | Renders native `<input type="number">` (L470) |
| 2 | Keyboard operable | PASS | Native number input is keyboard operable |
| 3 | Focus visible | PASS | `box-shadow:0 0 0 3px` on `:focus` at L460 |
| 4 | Focus management | N/A | Passive input |
| 5 | Labels | FAIL | `<label>` at L469 without `for` attribute. No `id` on input. No `aria-label`/`aria-labelledby` |
| 6 | State exposed | N/A | Not stateful in ARIA sense |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | PASS | No transitions or animations |
| 9 | Color contrast (tokens) | PASS | All colors via tokens |

---

### Select
**Status:** 5/7 applicable items pass, 2 fail.
- Lines: `src/components/index.ts:L477–L500`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | Renders native `<select>` with `<option>` children (L492–496) |
| 2 | Keyboard operable | PASS | Native `<select>` is keyboard operable |
| 3 | Focus visible | PASS | `box-shadow:0 0 0 3px` on `:focus` at L484 |
| 4 | Focus management | N/A | Passive input |
| 5 | Labels | FAIL | `<label>` at L491 without `for` attribute. No `id` on select. No `aria-label`/`aria-labelledby` |
| 6 | State exposed | N/A | Not stateful in ARIA sense |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | PASS | No transitions or animations |
| 9 | Color contrast (tokens) | PASS | All colors via tokens |

---

### Toggle
**Status:** 0/8 applicable items pass, 8 fail.
- Lines: `src/components/index.ts:L543–L563`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | FAIL | Renders `<div class="switch">` (L558) — not a `<button>`, not `role="switch"`. Purely decorative `<div>` with a click handler |
| 2 | Keyboard operable | FAIL | `<div>` is not in the tab order. No `tabindex`. No `@keydown` for Enter/Space. Completely inaccessible via keyboard |
| 3 | Focus visible | FAIL | No `:focus` or `:focus-visible` styles on `.switch`. No focus indicator at all |
| 4 | Focus management | N/A | No open/close lifecycle, but keyboard-inaccessible so N/A is generous |
| 5 | Labels | FAIL | `<label>` at L559 without `for` attribute. The `<div>` switch has no accessible name |
| 6 | State exposed | FAIL | No `role="switch"`, no `aria-checked`. State is conveyed only visually via the `[on]` attribute |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | FAIL | `.switch` and `.switch::after` both have `transition:var(--forgeui-transition-fast)` at L547, L551 with no reduced-motion override |
| 9 | Color contrast (tokens) | PARTIAL | Track uses `var(--forgeui-color-border-strong)` (token), but knob is `background:white` (hardcoded at L550). Tokens used for most colors |

---

### Checkbox
**Status:** 6/7 applicable items pass, 1 fail.
- Lines: `src/components/index.ts:L526–L541`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | Renders native `<input type="checkbox">` (L536) |
| 2 | Keyboard operable | PASS | Native checkbox is keyboard operable (Space) |
| 3 | Focus visible | PASS | Native input focus ring; `accent-color` does not suppress outline |
| 4 | Focus management | N/A | Passive input |
| 5 | Labels | FAIL | `<label>` at L537 without `for` attribute. The `<label>` comes after the `<input>` and is not wrapping it, so implicit association does not apply. No `aria-label`/`aria-labelledby` |
| 6 | State exposed | PASS | Native `<input type="checkbox">` exposes `checked` state natively |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | PASS | No animations |
| 9 | Color contrast (tokens) | PASS | `accent-color:var(--forgeui-color-primary)` at L529 |

---

### Button
**Status:** 6/8 applicable items pass, 2 fail.
- Lines: `src/components/index.ts:L638–L666`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | Renders native `<button>` (L663) |
| 2 | Keyboard operable | PASS | Native button provides Enter/Space |
| 3 | Focus visible | PASS | Explicit `button:focus-visible { outline:2px solid var(--forgeui-color-primary); outline-offset:2px; }` at L645 |
| 4 | Focus management | N/A | No open/close lifecycle |
| 5 | Labels | PASS | Text from `label` prop or slotted content (L663) |
| 6 | State exposed | PARTIAL | No `aria-pressed` support. If used as a toggle button, pressed state is not conveyed to assistive technology |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | FAIL | `transition:all var(--forgeui-transition-fast)` at L644 with no `@media (prefers-reduced-motion: reduce)` override |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### Table
**Status:** 3/5 applicable items pass, 1 fail, 1 partial.
- Lines: `src/components/index.ts:L694–L788`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | Uses `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` — correct semantic elements (L766–785) |
| 2 | Keyboard operable | FAIL | `rowAction` rows get `@click` handler (L777) but are `<tr>` elements — not focusable, no `@keydown`. Keyboard users cannot activate row actions |
| 3 | Focus visible | N/A | No focusable elements (row actions are not keyboard-reachable) |
| 4 | Focus management | N/A | No open/close lifecycle |
| 5 | Labels | PARTIAL | No `<caption>` element on the table. Column headers serve as implicit labels for data cells, but the table itself has no accessible name |
| 6 | State exposed | N/A | Not stateful in ARIA sense |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No transitions on table itself |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### Chart
**Status:** 3/5 applicable items pass, 1 fail, 1 partial.
- Lines: `src/components/index.ts:L810–L983`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | PASS | SVG has `role="img"` and `aria-label` (L975) |
| 2 | Keyboard operable | N/A | Display-only data visualization |
| 3 | Focus visible | N/A | No interactive elements |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | PASS | `aria-label` on SVG set to title or chart type (L975). `<title>` element inside bar rects (L964) |
| 6 | State exposed | N/A | Not stateful |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | FAIL | `.bar { transition:opacity 0.15s; }` at L819 with no reduced-motion override |
| 9 | Color contrast (tokens) | PARTIAL | First 5 palette entries use tokens (L832–836), but entries 6–10 are hardcoded hex: `#8b5cf6`, `#ec4899`, `#14b8a6`, `#f97316`, `#6b7280` (L837). These bypass theming |

---

### Metric
**Status:** 1/1 applicable items pass, 0 fail.
- Lines: `src/components/index.ts:L985–L1053`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | N/A | Passive data display |
| 2 | Keyboard operable | N/A | Passive |
| 3 | Focus visible | N/A | Not focusable |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | N/A | Not stateful in ARIA sense |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### Alert
**Status:** 1/4 applicable items pass, 3 fail.
- Lines: `src/components/index.ts:L1059–L1078`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | FAIL | Renders `<div class="alert">` (L1073) with no `role="alert"`. This is the component most expected to have it |
| 2 | Keyboard operable | N/A | Passive display |
| 3 | Focus visible | N/A | Not interactive |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | FAIL | No `role="alert"`. Variant state (info/success/warning/error) is conveyed only via CSS class, not ARIA |
| 7 | Live regions | FAIL | Missing `role="alert"` means screen readers will not announce alert content. This is the component's entire purpose |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### Dialog
**Status:** 1/7 applicable items pass, 6 fail.
- Lines: `src/components/index.ts:L1080–L1105`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | FAIL | Renders `<div class="backdrop">` and `<div class="dialog">` (L1097–1101). No `role="dialog"`. No `<dialog>` element |
| 2 | Keyboard operable | FAIL | No `@keydown` handler for Escape. Backdrop click closes (L1097) but no keyboard equivalent |
| 3 | Focus visible | N/A | No focusable elements beyond slotted content |
| 4 | Focus management | FAIL | No focus trap when open. No focus restoration to trigger on close. No `focus()` call when dialog opens. Keyboard users can Tab out of the dialog |
| 5 | Labels | FAIL | No `aria-labelledby` pointing to the title. No `aria-label` on the dialog container |
| 6 | State exposed | FAIL | No `role="dialog"`, no `aria-modal="true"`. Open/close state is conveyed via `display:none` / `display:flex` only |
| 7 | Live regions | N/A | Not a live region (though it could benefit from focus management) |
| 8 | prefers-reduced-motion | N/A | No animations (instant show/hide via display) |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

### Progress
**Status:** 1/4 applicable items pass, 3 fail.
- Lines: `src/components/index.ts:L1107–L1127`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | FAIL | Renders `<div class="progress">` containing `<div class="bar">` (L1121–1122). No `role="progressbar"` |
| 2 | Keyboard operable | N/A | Passive display |
| 3 | Focus visible | N/A | Not interactive |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | FAIL | No `role="progressbar"`, no `aria-valuenow`, no `aria-valuemin`, no `aria-valuemax`. Progress value is conveyed only via CSS `width` |
| 7 | Live regions | N/A | Not a live region |
| 8 | prefers-reduced-motion | FAIL | `.bar` has `transition:width var(--forgeui-transition-normal)` at L1111. The indeterminate animation (`@keyframes indeterminate` at L1113) has no `prefers-reduced-motion` override |
| 9 | Color contrast (tokens) | PASS | All colors via tokens |

---

### Error
**Status:** 1/4 applicable items pass, 3 fail.
- Lines: `src/components/index.ts:L1207–L1218`

| # | Check | Grade | Evidence / notes |
|---|-------|-------|------------------|
| 1 | Semantic HTML / ARIA role | FAIL | Renders `<div class="error">` (L1215) with no `role="alert"` |
| 2 | Keyboard operable | N/A | Passive display |
| 3 | Focus visible | N/A | Not interactive |
| 4 | Focus management | N/A | Passive |
| 5 | Labels | N/A | Not a form control |
| 6 | State exposed | FAIL | No `role="alert"`. Error state conveyed only visually |
| 7 | Live regions | FAIL | Missing `role="alert"`. Screen readers will not announce error messages. For transient errors this breaks the feedback loop |
| 8 | prefers-reduced-motion | N/A | No animations |
| 9 | Color contrast (tokens) | PASS | All colors via `--forgeui-color-*` tokens |

---

## Cross-cutting findings

### `<label>` without `for` linkage (5 components)
TextInput, NumberInput, Select, Checkbox, and Toggle all render a `<label>` element adjacent to the input but never set `for` and never set `id` on the input. The label is visually associated but not programmatically. Screen readers will not announce the label when the input receives focus.

### Missing `prefers-reduced-motion` (5 components)
Tabs (.tab transition), Button (transition:all), Toggle (.switch and ::after transitions), Progress (.bar transition + indeterminate keyframes), Chart (.bar hover transition) all animate without a `@media (prefers-reduced-motion: reduce)` override.

### Missing ARIA on interactive/stateful components (4 components)
Alert (no `role="alert"`), Dialog (no `role="dialog"` or `aria-modal`), Progress (no `role="progressbar"` or aria-value*), Error (no `role="alert"`).

### Toggle uses `<div>` instead of semantic element (1 component, severe)
Toggle renders a `<div>` with a click handler. No `role="switch"`, no `tabindex`, no keyboard handler, no `aria-checked`. It is completely invisible to keyboard and assistive technology users.

### Dialog lacks modal semantics (1 component, severe)
Dialog has no `role="dialog"`, no `aria-modal`, no focus trap, no Escape key handler, no focus restoration. It is a visual overlay that assistive technology cannot detect as a dialog.

### Text uses `<div>` for headings (1 component)
All Text variants render `<div>`. Heading variants (heading1/heading2/heading3) should render `<h1>`–`<h3>` for correct document outline.

### Chart mixes tokens and hardcoded hex (1 component)
Chart palette entries 6–10 are hardcoded hex values that bypass theming and may not meet contrast requirements depending on the theme.

### Table row actions not keyboard accessible (1 component)
Table rows with `rowAction` get `@click` handlers but are `<tr>` elements — not focusable, no keyboard activation.

## Prioritization for Prompt 11b

### P0 (blocks a11y baseline claim)

| # | Component | Check | Issue |
|---|-----------|-------|-------|
| 1 | Toggle | #1, #2 | `<div>` with click handler — not keyboard operable, no semantic role |
| 2 | Toggle | #6 | No `role="switch"` or `aria-checked` — state invisible to screen readers |
| 3 | Dialog | #1 | No `role="dialog"` — screen readers cannot identify it as a dialog |
| 4 | Dialog | #4 | No focus trap — keyboard users can Tab out of the modal |
| 5 | Dialog | #2 | No Escape key handler — no keyboard dismiss |
| 6 | Alert | #7 | No `role="alert"` — the canonical live-region component is not a live region |
| 7 | Error | #7 | No `role="alert"` — error messages not announced by screen readers |
| 8 | Progress | #6 | No `role="progressbar"` or `aria-valuenow/min/max` — progress state invisible |

### P1 (serious but not blocking)

| # | Component | Check | Issue |
|---|-----------|-------|-------|
| 9 | TextInput | #5 | `<label>` without `for`/`id` linkage |
| 10 | NumberInput | #5 | `<label>` without `for`/`id` linkage |
| 11 | Select | #5 | `<label>` without `for`/`id` linkage |
| 12 | Checkbox | #5 | `<label>` without `for`/`id` linkage |
| 13 | Toggle | #5 | `<label>` without `for`/`id` linkage |
| 14 | Toggle | #3 | No focus-visible styles |
| 15 | Tabs | #2 | No arrow-key navigation between tab buttons |
| 16 | Tabs | #4 | No `aria-controls`/`aria-labelledby` linking tabs to panels |
| 17 | Button | #6 | No `aria-pressed` for toggle variant |
| 18 | Progress | #8 | Missing `prefers-reduced-motion` on transition + indeterminate animation |
| 19 | Text | #1 | Heading variants render `<div>` instead of `<h1>`–`<h3>` |
| 20 | Table | #2 | Row actions not keyboard accessible (no tabindex, no key handler) |
| 21 | Dialog | #5 | No `aria-labelledby` or `aria-label` on dialog container |
| 22 | Dialog | #6 | No `aria-modal="true"` |
| 23 | Tabs | #8 | Missing `prefers-reduced-motion` on `.tab` transition |
| 24 | Button | #8 | Missing `prefers-reduced-motion` on `transition:all` |
| 25 | Toggle | #8 | Missing `prefers-reduced-motion` on `.switch` transitions |
| 26 | Chart | #8 | Missing `prefers-reduced-motion` on `.bar` transition |
| 27 | Alert | #6 | Variant state not exposed via ARIA |

### P2 (polish)

| # | Component | Check | Issue |
|---|-----------|-------|-------|
| 28 | Table | #5 | No `<caption>` element for table accessible name | **Resolved 2026-04-17** — optional `caption` prop renders `<caption>` as first child of `<table>` |
| 29 | Chart | #9 | Palette entries 6–10 use hardcoded hex instead of tokens | **Resolved 2026-04-17** — `--forgeui-color-chart-6` through `-10` tokens defined; palette uses `var(--forgeui-color-chart-*)` |
| 30 | Toggle | #9 | Knob uses `background:white` instead of a token |
| 31 | Tabs | #6 | Tabpanel missing `aria-labelledby` (covered in P1 #16 but worth noting separately) |

## Tests we'd want in Prompt 11b

### P0 tests

| Component | Issue | Test type | Test description |
|-----------|-------|-----------|------------------|
| Toggle | #1, #2, #6 | Structural | Render Toggle, assert shadow root contains `<button role="switch">` (not `<div>`), assert `aria-checked` reflects `on` prop |
| Toggle | #2 | Behavioral | Fire `keydown` Enter/Space on toggle, assert `forgeui-action` event dispatched with toggled state |
| Dialog | #1, #6 | Structural | Render Dialog with `open=true`, assert shadow root has `[role="dialog"][aria-modal="true"]` |
| Dialog | #4 | Behavioral | Render Dialog open, Tab through focusable elements, assert focus stays trapped inside dialog. Assert focus returns to opener on close |
| Dialog | #2 | Behavioral | Fire `keydown` Escape on open Dialog, assert `forgeui-action` event with action `'close'` |
| Alert | #7 | Structural | Render Alert, assert shadow root has `[role="alert"]` |
| Error | #7 | Structural | Render Error, assert shadow root has `[role="alert"]` |
| Progress | #6 | Structural | Render Progress with `value=50`, assert shadow root has `[role="progressbar"][aria-valuenow="50"][aria-valuemin="0"][aria-valuemax="100"]` |

### P1 tests

| Component | Issue | Test type | Test description |
|-----------|-------|-----------|------------------|
| TextInput | #5 | Structural | Render with `label="Name"`, assert `<input>` has accessible name matching "Name" (label `for` matches input `id`) |
| NumberInput | #5 | Structural | Same pattern as TextInput |
| Select | #5 | Structural | Same pattern as TextInput |
| Checkbox | #5 | Structural | Same pattern as TextInput |
| Toggle | #5 | Structural | Render with `label="Dark mode"`, assert switch button has accessible name matching "Dark mode" |
| Toggle | #3 | Snapshot | Render Toggle, assert `.switch` element has `:focus-visible` styles or equivalent outline/box-shadow |
| Tabs | #2 | Behavioral | Render Tabs, focus first tab, fire ArrowRight, assert focus moves to second tab |
| Tabs | #4 | Structural | Render Tabs, assert each `role="tab"` has `aria-controls` pointing to a valid panel, assert panel has `aria-labelledby` |
| Button | #6 | Structural | Render with `variant=toggle`, assert `<button>` has `aria-pressed="true"` or `"false"` reflecting state |
| Text | #1 | Structural | Render with `variant=h1`, assert shadow root contains `<h1>` (not `<div class="heading1">`) |
| Table | #2 | Behavioral | Render Table with `rowAction`, fire ArrowDown/Enter on a row, assert `forgeui-action` dispatched |
| Progress | #8 | Snapshot | Assert `.bar` transition is wrapped in `@media (prefers-reduced-motion: reduce) { transition: none }` |
| Chart | #8 | Snapshot | Assert `.bar` transition is wrapped in `@media (prefers-reduced-motion: reduce) { transition: none }` |
| Button | #8 | Snapshot | Assert `button` transition is wrapped in `@media (prefers-reduced-motion: reduce) { transition: none }` |
| Tabs | #8 | Snapshot | Assert `.tab` transition is wrapped in `@media (prefers-reduced-motion: reduce) { transition: none }` |
