# 0005 — CDN development mode and self-hosted deployment mode

Status: accepted

ForgeUI supports the requested Tailwind browser CDN and pinned HTMX CDN for low-friction
development. Exact versions are configuration, HTMX carries Subresource Integrity, and Content
Security Policy names only the selected origins.

Tailwind documents its browser CDN as a development tool. ForgeUI therefore also supports a
no-CDN mode using the prebuilt trusted stylesheet and local ForgeUI interaction script; that local
script covers dashboard state, job polling, and cancellation without an external runtime. The
model never sees either asset path and never supplies a class name.
