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

async function createFact(c: Client, title: string) {
  return parseResult(await callTool(c, "create_fact", { title, body: `Body of: ${title}` })) as Record<string, unknown>
}

describe("link", () => {
  test("creates a directed edge between two documents", async () => {
    const spike = parseResult(await callTool(client, "create_spike", {
      title: "Investigating Turso replication",
      body: "Open question: how does embedded replica sync behave under concurrent writes?",
    })) as Record<string, unknown>

    const fact = await createFact(client, "libSQL embedded replica syncs on write")

    const edge = parseResult(await callTool(client, "link", {
      source_id: spike["id"],
      target_id: fact["id"],
      label: "produces",
    })) as Record<string, unknown>

    expect(edge["source_id"]).toBe(spike["id"])
    expect(edge["target_id"]).toBe(fact["id"])
    expect(edge["label"]).toBe("produces")
    expect(typeof edge["id"]).toBe("string")
  })

  test("supports all six relationship labels", async () => {
    const labels = ["relates_to", "grounds", "produces", "depends_on", "required_for", "defines"] as const
    const docs = await Promise.all(labels.map((l) => createFact(client, `Doc for ${l}`)))

    const source = docs[0]!
    for (let i = 1; i < docs.length; i++) {
      const edge = parseResult(await callTool(client, "link", {
        source_id: source["id"],
        target_id: docs[i]!["id"],
        label: labels[i],
      })) as Record<string, unknown>
      expect(edge["label"]).toBe(labels[i])
    }
  })
})

describe("get_links", () => {
  test("returns outbound links from a document", async () => {
    const a = await createFact(client, "Source fact")
    const b = await createFact(client, "Target fact")
    await callTool(client, "link", { source_id: a["id"], target_id: b["id"], label: "grounds" })

    const links = parseResult(await callTool(client, "get_links", {
      id: a["id"],
      direction: "outbound",
    })) as unknown[]

    expect(links.length).toBe(1)
    expect((links[0] as Record<string, unknown>)["target_id"]).toBe(b["id"])
  })

  test("returns inbound links to a document", async () => {
    const a = await createFact(client, "Upstream fact")
    const b = await createFact(client, "Downstream fact")
    await callTool(client, "link", { source_id: a["id"], target_id: b["id"], label: "required_for" })

    const links = parseResult(await callTool(client, "get_links", {
      id: b["id"],
      direction: "inbound",
    })) as unknown[]

    expect(links.length).toBe(1)
    expect((links[0] as Record<string, unknown>)["source_id"]).toBe(a["id"])
  })

  test("returns all links (both directions) when direction is omitted", async () => {
    const center = await createFact(client, "Central fact")
    const left = await createFact(client, "Left fact")
    const right = await createFact(client, "Right fact")

    await callTool(client, "link", { source_id: left["id"], target_id: center["id"], label: "relates_to" })
    await callTool(client, "link", { source_id: center["id"], target_id: right["id"], label: "relates_to" })

    const links = parseResult(await callTool(client, "get_links", { id: center["id"] })) as unknown[]
    expect(links.length).toBe(2)
  })

  test("returns empty array for a document with no links", async () => {
    const doc = await createFact(client, "Isolated fact")
    const links = parseResult(await callTool(client, "get_links", { id: doc["id"] })) as unknown[]
    expect(links).toEqual([])
  })
})
