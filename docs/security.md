# Security model

ForgeUI treats manifests, LLM candidates, briefs, device labels, stored display text, action
events, and source payloads as untrusted data. The product constrains their meaning; it does not
attempt to sanitize a general-purpose web-programming language.

## Model and renderer boundary

- Strict Pydantic models reject extra keys and unsafe structural fields.
- Manifests cannot carry HTML, Jinja, JavaScript, CSS/Tailwind classes, URLs, SQL, filesystem
  paths, SVG paths, callback code, or source credentials.
- The catalog selects fixed props models and fixed Jinja templates. Jinja autoescaping is enabled;
  a model value cannot select a template or a `safe` path.
- Expressions are a bounded JSON AST. Evaluation is pure and synchronous, with no imports,
  reflection, attribute traversal, callbacks, or side effects.
- Actions write only declared writable state, use fixed navigation/modal/toast types, or refer to
  server-registered capability names. An unknown capability is denied.
- Trusted chart code creates bounded server SVG; the model never supplies SVG markup.

## Generation safety

The configured Ollama base URL and model tag are settings, not request or manifest inputs. Provider
responses are capped, parsed using deterministic JSON-envelope handling, semantically validated,
and dry-rendered. There is one initial attempt plus at most two repair attempts; repeated
candidates stop early. Invalid content is not persisted or rendered, and a failure leaves the
last-known-good revision active.

## HTTP and browser controls

- Production startup rejects the built-in secret and a missing admin token unless the explicit
  insecure-production override is set.
- Bearer admin authentication is supported for API clients. Browser administration uses a signed,
  HttpOnly, `SameSite=Lax` cookie; set `FORGEUI_SECURE_COOKIES=true` behind HTTPS.
- Unsafe browser requests require the server-derived CSRF token. Bearer requests follow the
  authenticated API path without the cookie CSRF mechanism.
- Trusted-host middleware, request-size enforcement, per-client in-memory rate limits, and request
  IDs are installed by the application factory.
- The app emits CSP, frame denial, content-type, referrer, and permissions-policy headers. CSP
  allows configured CDN origins when CDN assets are selected and keeps browser `connect-src`
  same-origin.
- Normal pages deny framing. Only trusted `embed` and `chat` surface routes use the configured
  exact `FORGEUI_FRAME_ANCESTORS` list; wildcards and origin paths are rejected.
- Stateless interactions carry a fully declared, type-checked state snapshot and cannot persist
  state or invoke capabilities. This makes their render-only POST transport safe without a session
  CSRF token for cross-origin artifact frames.

Current rate limits are in-memory and process-local: read 240/minute, ordinary mutations
80/minute, login 12/minute, and generation 12/minute per client address. Place a trusted reverse
proxy/rate limiter in front of production traffic; the application does not trust arbitrary
forwarded-client headers.

## Data and persistence

Every registered source result is strict-Pydantic validated, canonicalized as JSON, detached from
handler-owned objects, and size bounded before rendering. The model and manifest receive only a
source ID, contract ID, and allowed expression paths. URLs, credentials, handlers, database
objects, and authorization rules remain in the frozen host registry. Fixed HTTP adapters require
trusted HTTPS configuration, disable redirects, require JSON objects, and stream through a byte
limit. Source authorizers run before handlers.

Device snapshots additionally validate against `device-health/1`, are checksummed, and have
bounded collections. Device queries use a small allowlist of filters and projection fields; user
values are bound data, never SQL syntax. SQLite uses foreign keys, file-backed WAL, and a busy
timeout. Manifest revisions are append-only through the service layer and pointer updates use an
optimistic revision condition.

Executable capabilities require a host authorizer, can require confirmation and strict input, and
cannot run in stateless mode. A host-supplied `Principal` must come from verified middleware state,
never from request or model fields. Source/capability handlers are trusted code and remain
responsible for tenant scoping, object-level authorization, secret hygiene, timeouts, and audit.

Do not place secrets in display text, generation briefs, manifest state, device snapshots, or audit
payloads. ForgeUI avoids logging raw payloads by default; host capability implementations must keep
the same discipline.

## Deployment responsibilities

Terminate TLS before exposing the service, set a unique secret/token, restrict `TRUSTED_HOSTS`,
decide public-read policy deliberately, retain `/data`, and protect the database volume. The default
Compose file binds only loopback. An external Ollama server is a trusted deployment dependency;
network isolation and access control for that endpoint are the operator's responsibility.
