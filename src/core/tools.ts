import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import type { Client } from "./db.ts"
import {
  archiveDocument,
  createFact,
  createIssue,
  createSpike,
  createTerm,
  getDocument,
  getLinks,
  link,
  listDocuments,
  search,
  updateDocument,
  listTags,
  addTag,
} from "./operations/index.ts"

const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
})

const linkLabelSchema = z.enum([
  "relates_to",
  "grounds",
  "produces",
  "depends_on",
  "required_for",
  "defines",
])

const documentTypeSchema = z.enum(["fact", "spike", "term", "issue"])

const createArgs = {
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).optional(),
}

export function registerTools(server: McpServer, db: Client): void {
  server.tool(
    "create_fact",
    "Create a fact — a validated, atomic claim about how something works.",
    createArgs,
    async (args) => text(await createFact(db, args)),
  )

  server.tool(
    "create_spike",
    "Create a spike — an open investigation thread with a central question and findings so far.",
    createArgs,
    async (args) => text(await createSpike(db, args)),
  )

  server.tool(
    "create_term",
    "Create a term — a domain vocabulary definition.",
    createArgs,
    async (args) => text(await createTerm(db, args)),
  )

  server.tool(
    "create_issue",
    "Create an issue — a tracked problem or open question that may block work.",
    createArgs,
    async (args) => text(await createIssue(db, args)),
  )

  server.tool(
    "get_document",
    "Retrieve a document by id, including its tags.",
    { id: z.string() },
    async (args) => text(await getDocument(db, args)),
  )

  server.tool(
    "update_document",
    "Update the title and/or body of a document. At least one field must be provided.",
    { id: z.string(), title: z.string().min(1).optional(), body: z.string().min(1).optional() },
    async (args) => text(await updateDocument(db, args)),
  )

  server.tool(
    "archive_document",
    "Mark a document as archived. Archived documents are excluded from search and list results by default.",
    { id: z.string() },
    async (args) => text(await archiveDocument(db, args)),
  )

  server.tool(
    "search",
    "Full-text search across document titles and bodies. Returns up to 50 results ordered by last update.",
    {
      query: z.string().min(1),
      type: documentTypeSchema.optional(),
      tag: z.string().optional(),
    },
    async (args) => text(await search(db, args)),
  )

  server.tool(
    "link",
    "Create a directed edge between two documents with a typed relationship label.",
    {
      source_id: z.string(),
      target_id: z.string(),
      label: linkLabelSchema,
    },
    async (args) => text(await link(db, args)),
  )

  server.tool(
    "get_links",
    "Get all links connected to a document. Direction defaults to 'both'.",
    {
      id: z.string(),
      direction: z.enum(["outbound", "inbound", "both"]).optional(),
    },
    async (args) => text(await getLinks(db, args)),
  )

  server.tool(
    "list_documents",
    "List documents, optionally filtered by type, tag, or archived status. Excludes archived by default.",
    {
      type: documentTypeSchema.optional(),
      tag: z.string().optional(),
      archived: z.boolean().optional(),
    },
    async (args) => text(await listDocuments(db, args)),
  )

  server.tool(
    "list_tags",
    "List all unique tags in the vault, ordered alphabetically.",
    {},
    async () => text(await listTags(db)),
  )

  server.tool(
    "add_tag",
    "Link a document to a tag. Creates the tag if it does not exist.",
    {
      documentId: z.string(),
      tag: z.string().min(1),
    },
    async (args) => {
      await addTag(db, args)
      return text({ success: true })
    },
  )
}
