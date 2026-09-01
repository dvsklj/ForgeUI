# Runtime surfaces and state modes

One validated `forgeui/1` manifest can render in every supported runtime context. Surface and
persistence are separate, host-selected settings; neither is available to the model.

## Surface matrix

| Surface | Intended context | Shell | Layout behavior | Frameable |
| --- | --- | --- | --- | --- |
| `dashboard` | ForgeUI's normal hosted dashboard | Full | Wide, fluid dashboard | No |
| `standalone` | General responsive web app | Full | Fills the viewport and adapts | No |
| `desktop` | Desktop web app | Full | Wide desktop composition | No |
| `mobile` | Mobile web app or phone preview | Full | 30 rem maximum, one-column grids, 44 px controls | No |
| `embed` | Widget inside another application | Minimal | No outer shell, border, radius, or shadow | Yes |
| `chat` | Chat artifact or compact assistant result | Minimal | Compact, fluid, 48 rem maximum, 44 px controls | Yes |

Every surface remains responsive. `desktop` and `mobile` are intentional host hints, not fixed
pixel canvases; narrow windows still reflow and wide mobile previews stay constrained.

## Persistence matrix

| Mode | State owner | Interaction behavior | Reload behavior | Capabilities |
| --- | --- | --- | --- | --- |
| `stateful` | Versioned server session state | Existing actions and controls mutate session state | Preserved for the signed session | Allowed through trusted host handlers |
| `stateless` | Validated state snapshot carried by each render request | Controls, modal/toast actions, filters, and pagination remain interactive | Resets to manifest defaults | Side-effecting capabilities and form submission are denied |

Stateless render requests are CSRF-exempt because they cannot persist state or invoke a
capability. They remain request-size bounded, rate limited, visibility checked, strictly typed
against the manifest state declaration, and rendered through the same trusted component boundary.

## Hosted URL examples

Replace `{app_id}` with a readable saved app:

```text
/apps/{app_id}/gallery
/apps/{app_id}
/apps/{app_id}/views/dashboard?persistence=stateful
/apps/{app_id}/views/standalone?persistence=stateful
/apps/{app_id}/views/desktop?persistence=stateful
/apps/{app_id}/views/mobile?persistence=stateless
/apps/{app_id}/views/embed?persistence=stateless
/apps/{app_id}/views/chat?persistence=stateless
/apps/{app_id}/views/embed?persistence=stateless&element=pressure-chart
```

The gallery links every combination and renders live same-origin previews for the embed and chat
surfaces.

Any document surface can render one safe manifest subtree with `?element={element_id}`. This is
particularly useful for placing one card or chart on an existing device page. See
[embedding ForgeUI](embedding.md).

Convenience routes are available for the two most common framed surfaces:

```text
/apps/{app_id}/embed
/apps/{app_id}/artifact
```

Both routes are ephemeral and frameable. The artifact is a server-hosted HTML document with
same-origin versioned assets; it is not an offline single-file JavaScript bundle.

## iframe example

Same-origin framing works with the secure default:

```html
<iframe
  src="/forgeui/apps/APP_ID/embed"
  title="Fleet health"
  loading="lazy"
  style="width: 100%; min-height: 640px; border: 0"
></iframe>
```

Only embed and chat responses relax ForgeUI's default frame denial. They default to
`frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`. To allow exact cross-origin hosts,
configure an explicit list:

```dotenv
FORGEUI_FRAME_ANCESTORS=["'self'","https://chat.example.com"]
```

Wildcards, paths, credentials, query strings, and fragments are rejected. Cross-origin artifacts
should use stateless mode. Stateful mode relies on ForgeUI's signed `SameSite=Lax` session cookie
and is intended for same-site applications.

## Library rendering

Trusted Python code can choose the same modes without HTTP:

```python
from forgeui.renderer import PersistenceMode, Renderer, SurfaceMode

html = Renderer().render_document(
    manifest,
    context,
    surface=SurfaceMode.CHAT,
    persistence=PersistenceMode.STATELESS,
)
```

The renderer accepts enum values, not arbitrary classes or layout tokens. Design profiles,
light/dark/system themes, component compatibility, and manifest validation are unchanged across
all modes.
