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

describe("archive_document", () => {
  test("archives a document and excludes it from list results", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "A fact to be archived",
      body: "This will be archived.",
    })) as Record<string, unknown>

    await callTool(client, "archive_document", { id: doc["id"] })

    const list = parseResult(await callTool(client, "list_documents", {})) as unknown[]
    const ids = list.map((d) => (d as Record<string, unknown>)["id"])
    expect(ids).not.toContain(doc["id"])
  })

  test("archived documents appear when archived:true is passed to list_documents", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "Archived fact",
      body: "This is archived.",
    })) as Record<string, unknown>

    await callTool(client, "archive_document", { id: doc["id"] })

    const list = parseResult(await callTool(client, "list_documents", { archived: true })) as unknown[]
    const ids = list.map((d) => (d as Record<string, unknown>)["id"])
    expect(ids).toContain(doc["id"])
  })

  test("returns isError for an unknown document id", async () => {
    const result = await callTool(client, "archive_document", { id: "does-not-exist" })
    expect(result.isError).toBe(true)
  })
})
