# 0002 — Server-owned state and immutable revisions

Status: accepted

Application manifests, data snapshots, and durable UI state are owned by the server. A browser may
hold signed session preferences, but IndexedDB is not the authoritative application store.

Every valid manifest change creates an immutable revision. Updates carry an expected revision;
conflicts return a 409 response instead of silently overwriting another update. Restoring an older
revision creates a new revision that records its parent.

SQLite is the initial store. The repository boundary avoids process-global connections and keeps a
future database replacement out of domain and renderer code.
