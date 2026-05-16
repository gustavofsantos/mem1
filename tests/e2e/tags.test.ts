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

describe("tags", () => {
  test("listing tags returns all unique tags", async () => {
    // Create documents with tags
    await callTool(client, "create_fact", {
      title: "Fact 1",
      body: "Body 1",
      tags: ["tag1", "tag2"],
    })
    await callTool(client, "create_fact", {
      title: "Fact 2",
      body: "Body 2",
      tags: ["tag2", "tag3"],
    })

    const tags = parseResult(await callTool(client, "list_tags", {})) as string[]
    expect(tags).toEqual(["tag1", "tag2", "tag3"])
  })

  test("add_tag links a document to a new tag", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "Fact 1",
      body: "Body 1",
      tags: ["tag1"],
    })) as Record<string, any>

    const result = parseResult(await callTool(client, "add_tag", {
      documentId: doc.id,
      tag: "tag2",
    })) as Record<string, any>

    expect(result.success).toBe(true)

    const updatedDoc = parseResult(await callTool(client, "get_document", { id: doc.id })) as Record<string, any>
    expect(updatedDoc.tags).toContain("tag1")
    expect(updatedDoc.tags).toContain("tag2")

    const tags = parseResult(await callTool(client, "list_tags", {})) as string[]
    expect(tags).toContain("tag1")
    expect(tags).toContain("tag2")
  })

  test("add_tag creates tag if it does not exist", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "Fact 1",
      body: "Body 1",
    })) as Record<string, any>

    await callTool(client, "add_tag", {
      documentId: doc.id,
      tag: "new_tag",
    })

    const tags = parseResult(await callTool(client, "list_tags", {})) as string[]
    expect(tags).toContain("new_tag")
  })
})
