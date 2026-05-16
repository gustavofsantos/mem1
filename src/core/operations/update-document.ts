import type { Client } from "../db.ts"
import type { Document } from "../types.ts"
import { getDocument } from "./get-document.ts"

type Args = { id: string; title?: string; body?: string }

export async function updateDocument(db: Client, args: Args): Promise<Document> {
  const now = new Date().toISOString()

  if (args.title === undefined && args.body === undefined) {
    throw new Error("At least one of title or body must be provided")
  }

  if (args.title !== undefined && args.body !== undefined) {
    await db.execute({
      sql: `UPDATE documents SET title = ?, body = ?, updated_at = ? WHERE id = ?`,
      args: [args.title, args.body, now, args.id],
    })
  } else if (args.title !== undefined) {
    await db.execute({
      sql: `UPDATE documents SET title = ?, updated_at = ? WHERE id = ?`,
      args: [args.title, now, args.id],
    })
  } else {
    await db.execute({
      sql: `UPDATE documents SET body = ?, updated_at = ? WHERE id = ?`,
      args: [args.body!, now, args.id],
    })
  }

  return getDocument(db, { id: args.id })
}
