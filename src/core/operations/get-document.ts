import type { Client } from "../db.ts"
import type { Document } from "../types.ts"

export async function getDocument(db: Client, args: { id: string }): Promise<Document> {
  const results = await db.batch([
    { sql: `SELECT * FROM documents WHERE id = ?`, args: [args.id] },
    { sql: `SELECT tag FROM document_tags WHERE document_id = ? ORDER BY rowid`, args: [args.id] },
  ])
  // batch guarantees one ResultSet per statement
  const docResult = results[0]!
  const tagsResult = results[1]!

  const row = docResult.rows[0]
  if (!row) throw new Error(`Document not found: ${args.id}`)

  return {
    id: row["id"] as string,
    type: row["type"] as Document["type"],
    title: row["title"] as string,
    body: row["body"] as string,
    archived: row["archived"] === 1,
    tags: tagsResult.rows.map((r) => r["tag"] as string),
    created_at: row["created_at"] as string,
    updated_at: row["updated_at"] as string,
  }
}
