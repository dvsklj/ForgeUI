# Bundle size audit — 2026-04

> **Update — 2026-04-17:** The two size regressions this audit called out have been fixed. IIFE gzip dropped from 95,029 bytes to 46,940 bytes (-51%).
>
> - Zod removed from IIFE (commit f2df37e): -16.3 KB gzip. Runtime now imports pre-generated data, not Zod. See CHANGELOG 0.1.0.
> - Ajv compiler removed via standalone precompilation (commit 9ffbb58): -33.7 KB gzip. `validateManifest()` now runs a precompiled validator — also O(validation), not O(recompile + validation).
>
> The rest of this document is preserved as a point-in-time audit.

## Executive summary

The `@forgeui/runtime` IIFE ships at **334 KB raw / 95 KB gzipped** — the architecture doc (§10) claims ~308 KB raw / ~40 KB gzipped, meaning the real number is **~8% over on raw and 2.4× over on gzip**. The primary culprits are Ajv (25 KB gzip), Zod (14 KB gzip), and TinyBase (13 KB gzip), all of which are fully inlined into the IIFE despite the description claiming "zero dependencies." Every other published package also exceeds reasonable expectations for its domain.

## Per-package size table

| Package                         | Raw (B) | Min (B) | Gzip (B) | Brotli (B) | vs. claim        |
|---------------------------------|---------|---------|----------|------------|------------------|
| @forgeui/runtime (IIFE)           | 333,785 | 333,785 | 95,029   | 83,813     | +235% vs 40 KB   |
| @forgeui/runtime (ESM standalone) | 173,375 | 173,375 | 41,604   | 36,577     | n/a (no claim)   |
| @forgeui/runtime (ESM components) | 63,812  | 63,812  | 14,278   | 12,550     | n/a (no claim)   |
| @forgeui/catalog                  | 30,125  | 30,125  | 8,389    | 7,266      | n/a (no claim)   |
| @forgeui/server                   | 232,140 | 232,140 | 68,284   | 60,476     | n/a (no claim)   |
| @forgeui/connect                  | 377,119 | 377,119 | 103,202  | 89,136     | n/a (no claim)   |

**Notes:** The build already minifies (`minify: true` in `build.mjs`), so raw = minified for all files. All numbers are from the `dist/` output that `npm run build` produces on this commit.

## @forgeui/runtime bundle breakdown

Top 15 inputs by byte contribution (ESM bundle from `src/index.ts`, esbuild metafile):

| # | KB     | File                                                   | Owner   |
|---|--------|--------------------------------------------------------|---------|
| 1 | 128.1  | `node_modules/zod/v3/types.js`                         | third   |
| 2 | 116.6  | `node_modules/tinybase/index.js`                       | third   |
| 3 |  67.6  | `src/components/index.ts`                              | first   |
| 4 |  24.6  | `node_modules/ajv/dist/core.js`                        | third   |
| 5 |  22.6  | `node_modules/ajv/dist/compile/codegen/index.js`       | third   |
| 6 |  20.1  | `node_modules/ajv/dist/compile/validate/index.js`      | third   |
| 7 |  18.2  | `src/catalog/prompt.ts`                                | first   |
| 8 |  17.9  | `src/catalog/schemas/index.ts`                         | first   |
| 9 |  14.4  | `src/state/index.ts`                                   | first   |
| 10 | 14.3  | `node_modules/tinybase/persisters/persister-indexed-db/index.js` | third   |
| 11 | 13.7  | `src/validation/index.ts`                              | first   |
| 12 | 10.1  | `node_modules/fast-uri/index.js`                       | third   |
| 13 |  9.8  | `node_modules/ajv/dist/compile/index.js`               | third   |
| 14 |  9.5  | `src/runtime/index.ts`                                 | first   |
| 15 |  8.9  | `src/renderer/index.ts`                                | first   |

**Aggregated by ownership:**

| Area              | Raw (KB) | % of ESM bundle |
|-------------------|----------|-----------------|
| Third-party deps  | 514.0    | 72.2%           |
| First-party src   | 198.1    | 27.8%           |
| **Total**         | **712.1**| **100%**        |

The ESM bundle (pre-externalization) is 712 KB raw. Third-party deps account for 72% of the input. Even after tree-shaking, the deps dominate.

## Third-party dep cost

