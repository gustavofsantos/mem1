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

describe("list_documents", () => {
  test("returns all non-archived documents when called with no filters", async () => {
    await callTool(client, "create_fact", { title: "Fact one", body: "Body." })
    await callTool(client, "create_spike", { title: "Spike one", body: "Body." })

    const list = parseResult(await callTool(client, "list_documents", {})) as unknown[]
    expect(list.length).toBe(2)
  })

  test("filters by document type", async () => {
    await callTool(client, "create_fact", { title: "A fact", body: "Body." })
    await callTool(client, "create_spike", { title: "A spike", body: "Body." })
    await callTool(client, "create_term", { title: "A term", body: "Body." })

    const facts = parseResult(await callTool(client, "list_documents", { type: "fact" })) as unknown[]
    expect(facts.length).toBe(1)
    expect((facts[0] as Record<string, unknown>)["type"]).toBe("fact")
  })

  test("filters by tag", async () => {
    await callTool(client, "create_fact", { title: "Tagged fact", body: "Body.", tags: ["alpha"] })
    await callTool(client, "create_fact", { title: "Untagged fact", body: "Body." })

    const list = parseResult(await callTool(client, "list_documents", { tag: "alpha" })) as unknown[]
    expect(list.length).toBe(1)
    expect((list[0] as Record<string, unknown>)["title"]).toBe("Tagged fact")
  })

  test("does not return archived documents by default", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "About to be archived",
      body: "Body.",
    })) as Record<string, unknown>

    await callTool(client, "archive_document", { id: doc["id"] })

    const list = parseResult(await callTool(client, "list_documents", {})) as unknown[]
    const ids = list.map((d) => (d as Record<string, unknown>)["id"])
    expect(ids).not.toContain(doc["id"])
  })

  test("returns empty array when no documents match", async () => {
    const list = parseResult(await callTool(client, "list_documents", { type: "issue" })) as unknown[]
    expect(list).toEqual([])
  })
})
