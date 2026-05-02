# LLM SVG Icon Guide

Forge icons and drawings should be predictable data, not pasted SVG markup. This guide is for LLMs generating small icons with the `Drawing` component or choosing names for the built-in `Icon` component.

## Pick the Right Component

Use `Icon` when a built-in symbol is enough:

```json
{ "type": "Icon", "props": { "name": "check", "color": "success" } }
```

Use `Drawing` when the icon needs a custom silhouette, badge, tiny diagram, or product-specific mark:

```json
{
  "type": "Drawing",
  "props": {
    "width": 24,
    "height": 24,
    "shapes": [
      { "type": "circle", "cx": 12, "cy": 12, "r": 9, "stroke": "currentColor", "strokeWidth": 2 },
      { "type": "path", "d": "M8 12l3 3 5-6", "stroke": "currentColor", "strokeWidth": 2 }
    ]
  }
}
```

## Icon Rules

1. Draw on a `24 x 24` coordinate system unless the user asks for another size.
2. Prefer strokes over filled blobs for UI icons: `fill: "none"`, `stroke: "currentColor"`, `strokeWidth: 2`.
3. Keep icons to 1-4 shapes. If it needs more, simplify the idea.
4. Use round visual geometry: make corners, line endings, and joins feel consistent. Forge path shapes cannot set line caps yet, so avoid paths that rely on sharp decorative endings.
5. Keep at least 2 units of padding inside the viewbox. Important points should usually sit between `x/y = 3` and `21`.
6. Center the visual weight, not just the math. A checkmark often needs to sit slightly low; an arrow often needs a longer shaft than head.
7. Do not include raw `<svg>`, `<g>`, `<defs>`, gradients, filters, masks, clip paths, CSS classes, scripts, IDs, or external references.
8. Use `currentColor` for monochrome icons so the host text color controls the icon.
9. Use Forge design intent for color: `primary`, `success`, `warning`, `error`, `info`, or inherited text color. Avoid hex colors unless the manifest explicitly represents custom artwork.
10. Icons must remain legible at `16px`. Avoid text inside icons except for deliberate badges.

## Supported Drawing Shapes

The current runtime supports these shape records:

| Shape | Required fields | Common fields |
|---|---|---|
| `rect` | `x`, `y`, `width`, `height` | `rx`, `ry`, `fill`, `stroke`, `strokeWidth`, `opacity` |
| `circle` | `cx`, `cy`, `r` | `fill`, `stroke`, `strokeWidth`, `opacity` |
| `ellipse` | `cx`, `cy`, `rx`, `ry` | `fill`, `stroke`, `strokeWidth`, `opacity` |
| `line` | `x1`, `y1`, `x2`, `y2` | `stroke`, `strokeWidth`, `opacity` |
| `path` | `d` | `fill`, `stroke`, `strokeWidth`, `opacity` |
| `text` | `x`, `y`, `content` | `fill`, `fontSize`, `fontWeight`, `textAnchor`, `opacity` |

## Path Guidance

Use compact absolute path commands:

```json
{ "type": "path", "d": "M5 12h14M13 6l6 6-6 6", "stroke": "currentColor", "strokeWidth": 2 }
```

Good paths:

- Start with `M`.
- Use simple `M`, `L`, `H`, `V`, `C`, `Q`, `A`, and `Z` commands.
- Keep coordinates to whole or half units.
- Avoid microscopic decimals and long exported paths.

Avoid:

- Boolean-compound paths copied from design tools.
- Paths with hundreds of points.
- Fills that depend on winding-rule behavior.
- Tiny details that disappear at small sizes.

## Quality Checklist

Before returning a custom icon:

- Does it read correctly at 16px, 20px, and 24px?
- Is it balanced inside the 24x24 box?
- Does it work in light and dark themes?
- Does it inherit color via `currentColor` unless intentionally colored?
- Is the JSON valid, flat, and free of raw SVG markup?

When in doubt, choose a simpler built-in `Icon` name and spend the prompt budget on clearer layout and copy.
