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

describe("get_document", () => {
  test("retrieves a fact by id with all fields", async () => {
    const created = parseResult(await callTool(client, "create_fact", {
      title: "SQLite FTS5 enables full-text search without a separate service",
      body: "FTS5 is built into SQLite and available in libSQL/Turso.",
      tags: ["sqlite", "search"],
    })) as Record<string, unknown>

    const fetched = parseResult(await callTool(client, "get_document", {
      id: created["id"],
    })) as Record<string, unknown>

    expect(fetched["id"]).toBe(created["id"])
    expect(fetched["title"]).toBe(created["title"])
    expect(fetched["body"]).toBe(created["body"])
    expect(fetched["type"]).toBe("fact")
    expect(fetched["tags"]).toEqual(["sqlite", "search"])
    expect(fetched["archived"]).toBe(false)
  })

  test("returns isError for an unknown id", async () => {
    const result = await callTool(client, "get_document", { id: "does-not-exist" })
    expect(result.isError).toBe(true)
  })
})
