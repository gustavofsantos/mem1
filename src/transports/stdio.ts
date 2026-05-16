import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { applySchema, createStorage } from "../core/db.ts"
import { registerTools } from "../core/tools.ts"

const url = process.env["MEM1_DB_URL"]
if (!url) {
  console.error("MEM1_DB_URL is required")
  process.exit(1)
}

const db = createStorage(url)
await applySchema(db)

const server = new McpServer({ name: "mem1", version: "0.1.0" })
registerTools(server, db)

const transport = new StdioServerTransport()
await server.connect(transport)
process.stdin.resume()

const keepAlive = setInterval(() => {}, 2 ** 31 - 1)
const stop = () => clearInterval(keepAlive)
process.stdin.once("end", stop)
process.stdin.once("close", stop)
