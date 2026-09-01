# Embedding ForgeUI

ForgeUI can be mounted as a sub-application, framed as an isolated responsive widget, rendered as
one trusted manifest subtree, or used as a Python rendering library. The host chooses the surface,
state lifetime, and element boundary; a generated manifest cannot select them.

## Install only the required layer

```bash
pip install forgeui                  # validation, A2UI, and direct rendering
pip install 'forgeui[web]'           # FastAPI mount with an injected provider
pip install 'forgeui[web,ollama]'    # FastAPI mount with the Ollama provider
pip install 'forgeui[web,http]'      # plus fixed trusted JSON endpoints
```

The base package does not install FastAPI, SQLAlchemy, HTTPX, Uvicorn, metrics, or settings
dependencies. Existing compatible host dependencies are reused by pip.

## Mount in an existing FastAPI application

```python
from fastapi import FastAPI

from forgeui.app import mount_forgeui
from forgeui.config import Settings

app = FastAPI()
mount_forgeui(app, "/forgeui", settings=Settings())
```

All generated URLs, static assets, API calls, and interaction endpoints retain the mount prefix.
The helper composes database initialization, the bounded generation worker, and shutdown into the
host's existing lifespan. The embedded ForgeUI service can use the host's external Ollama instance
and its own SQLite file.

Pass a frozen `RuntimeRegistries` instance as `runtime=` to replace the built-in device-health
source. Host authentication middleware can set a verified `Principal` on
`request.state.forgeui_principal`; registered source and capability authorizers receive it. See
[data contracts, sources, and capabilities](data-sources.md).

`RuntimeRegistries.destinations` is the host-owned allowlist for navigation IDs. Manifests never
contain route paths or URLs. The reference runtime exposes `overview` and `devices`; a host may
replace that set with its own stable identifiers.

## Put one ForgeUI card on an existing page

Every saved manifest element is an addressable, validated subtree. Use the element ID in the
`element` query parameter:

```html
<article class="device-health-card">
  <h2>Resource pressure</h2>
  <iframe
    data-forgeui-embed
    src="/forgeui/apps/APP_ID/embed?element=pressure-chart"
    title="Resource pressure"
    loading="lazy"
    style="display:block;width:100%;height:20rem;border:0"
  ></iframe>
</article>
<script defer src="/forgeui/static/forgeui-embed.js"></script>
```

The tiny optional host helper validates the message origin and adjusts iframe height when the
rendered card changes size. The iframe keeps ForgeUI's CSS, theme tokens, scripts, CSP, and state
separate from the host page. This is the recommended integration when the existing application has
its own Tailwind configuration or component styles.

Declared drill-downs inside an embed emit a validated `forgeui:navigate` custom event on the iframe.
The host remains responsible for mapping the opaque destination ID to its router:

```html
<script>
  document.querySelector("[data-forgeui-embed]").addEventListener("forgeui:navigate", (event) => {
    const routes = {devices: "/devices", overview: "/overview"};
    const route = routes[event.detail.destination];
    if (route) window.location.assign(route);
  });
</script>
```

Append `?element=ELEMENT_ID` to `/embed`, `/artifact`, or any
`/views/{surface}` route. An unknown element returns 404. The selected subtree still uses the saved
manifest's profile, registered data source, expressions, and action declarations.

## Server-compose an HTML fragment

Same-site hosts that deliberately share ForgeUI's styles can request inert HTML without a document
shell:

```html
<section
  hx-get="/forgeui/fragments/apps/APP_ID?element=pressure-chart"
  hx-trigger="load"
  hx-swap="innerHTML"
></section>
```

The fragment route injects no scripts or external assets. Load ForgeUI's stylesheet yourself, map
the emitted `.forge-*` classes into the host design system, or use the iframe mode for complete
style isolation. Stateful ForgeUI controls should use the document/iframe routes because those
routes carry the signed session, CSRF metadata, and scoped interaction runtime.

## Compose directly in trusted Python

```python
from forgeui.renderer import render_manifest

card_html = render_manifest(
    validated_manifest,
    data=device_snapshot,
    state={"status": "all"},
    element_id="pressure-chart",
)
```

`render_manifest` accepts only a validated `ForgeManifest`. Element IDs can select an existing
subtree but cannot select templates, classes, URLs, or arbitrary code.

## Choosing an integration

| Need | Recommended boundary |
| --- | --- |
| Complete ForgeUI dashboard | Mounted `/apps/{app_id}` route |
| One responsive card in an existing page | `/embed?element={element_id}` iframe |
| Chat or assistant artifact | `/artifact?element={optional_element_id}` |
| Host-owned server composition | `render_manifest(..., element_id=...)` |
| Simple same-site HTML injection | `/fragments/apps/{app_id}?element=...` |

Use stateless embeds for cross-origin pages. Use stateful views when the host and ForgeUI are
same-site and session continuity is required.
