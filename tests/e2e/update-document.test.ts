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

describe("update_document", () => {
  test("updates the title of a document", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "Original title",
      body: "Some body content.",
    })) as Record<string, unknown>

    const updated = parseResult(await callTool(client, "update_document", {
      id: doc["id"],
      title: "Revised title",
    })) as Record<string, unknown>

    expect(updated["title"]).toBe("Revised title")
    expect(updated["body"]).toBe("Some body content.")
  })

  test("updates the body of a document", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "A stable title",
      body: "Old body content.",
    })) as Record<string, unknown>

    const updated = parseResult(await callTool(client, "update_document", {
      id: doc["id"],
      body: "New body content with more detail.",
    })) as Record<string, unknown>

    expect(updated["title"]).toBe("A stable title")
    expect(updated["body"]).toBe("New body content with more detail.")
  })

  test("updated_at advances after an update", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "Timestamped fact",
      body: "Body.",
    })) as Record<string, unknown>

    await new Promise((r) => setTimeout(r, 10))

    const updated = parseResult(await callTool(client, "update_document", {
      id: doc["id"],
      title: "Updated title",
    })) as Record<string, unknown>

    expect(updated["updated_at"] > doc["updated_at"]!).toBe(true)
  })

  test("returns isError when neither title nor body is provided", async () => {
    const doc = parseResult(await callTool(client, "create_fact", {
      title: "Fact",
      body: "Body.",
    })) as Record<string, unknown>

    const result = await callTool(client, "update_document", { id: doc["id"] })
    expect(result.isError).toBe(true)
  })
})
