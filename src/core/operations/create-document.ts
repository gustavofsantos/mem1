import { randomUUID } from "node:crypto"
import type { Client } from "../db.ts"
import type { Document, DocumentType } from "../types.ts"

type CreateArgs = {
  title: string
  body: string
  tags?: string[]
}

export async function createDocument(
  db: Client,
  type: DocumentType,
  args: CreateArgs,
): Promise<Document> {
  const id = randomUUID()
  const now = new Date().toISOString()
  const tags = args.tags ?? []

  await db.batch([
    {
      sql: `INSERT INTO documents (id, type, title, body, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, type, args.title, args.body, now, now],
    },
    ...tags.map((tag) => ({
      sql: `INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)`,
      args: [tag, now],
    })),
    ...tags.map((tag) => ({
      sql: `INSERT INTO document_tags (document_id, tag) VALUES (?, ?)`,
      args: [id, tag],
    })),
  ])

  return { id, type, title: args.title, body: args.body, archived: false, tags, created_at: now, updated_at: now }
}
