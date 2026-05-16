# Roadmap

## Done

- **Schema** — `documents`, `document_tags`, `document_links` tables; 6 typed relationship labels
- **11 MCP operations** — `create_fact`, `create_spike`, `create_term`, `create_issue`, `get_document`, `update_document`, `archive_document`, `search`, `link`, `get_links`, `list_documents`
- **stdio transport** — local, no auth; Claude Code spawns the process directly
- **HTTP transport** — bearer token auth; self-hostable on any machine
- **E2E test suite** — 35 tests, each spawning a real stdio server against a temp SQLite DB
- **Typecheck** — strict TypeScript, clean
- **Cloudflare Workers transport** — OAuth 2.0 + PKCE, Turso HTTP API
- **MANUAL.md** — step-by-step deploy guide for all modes

---

## Up next

### Migration script

One-time import from `~/engineering/` into the database. Parses Markdown files, extracts wikilinks as `relates_to` edges. Runs from a local machine directly connected to the production DB. False positives (links inside code blocks, comments) are acceptable — `relates_to` is a weak enough label that extra edges do not corrupt the graph.

---

## Later

### Refactor defining Domain Objects

### Introduce Effect to manage effectful service layer

### FTS5 full-text search

Add `migrations/002_fts.sql`: a virtual FTS5 table with triggers that mirror inserts, updates, and deletes on `documents`. Replace the LIKE-based `search` operation with FTS5 queries. Turso supports FTS5 natively; no additional service needed.

### Backup strategy

A scheduled Cloudflare Worker that exports the Turso database and writes it to R2. Gives versioned, user-owned backups without a separate service. Defer until the Workers transport is live.

### Semantic search

Generate embeddings for document bodies and store them using `sqlite-vec` (built into Turso). Adds a `search_semantic` operation that ranks results by vector similarity rather than keyword overlap. Depends on choosing an embedding model and deciding when embeddings are generated (at write time, lazily, or in batch).

### Vault skill rewrites

Once the server is production-stable and the migration is complete, rewrite the skills that currently use filesystem tools:
- `knowledge` — replace Read/Write/Edit calls with `create_fact`, `get_document`, `search`
- `deep-review` — replace vault reads with `search` + `get_links`
- `dead-reckoning` — same
- `survey` — same
- `dream` — replace vault writes with typed creates

---

## Open questions

- **Cloudflare Workers plan tier** — invocation limits on free vs. paid not checked against expected vault operation volume
- **Turso free tier limits** — storage and row read/write limits not verified against expected vault size
- **Skill indexing** — should the skills themselves be documents in the vault? They have `depends_on` and `required_for` relationships with facts and spikes that are already implicit.
