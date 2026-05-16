import { test, expect } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import { execSync } from "node:child_process"

test("debug spawn in vitest", async () => {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  console.log("__dirname:", __dirname)
  console.log("cwd:", process.cwd())

  const PROJECT = "/home/gsantos/Projects/mem1"
  const ENTRY = resolve(PROJECT, "src/transports/stdio.ts")
  const dbPath = `/tmp/dbg-${randomUUID()}.db`

  console.log("ENTRY:", ENTRY)
  console.log("dbPath:", dbPath)

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx/esm", ENTRY],
    env: { ...process.env, MEM1_DB_URL: `file:${dbPath}` },
  })

  const client = new Client({ name: "t", version: "0.0.1" }, { capabilities: {} })
  
  console.log("calling connect...")
  try {
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => setTimeout(() => reject(new Error("connect timeout")), 10_000))
    ])
    console.log("connected!")
    const tools = await Promise.race([
      client.listTools(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("listTools timeout")), 5_000))
    ])
    console.log("tools:", (tools as any).tools.length)
    await client.close()
    expect(true).toBe(true)
  } catch (e: any) {
    console.error("FAILED:", e.message)
    throw e
  }
}, 30_000)
