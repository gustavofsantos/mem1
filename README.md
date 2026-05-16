# mem1

A personal memory server exposed as an MCP (Model Context Protocol) tool set.

Stores facts, spikes, terms, and issues in a SQLite database with typed relationships between them. Runs locally as a stdio process or as an HTTP server with bearer token auth. Designed to be hosted on Cloudflare Workers with OAuth for remote access from claude.ai.

---

## Why this exists

My engineering work lives in `~/engineering/` — a directory of Markdown files linked together with wikilinks. Spikes have open threads. Facts reference terms. Issues block work. The graph is real, but it is implicit: it lives in prose and wikilinks that only humans (and file-reading models) can traverse.

The model that helps me daily uses filesystem tools to read and write those files. That works, but it has costs:

- **The domain knowledge is in the prompts, not the operations.** Every skill that touches the vault carries instructions about what fields a spike needs, how facts differ from issues, when to use `required_for` vs `depends_on`. Those instructions are invisible to the model at the point of use and drift as the vault evolves.
- **The graph is implicit.** Wikilinks are not edges. There is no way to ask "what facts does this spike produce?" without reading prose and inferring.
- **There is no remote access.** The vault is on one machine. Mobile sessions are read-only at best.

This server makes the structure explicit. Named operations (`create_fact`, `create_spike`, `create_term`, `create_issue`) carry the domain knowledge that today lives in skill prompts — the model can infer the right operation from natural language without needing the prompt to be explicit about fields. Relationships between documents are first-class edges with typed labels. The storage backend is an implementation detail behind the MCP protocol.

The filesystem skills stay as-is until this server is production-stable, then a one-time migration script replaces them. No dual-write period.

---

## Operations

Eleven tools, split by purpose:

**Named creates** — encode domain knowledge in the operation name:

| Tool | What it stores |
|---|---|
| `create_fact` | A validated, atomic claim about how something works |
| `create_spike` | An open investigation thread with a central question |
| `create_term` | A domain vocabulary definition |
| `create_issue` | A tracked problem or open question that may block work |

**Generic operations** — work across all document types:

| Tool | What it does |
|---|---|
| `get_document` | Retrieve a document by id, including tags |
| `update_document` | Update title and/or body |
| `archive_document` | Soft-delete; excluded from search and lists by default |
| `search` | LIKE-based full-text search, filterable by type and tag |
| `link` | Create a directed edge between two documents |
| `get_links` | Get all edges connected to a document |
| `list_documents` | List documents, filterable by type, tag, archived status |

**Relationship labels** for `link`: `relates_to`, `grounds`, `produces`, `depends_on`, `required_for`, `defines`.

---

## Storage

One adapter, two modes:

```
file:/home/user/.mem1/db.sqlite    → local SQLite via libSQL
libsql://[db].turso.io             → Turso via libSQL HTTP API
```

Same `createStorage(url, authToken?)` call in both cases. Three tables:

- `documents` — id, type, title, body, archived, created\_at, updated\_at
- `document_tags` — document\_id, tag
- `document_links` — id, source\_id, target\_id, label, created\_at

Schema is applied at server startup. Migrations are plain SQL files in `migrations/`.

---

## Transports

### stdio (local)

Claude Code spawns the server as a child process. No auth — if you can run the process, you have access.

```json
{
  "mcpServers": {
    "mem1": {
      "command": "node",
      "args": ["--import", "tsx/esm", "/path/to/mem1/src/transports/stdio.ts"],
      "env": {
        "MEM1_DB_URL": "file:/home/user/.mem1/db.sqlite"
      }
    }
  }
}
```

### HTTP (self-hosted)

An HTTP server with `Authorization: Bearer <token>` auth. Run it on any machine; point Claude Code at it.

```
MEM1_DB_URL=file:/home/user/.mem1/db.sqlite \
MEM1_BEARER_TOKEN=your-secret-token \
PORT=3000 \
node --import tsx/esm src/transports/http.ts
```

Claude Code config:

```json
{
  "mcpServers": {
    "mem1": {
      "url": "http://localhost:3000/mcp",
      "headers": { "Authorization": "Bearer your-secret-token" }
    }
  }
}
```

### Cloudflare Workers (remote, with OAuth)

Not yet implemented. Will use `@cloudflare/workers-oauth-provider` for OAuth 2.0 + PKCE, connecting to a Turso database via the libSQL HTTP API. The identity check (`src/auth/oauth.ts`) is the one function a self-hoster replaces to control who is allowed in.

---

## E2E tests

The test suite is the documentation. Each test file covers one operation group; test names are readable scenarios, not code coverage labels.

```
tests/e2e/
  create-fact.test.ts       creates a fact with title and body only
                            creates a fact with tags
                            each fact gets a unique id
                            returns an error when title is missing
  get-document.test.ts      retrieves a fact by id with all fields
                            returns isError for an unknown id
  update-document.test.ts   updates the title of a document
                            updated_at advances after an update
  archive-document.test.ts  archives a document and excludes it from list results
                            archived documents appear when archived:true is passed
  search.test.ts            finds documents whose title matches the query
                            filters results by document type
                            excludes archived documents
  link.test.ts              creates a directed edge between two documents
                            supports all six relationship labels
                            returns outbound / inbound / both-direction links
  list-documents.test.ts    returns all non-archived documents with no filters
                            filters by document type
                            filters by tag
  document-types.test.ts    create_spike / create_term / create_issue
```

Each test spawns a real stdio server process against a temporary SQLite database — no mocks, no in-process shortcuts. If you can run the tests, you understand what the server does and how to deploy it.

```
npm test
```

---

## Structure

```
src/
  core/
    types.ts          Document, Link, DocumentType, LinkLabel
    schema.ts         Inlined SQL (works in Node.js and Cloudflare Workers)
    db.ts             createStorage(), applySchema()
    operations/       One file per operation, plain async functions
    tools.ts          registerTools(server, db) — wires all 11 ops to MCP
  transports/
    stdio.ts          Stdio server
    http.ts           HTTP server with bearer token middleware
    worker.ts         Cloudflare Workers stub
  auth/
    bearer.ts         validateBearer() — used by HTTP transport
    oauth.ts          isAuthorizedUser() — pluggable identity check for Workers
migrations/
  001_initial.sql     Schema
tests/
  e2e/
    helpers.ts        startStdioServer() — spawns process, returns MCP client
```

---

## Tech

- [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk) — MCP server, client, transports
- [`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts) — SQLite locally, Turso remotely
- [`hono`](https://hono.dev) — HTTP server (runs in Node.js and Cloudflare Workers)
- [`zod`](https://zod.dev) — tool input validation
- [`vitest`](https://vitest.dev) — test runner
- [`tsx`](https://github.com/privatenumber/tsx) — run TypeScript without a compile step

---

## What's next

- Cloudflare Workers transport with OAuth 2.0
- `MANUAL.md` — step-by-step deploy guide for local stdio, local HTTP, and Cloudflare Workers
- Migration script: parse `~/engineering/` wikilinks into the database (`relates_to` edges)
- Rewrite vault skills to call MCP operations instead of filesystem tools
