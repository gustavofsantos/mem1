import { afterEach, beforeEach, describe, expect, test } from "vitest"
import type { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { callTool, parseResult, startStdioServer, type ServerHandle } from "./helpers.ts"

let handle: ServerHandle
let client: Client

beforeEach(async () => {
  handle = await startStdioServer()
  client = handle.client
})

afterEach(async () => {
  await handle.cleanup()
})

describe("create_fact", () => {
  test("creates a fact with title and body only", async () => {
    const result = await callTool(client, "create_fact", {
      title: "libSQL accepts file: and libsql: URL schemes",
      body: "The @libsql/client package routes to different backends based on the URL scheme, making local and remote storage transparent to application code.",
    })

    const doc = parseResult(result) as Record<string, unknown>
    expect(doc["type"]).toBe("fact")
    expect(doc["title"]).toBe("libSQL accepts file: and libsql: URL schemes")
    expect(doc["body"]).toContain("@libsql/client")
    expect(doc["archived"]).toBe(false)
    expect(doc["tags"]).toEqual([])
    expect(typeof doc["id"]).toBe("string")
    expect(typeof doc["created_at"]).toBe("string")
    expect(typeof doc["updated_at"]).toBe("string")
  })

  test("creates a fact with tags", async () => {
    const result = await callTool(client, "create_fact", {
      title: "Cloudflare Workers run in V8 isolates",
      body: "Workers expose standard Web Platform APIs: fetch, crypto, URL. No Node.js runtime.",
      tags: ["cloudflare", "workers", "runtime"],
    })

    const doc = parseResult(result) as Record<string, unknown>
    expect(doc["tags"]).toEqual(["cloudflare", "workers", "runtime"])
  })

  test("each fact gets a unique id", async () => {
    const a = parseResult(await callTool(client, "create_fact", {
      title: "First fact",
      body: "Body of the first fact.",
    })) as Record<string, unknown>

    const b = parseResult(await callTool(client, "create_fact", {
      title: "Second fact",
      body: "Body of the second fact.",
    })) as Record<string, unknown>

    expect(a["id"]).not.toBe(b["id"])
  })

  test("returns an error when title is missing", async () => {
    const result = await callTool(client, "create_fact", { body: "No title here." })
    expect(result.isError).toBe(true)
  })

  test("returns an error when body is missing", async () => {
    const result = await callTool(client, "create_fact", { title: "No body here." })
    expect(result.isError).toBe(true)
  })
})
