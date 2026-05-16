import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { unlinkSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import { resolve, dirname } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, "../..")
const STDIO_ENTRY = resolve(PROJECT_ROOT, "src/transports/stdio.ts")

export type ServerHandle = {
  client: Client
  cleanup: () => Promise<void>
}

export async function startStdioServer(): Promise<ServerHandle> {
  const dbPath = `/tmp/mem1-test-${randomUUID()}.db`

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx/esm", STDIO_ENTRY],
    env: { ...process.env, MEM1_DB_URL: `file:${dbPath}` },
  })

  const client = new Client({ name: "mem1-test", version: "0.0.1" }, { capabilities: {} })
  await client.connect(transport)

  return {
    client,
    async cleanup() {
      await client.close()
      try { unlinkSync(dbPath) } catch { /* already gone */ }
    },
  }
}

export function parseResult(result: Awaited<ReturnType<Client["callTool"]>>): unknown {
  const first = result.content[0]
  if (!first || first.type !== "text") throw new Error("Expected text content")
  return JSON.parse(first.text)
}

export function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
): ReturnType<Client["callTool"]> {
  return client.callTool({ name, arguments: args })
}
