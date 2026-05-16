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

describe("search", () => {
  test("finds documents whose title matches the query", async () => {
    await callTool(client, "create_fact", {
      title: "Turso uses libSQL under the hood",
      body: "libSQL is a fork of SQLite with replication support.",
    })
    await callTool(client, "create_fact", {
      title: "Cloudflare Workers use V8 isolates",
      body: "Workers do not use Node.js.",
    })

    const results = parseResult(await callTool(client, "search", { query: "Turso" })) as unknown[]
    const titles = results.map((d) => (d as Record<string, unknown>)["title"])
    expect(titles).toContain("Turso uses libSQL under the hood")
    expect(titles).not.toContain("Cloudflare Workers use V8 isolates")
  })

  test("finds documents whose body matches the query", async () => {
    await callTool(client, "create_fact", {
      title: "A storage fact",
      body: "embedded replica syncing is the key feature of Turso for local machines",
    })

    const results = parseResult(await callTool(client, "search", { query: "embedded replica" })) as unknown[]
    expect(results.length).toBeGreaterThan(0)
  })

  test("filters results by document type", async () => {
    await callTool(client, "create_fact", { title: "libSQL fact", body: "libSQL is a SQLite fork." })
    await callTool(client, "create_spike", { title: "libSQL spike", body: "Investigating libSQL replication." })

    const results = parseResult(await callTool(client, "search", { query: "libSQL", type: "fact" })) as unknown[]
    const types = results.map((d) => (d as Record<string, unknown>)["type"])
    expect(types.every((t) => t === "fact")).toBe(true)
  })

  test("filters results by tag", async () => {
    await callTool(client, "create_fact", {
      title: "Tagged libSQL fact",
      body: "libSQL body.",
      tags: ["libsql"],
    })
    await callTool(client, "create_fact", {
      title: "Untagged libSQL fact",
      body: "libSQL body.",
    })

    const results = parseResult(await callTool(client, "search", { query: "libSQL", tag: "libsql" })) as unknown[]
    expect(results.length).toBe(1)
    expect((results[0] as Record<string, unknown>)["title"]).toBe("Tagged libSQL fact")
  })

  test("excludes archived documents", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "A fact that will be archived",
      body: "This document is about archival.",
    })) as Record<string, unknown>

    await callTool(client, "archive_document", { id: doc["id"] })

    const results = parseResult(await callTool(client, "search", { query: "archival" })) as unknown[]
    const ids = results.map((d) => (d as Record<string, unknown>)["id"])
    expect(ids).not.toContain(doc["id"])
  })

  test("returns empty array when no documents match", async () => {
    const results = parseResult(await callTool(client, "search", { query: "xyzzy-nonexistent" })) as unknown[]
    expect(results).toEqual([])
  })
})
