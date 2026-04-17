# ADR 0001 — Ring 2 interfaces land in open source first

Status: Accepted
Date: 2026-04-17

## Context

Forge uses an open-core model. Ring 1 (browser runtime) and Ring 2
(self-hostable server) are MIT-licensed. Ring 3 is a commercial managed
service implemented as an adapter over Ring 2's interfaces.

The risk in open-core is that the commercial tier silently accrues
capabilities the community cannot self-host, even though each capability
individually looks justified. Over time this hollows out the OSS
product, and adopters who trusted Rings 1+2 discover that serious
deployments require Ring 3. Trust erodes; the moat becomes the
community's exit.

## Decision

Any new interface, protocol, or contract that Ring 3 depends on MUST
ship in the MIT-licensed Ring 2 first. Ring 3 may implement those
interfaces differently (for example, backed by Durable Objects instead
of SQLite, or V8 isolates instead of process sandboxing) but MAY NOT
extend them with capabilities unavailable to a self-hoster.

Proprietary differentiation in Ring 3 is limited to operational
concerns: deployment automation, global edge deployment, compliance
tooling, SLA, managed updates, support. Never format. Never protocol.
Never capability.

## Consequences

- Ring 3 shipping velocity is gated by the Ring 2 release cadence. Every
  feature pays an open-source tax first.
- Commercial roadmap is constrained by what we are willing to
  maintain in MIT-licensed code indefinitely.
- Community adopters get a durable guarantee that self-hosting is not a
  second-class path. Forge's promise — "your data stays on your
  device, or on your server, or in your region, depending on which
  ring you adopt" — remains credible.
- If we ever need an exception (for example, a dependency we cannot
  license compatibly), it requires a superseding ADR.

## Precedent and references

- The v2 architecture doc, §2 and §14, described Ring 3 as an "adapter
  implementation of Ring 2's interfaces." This ADR converts that
  implicit framing into a binding commitment.
- Relevant prior art: GitLab's "stewardship promises," the Sentry
  license debate (2019), and the Elastic/MongoDB license shifts this
  rule is explicitly designed to prevent Forge from repeating.
