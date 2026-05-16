import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { createServer } from "node:http"
import { validateBearer } from "../auth/bearer.ts"
import { applySchema, createStorage } from "../core/db.ts"
import { registerTools } from "../core/tools.ts"

const url = process.env["MEM1_DB_URL"]
const bearerToken = process.env["MEM1_BEARER_TOKEN"]
const port = Number(process.env["PORT"] ?? 3000)

if (!url) {
  console.error("MEM1_DB_URL is required")
  process.exit(1)
}
if (!bearerToken) {
  console.error("MEM1_BEARER_TOKEN is required")
  process.exit(1)
}

const db = createStorage(url)
await applySchema(db)

const server = new McpServer({ name: "mem1", version: "0.1.0" })
registerTools(server, db)

const transport = new StreamableHTTPServerTransport({})
await server.connect(transport)

const httpServer = createServer(async (req, res) => {
  if (!validateBearer(req.headers["authorization"] ?? null, bearerToken)) {
    res.writeHead(401, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "Unauthorized" }))
    return
  }
  await transport.handleRequest(req, res)
})

httpServer.listen(port, () => {
  console.error(`mem1 HTTP server listening on :${port}`)
})
