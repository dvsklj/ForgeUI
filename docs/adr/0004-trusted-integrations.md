# 0004 — Trusted data sources and capabilities

Status: accepted

Manifests name typed data contracts and allowlisted capability IDs. Operators bind those IDs to
implementations outside model-authored JSON.

A manifest cannot select a host, URL, credential, database, filesystem location, HTTP method,
request body, command, callback, or SQL statement. Source data is projected through a contract
before rendering or prompting. Capabilities enforce authentication, role, confirmation,
idempotency, and audit policy in server code.

The configured Ollama endpoint is a separate trusted dependency; it does not create a general
outbound-network facility for manifests.
