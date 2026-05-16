# Roadmap

## Done

- **Schema** — `documents`, `document_tags`, `document_links` tables; 6 typed relationship labels
- **11 MCP operations** — `create_fact`, `create_spike`, `create_term`, `create_issue`, `get_document`, `update_document`, `archive_document`, `search`, `link`, `get_links`, `list_documents`
- **stdio transport** — local, no auth; Claude Code spawns the process directly
- **HTTP transport** — bearer token auth; self-hostable on any machine
- **E2E test suite** — 35 tests, each spawning a real stdio server against a temp SQLite DB
- **Typecheck** — strict TypeScript, clean

---

## Up next

### Cloudflare Workers transport

Implement `src/transports/worker.ts` using `@cloudflare/workers-oauth-provider` for OAuth 2.0 + PKCE. `src/auth/oauth.ts` is the pluggable identity check — the one function a self-hoster replaces. Connect to Turso via the `@libsql/client` HTTP API (no native modules in Workers). Bind `TURSO_URL` and `TURSO_AUTH_TOKEN` as Wrangler secrets.

E2E tests for this transport should run against `wrangler dev` + a local SQLite — not real Turso — so they stay reproducible.

### MANUAL.md

Step-by-step deploy guide covering all three modes:
- **Local stdio** — install, configure Claude Code, first `create_fact`
- **Self-hosted HTTP** — run the HTTP server, generate a bearer token, configure Claude Code
- **Cloudflare Workers** — `wrangler deploy`, set secrets, configure OAuth identity, configure claude.ai

The manual should mirror the E2E test setup exactly. If the tests pass, the manual is correct.

### Migration script

One-time import from `~/engineering/` into the database. Parses Markdown files, extracts wikilinks as `relates_to` edges. Runs from a local machine directly connected to the production DB. False positives (links inside code blocks, comments) are acceptable — `relates_to` is a weak enough label that extra edges do not corrupt the graph.

---

## Later

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
