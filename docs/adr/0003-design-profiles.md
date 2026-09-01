# 0003 — Complete design profiles

Status: accepted

The model chooses one complete design profile: `ops-compact`, `signal-cards`,
`executive-summary`, or `calm-neutral`. It cannot mix independent fonts, colors, radii, shadows,
grid rules, chart palettes, or Tailwind utilities.

Each profile defines light and dark semantic tokens, density, composition limits, and component
defaults. The trusted shell always supplies Light, Dark, and System controls. Profile compatibility
is a semantic validation rule, so unsafe or incoherent combinations never reach templates.
