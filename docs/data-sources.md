# Data contracts, sources, and capabilities

ForgeUI is domain-neutral at its runtime boundary. Device health is the built-in reference
contract; an embedding application can replace it with AI-search results, inventory, observability,
support, finance, or another bounded JSON object.

The boundary has three host-owned registries:

- a data contract maps a versioned ID to a strict Pydantic output model, the exact expression paths
  a manifest may read, and an optional validated dry-render example;
- a data source maps a safe ID to trusted application code, one registered contract, optional
  strict input, and a runtime authorizer;
- a capability maps a safe ID to an explicitly authorized side effect, optional strict input, and
  optional user confirmation.

Calling `mount_forgeui(..., runtime=runtime)` freezes all three registries. ForgeUI derives its
manifest policy, model prompt, JSON Schema, persistence validation, render lookup, refresh actions,
and capability allowlist from that same frozen snapshot.

## AI-search example

The complete runnable example is [ai_search_host.py](../examples/ai_search_host.py). Its essential
registration code is:

```python
contracts = DataContractRegistry()
contracts.register(
    "ai-search/1",
    SearchFeed,
    expression_paths={
        "data.query",
        "data.answer",
        "data.results",
        "data.results.title",
        "data.results.score",
        "item.title",
        "item.score",
    },
    example=EXAMPLE_FEED,
)

sources = DataSourceRegistry(contracts)
sources.register(
    "ai-search.latest",
    contract_id="ai-search/1",
    handler=load_latest_search_feed,
    authorize=lambda context, _input: context.principal.tenant_id == "acme",
)

runtime = RuntimeRegistries(contracts, sources, CapabilityRegistry()).freeze()
mount_forgeui(host, "/forgeui", settings=settings, runtime=runtime)
```

The manifest can contain only:

```json
{"data":{"contract":"ai-search/1","source":"ai-search.latest"}}
```

It cannot see or choose the handler, endpoint, headers, tokens, database session, tenant rule, or
connection settings.

## Existing authentication

Host middleware may attach a verified `forgeui.security.Principal` to
`request.state.forgeui_principal` before the mounted app runs. Source and capability authorizers
receive that immutable principal. If none is attached, ForgeUI supplies its own administrator or
anonymous session-scoped principal.

Never construct a principal from unverified query, form, manifest, or model fields. Keep ordinary
app visibility checks as well as source/capability authorization; they protect different layers.

## Existing endpoints

For in-process services, register a small handler that calls the existing typed service or
repository API. This avoids HTTP overhead and reuses the host's authorization and transaction
boundaries.

For a fixed remote JSON service, install `forgeui[http]` and use
`forgeui.sources.http.HttpDataSource`. Its origin, path, method, headers, timeout, and response limit
are trusted startup configuration. It requires HTTPS except for an explicit localhost development
escape hatch, does not follow redirects, accepts only JSON objects, and bounds the streamed body.
Do not expose `HttpEndpointConfig` fields to a manifest or generation request.

Sources used for passive dashboard rendering must accept no input. A host can call
`DataSourceRegistry.fetch(..., input_value=...)` directly for a registered source with a strict
input model, but a manifest cannot invent source parameters. If a dashboard needs user-driven
queries, implement a registered capability that validates and stores the query in server-owned
state, then refresh a source that reads that trusted state.

Generation jobs fetch with the built-in authenticated generation-service principal when
`sample_data` is empty. Tenant-aware hosts can instead submit a contract-valid bounded
`sample_data` fixture with the generation request. That fixture is treated as untrusted prompt
data and is persisted with the job, so redact secrets and sensitive records; the saved manifest
contains references only and renders against the live authorized source.

## Safe side effects

Executable capabilities require an authorizer. Their handler is unavailable in stateless mode;
stateful calls may additionally require explicit confirmation and a strict Pydantic input model.
Returning `CapabilityResult(refresh=True)` refreshes only the manifest's own registered source.

Prefer narrow names such as `incident.acknowledge` or `report.export`, not generic `http.call`,
`sql.execute`, or `python.run` capabilities. A manifest should describe intent, never transport.

## Package boundary

The current project remains one distribution with dependency extras. That keeps schema, catalog,
renderer, and prompt versions synchronized while still allowing small installs:

- `forgeui`: manifest, validation, A2UI, and direct renderer;
- `forgeui[web]`: mounted FastAPI runtime, persistence, and job worker;
- `forgeui[http]`: hardened fixed-endpoint source adapter;
- `forgeui[ollama]`: external Ollama provider;
- `forgeui[app]`: standalone reference service.

Separate repositories would add release-skew risk now. Split distributions only when an adapter
has a genuinely independent release cadence; keep the manifest schema/catalog/validator/renderer
kernel versioned together.
