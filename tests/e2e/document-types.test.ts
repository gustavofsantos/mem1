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

// Each document type encodes domain knowledge in its name.
// The operation name tells the model what fields matter without needing the prompt to be explicit.

describe("create_spike", () => {
  test("creates a spike with type=spike", async () => {
    const doc = parseResult(await callTool(client, "create_spike", {
      title: "Investigating Turso embedded replica behavior under concurrent writes",
      body: "Central question: does the embedded replica stay consistent if the remote DB is updated while the local replica is open?",
    })) as Record<string, unknown>

    expect(doc["type"]).toBe("spike")
    expect(doc["archived"]).toBe(false)
  })
})

describe("create_term", () => {
  test("creates a term with type=term", async () => {
    const doc = parseResult(await callTool(client, "create_term", {
      title: "embedded replica",
      body: "A local SQLite file that is kept in sync with a remote Turso database. Reads hit the local file; writes propagate to the remote.",
      tags: ["turso", "libsql", "storage"],
    })) as Record<string, unknown>

    expect(doc["type"]).toBe("term")
    expect(doc["tags"]).toEqual(["turso", "libsql", "storage"])
  })
})

describe("create_issue", () => {
  test("creates an issue with type=issue", async () => {
    const doc = parseResult(await callTool(client, "create_issue", {
      title: "Cloudflare Workers plan tier not confirmed against expected operation volume",
      body: "The invocation limits on free vs. paid plans have not been checked against expected vault operation volume. May need paid plan.",
      tags: ["cloudflare", "infra", "open"],
    })) as Record<string, unknown>

    expect(doc["type"]).toBe("issue")
  })
})
