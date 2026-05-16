import type { Client } from "../db.ts"

type Args = { documentId: string; tag: string }

export async function addTag(db: Client, args: Args): Promise<void> {
  const now = new Date().toISOString()
  
  await db.batch([
    {
      sql: "INSERT OR IGNORE INTO tags (name, created_at) VALUES (?, ?)",
      args: [args.tag, now],
    },
    {
      sql: "INSERT OR IGNORE INTO document_tags (document_id, tag) VALUES (?, ?)",
      args: [args.documentId, args.tag],
    },
    {
      sql: "UPDATE documents SET updated_at = ? WHERE id = ?",
      args: [now, args.documentId],
    }
  ])
}