Standalone gzipped size of each runtime dependency (esbuild bundle of the dep's entry, minified):

| Dependency        | Raw (B) | Gzip (B) | Flagged?        |
|-------------------|---------|----------|-----------------|
| ajv               | 80,347  | 25,360   | **>15 KB — YES** |
| zod               | 58,880  | 13,795   | borderline       |
| tinybase          | 27,967  | 12,530   | no               |
| lit               | 16,052  | 6,167    | no               |
| fast-uri          | 9,426   | 3,533    | no               |

**Ajv at 25 KB gzip is the single largest third-party cost.** It is used for JSON Schema validation of incoming manifests. Zod at 14 KB is close to the 15 KB threshold and is used in the catalog schema definitions. Note that the package description on npm still says "Zero dependencies" — this is false for the IIFE build, which inlines all of the above.

## Per-component cost (if measurable)

Not individually measurable. All 39 components are implemented in two files:

- `src/components/base.ts` — 5.2 KB (base class)
- `src/components/index.ts` — 67.6 KB (all 39 components barrel-exported in one file, 1,324 lines)

The esbuild metafile resolves `src/components/index.ts` as a single input. There is no per-component file boundary, so per-component gzipped cost cannot be determined from the bundle analysis. The 39 components registered via `customElements.define()` are:

```
forgeui-stack  forgeui-grid  forgeui-card  forgeui-container  forgeui-tabs
forgeui-accordion  forgeui-divider  forgeui-spacer  forgeui-repeater
forgeui-text  forgeui-image  forgeui-icon  forgeui-badge  forgeui-avatar
forgeui-empty-state  forgeui-text-input  forgeui-number-input  forgeui-select
forgeui-multi-select  forgeui-checkbox  forgeui-toggle  forgeui-date-picker
forgeui-slider  forgeui-file-upload  forgeui-button  forgeui-button-group
forgeui-link  forgeui-table  forgeui-list  forgeui-chart  forgeui-metric
forgeui-alert  forgeui-dialog  forgeui-progress  forgeui-toast
forgeui-breadcrumb  forgeui-stepper  forgeui-error  forgeui-drawing
```

The architecture doc (§4) claims 37 components (18 core + 19 extended). The current codebase has 39 — `forgeui-error` and `forgeui-drawing` were added without an apparent catalog-tier assignment.

## Reconciling with docs/architecture.md

**The claim** (architecture.md §10, "Current state"):

> `@forgeui/runtime` IIFE: ~308 KB raw, ~40 KB gzipped.

**The reality:**

| Metric  | Claimed | Measured | Delta       |
|---------|---------|----------|-------------|
| Raw     | ~308 KB | 334 KB   | +26 KB (+8%) |
| Gzipped | ~40 KB  | 95 KB    | +55 KB (+138%) |

The raw number is within 8% of the claim — close enough that it could reflect recent feature additions. The gzip number is 2.4× the claim. This suggests either:

1. The claim was made early in development before Ajv, Zod, and TinyBase were inlined into the IIFE, or
2. The claim refers to the ESM standalone bundle (41 KB gzip, which is close to 40 KB) and was mislabeled as "IIFE."

**Two paths forward:**

**(a) Shrink to meet the claim.** Remove ~55 KB gzip from the IIFE:
- Precompile Ajv schemas at build time, remove runtime Ajv dep → saves ~25 KB gzip.
- Remove or externalize Zod (move catalog schema validation to build time) → saves ~14 KB gzip.
- Externalize TinyBase (ship as ESM-only, let CDN/packager handle it) → saves ~13 KB gzip.
- Estimated total savings: ~52 KB gzip, bringing the IIFE to ~43 KB — within striking distance of 40 KB.
- Trade-off: the IIFE would no longer be fully self-contained. Consumers would need to provide external deps or use the ESM entry points.

**(b) Correct the claim.** Update architecture.md §10 to honest numbers:
- IIFE: ~334 KB raw, ~95 KB gzipped (fully self-contained, zero external deps at runtime).
- ESM standalone: ~173 KB raw, ~42 KB gzipped (requires lit, tinybase, ajv from CDN).
- ESM components: ~64 KB raw, ~14 KB gzipped (components only, requires lit, tinybase).
- Propose a per-component budget of ≤3 KB gzipped for new components going forward.

Don't pick a path. Present both. Davor will decide.

## Proposed size-limit budgets

Budgets are current-size + 12% headroom. CI fails when a PR regresses a package beyond its budget.

| Package                         | Current gzip (B) | Proposed budget (B) |
|---------------------------------|------------------|---------------------|
| @forgeui/runtime (IIFE)           | 95,029           | 106,433             |
| @forgeui/runtime (ESM standalone) | 41,604           | 46,597              |
| @forgeui/runtime (ESM components) | 14,278           | 15,992              |
| @forgeui/catalog                  | 8,389            | 9,396               |
| @forgeui/server                   | 68,284           | 76,479              |
| @forgeui/connect                  | 103,202          | 115,587             |

If path (a) is taken and deps are removed from the IIFE, the IIFE budget should be re-measured and reduced accordingly.

## Next steps

1. **Decide path (a) vs (b)** for the architecture doc's size claim. If (a), the Ajv precompilation work is the single highest-ROI change (~25 KB gzip saved).
2. **Wire `size-limit` into CI** with the budgets above. See Prompt 10.
3. **Split `src/components/index.ts`** into per-component ESM entry points (e.g., `@forgeui/runtime/components/chart`) so consumers can tree-shake and so we can measure per-component cost. The architecture doc §10 already promises this but it is not implemented.
4. **Fix the npm description.** `@forgeui/runtime/package.json` says "Zero dependencies, 40KB gzip." Both claims are false for the IIFE. Either make them true or remove the claim.
5. **Assign tiers to forgeui-error and forgeui-drawing.** These 2 components were added after the 18/19 core/extended split was documented. They need catalog-tier assignment and test coverage.
6. **Investigate @forgeui/connect at 103 KB gzip.** The MCP SDK is likely the bulk of this. If the MCP SDK tree-shakes poorly, consider a slimmer stdio-only build.

---

*Generated 2026-04-17. All numbers measured from `npm run build` on commit `fix/layout-robustness`. Build was clean (no errors). Brotli measured with `brotli -c -q 11`. No code changes were made.*
