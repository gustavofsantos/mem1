# Deployment Manual

`mem1` is a personal memory MCP server that can run in three modes. Choose the one that fits your workflow.

---

## 1. Local stdio (easiest)

Best for single-machine use with Claude Desktop or Claude Code.

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Database path**:
   Decide where you want your memory to live (e.g., `~/mem1.db`).

3. **Configure Claude Desktop**:
   Add this to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "mem1": {
         "command": "node",
         "args": [
           "--import",
           "tsx/esm",
           "/absolute/path/to/mem1/src/transports/stdio.ts"
         ],
         "env": {
           "MEM1_DB_URL": "file:/absolute/path/to/your/mem1.db"
         }
       }
     }
   }
   ```

4. **Verify**:
   Restart Claude and try: "Create a fact about my favorite coffee."

---

## 2. Self-hosted HTTP

Best if you want to access your memory from multiple devices but prefer to manage your own server.

### Setup

1. **Run the server**:
   ```bash
   export MEM1_DB_URL="file:/path/to/mem1.db"
   export MEM1_BEARER_TOKEN="your-secret-token"
   export PORT=3000
   npm run server:http
   ```

2. **Configure Claude**:
   Use the HTTP transport with your `MEM1_BEARER_TOKEN` in the `Authorization` header.

---

## 3. Cloudflare Workers (Production)

Best for a permanent, global, highly available vault.

### Prerequisites

1. **Turso Database**: Create a database on [Turso](https://turso.tech) and get the URL and Auth Token.
2. **Cloudflare Account**: You'll need `wrangler` installed and logged in.

### Setup

1. **Create KV Namespace**:
   ```bash
   npx wrangler kv:namespace create OAUTH_KV
   ```

2. **Configure `wrangler.toml`**:
   Create a `wrangler.toml` in the root:
   ```toml
   name = "mem1"
   main = "src/transports/worker.ts"
   compatibility_date = "2024-04-01"
   compatibility_flags = ["global_fetch_strictly_public"]

   [[kv_namespaces]]
   binding = "OAUTH_KV"
   id = "YOUR_KV_NAMESPACE_ID"

   [vars]
   MEM1_ALLOWED_EMAIL = "your@email.com"
   TURSO_URL = "libsql://your-db-name.turso.io"

   # OAUTH_PROVIDER is a service binding provided by the library wrapper
   [[services]]
   binding = "OAUTH_PROVIDER"
   service = "mem1"
   ```

3. **Set Secrets**:
   ```bash
   npx wrangler secret put TURSO_AUTH_TOKEN
   ```

4. **Deploy**:
   ```bash
   npx wrangler deploy
   ```

### Configuration

- **Authorize**: Navigate to `https://mem1.<yourname>.workers.dev/authorize` to start the OAuth flow.
- **MCP URL**: `https://mem1.<yourname>.workers.dev/mcp`

---

## Verification

If you are a developer, you can verify the setup by running the E2E tests:
```bash
npm run test:e2e
```
*Note: E2E tests run against a local SQLite database to ensure reproducibility.*
