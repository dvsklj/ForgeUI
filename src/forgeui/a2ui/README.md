# ForgeUI A2UI import boundary

This package imports one deliberately small snapshot subset of the closed,
current-production Google A2UI v0.9.1 protocol. It is not a streaming renderer
and does not claim general A2UI conformance.

The implementation is pinned to:

- protocol version `v0.9.1`;
- Google repository commit
  `d4723f29254520e1214d5004cb555d83eaafb828`;
- MIME type `application/a2ui+json`;
- server schema URL
  `https://a2ui.org/specification/v0_9_1/server_to_client.json`;
- the official basic catalog identifier
  `https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json`.

Primary sources:

- [published v0.9.1 server schema](https://a2ui.org/specification/v0_9_1/server_to_client.json)
- [published v0.9.1 basic catalog](https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json)
- [v0.9.1 status and documentation](https://github.com/google/A2UI/tree/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1)
- [server-to-client schema](https://github.com/google/A2UI/blob/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1/json/server_to_client.json)
- [basic catalog schema](https://github.com/google/A2UI/blob/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1/catalogs/basic/catalog.json)
- [protocol text](https://github.com/google/A2UI/blob/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1/docs/a2ui_protocol.md)
- [v0.9 to v0.9.1 evolution guide](https://github.com/google/A2UI/blob/d4723f29254520e1214d5004cb555d83eaafb828/specification/v0_9_1/docs/evolution_guide.md)

The upstream v0.9.1 message schema deliberately accepts both `v0.9` and
`v0.9.1` for wire compatibility, and the schema files retain some v0.9 `$id`
values. ForgeUI is stricter: this boundary accepts only `v0.9.1` envelopes and
the v0.9.1 catalog URL used by the current protocol documentation.
Although v0.9.1 relaxes the protocol-wide `surfaceId` requirement, the importer
retains ForgeUI's lowercase, bounded identifier grammar at this trust boundary.

## Accepted snapshot

The first message must be one `createSurface`. It may be followed by one or
more `updateComponents` batches whose IDs are globally unique and at most one
root `updateDataModel` containing a complete `device-health/1` snapshot.

The fixed component mapping is:

| A2UI v0.9.1 basic component | ForgeUI component |
| --- | --- |
| `Column` | `stack` |
| `Row` | `inline` |
| `Card` | `card` |
| `Text` (`h1`–`h4`, `body`, `caption`) | `heading` or `text` |
| `Divider` (horizontal only) | `divider` |
| `Icon` (`check`, `error`, `search`, `warning`) | fixed ForgeUI icon |

Only literal text and fixed device-health summary bindings are accepted.
The translated manifest always uses the `ops-compact` design profile,
`system` color mode, the `device-health/1` data contract, empty server state,
and no actions. It is passed through ForgeUI's authoritative
`validate_manifest` boundary before being returned.

## Deliberate exclusions

The importer rejects custom catalogs, themes, data-model patches, repeated
component upserts, dynamic child templates, accessibility overrides, layout
weights, A2UI functions, inputs, actions, media/URLs, HTML, CSS, scripts,
unknown properties, deletion messages, multiple surfaces, and all protocol
versions other than the pinned `v0.9.1`.

Streams are bounded to 256 KiB, 32 messages, 80 elements, 12 children per
container, and the ForgeUI graph depth of 12. JSONL parsing also rejects
duplicate object keys.
