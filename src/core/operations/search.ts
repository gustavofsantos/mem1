import type { InValue } from "@libsql/client"
import type { Client } from "../db.ts"
import type { Document, DocumentType } from "../types.ts"

type Args = { query: string; type?: DocumentType; tag?: string }

export async function search(db: Client, args: Args): Promise<Document[]> {
  const like = `%${args.query}%`
  const conditions: string[] = [
    `archived = 0`,
    `(d.title LIKE ? OR d.body LIKE ?)`,
  ]
  const queryArgs: InValue[] = [like, like]

  if (args.type) {
    conditions.push(`d.type = ?`)
    queryArgs.push(args.type)
  }

  if (args.tag) {
    conditions.push(`EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id = d.id AND dt.tag = ?)`)
    queryArgs.push(args.tag)
  }

  const result = await db.execute({
    sql: `SELECT d.* FROM documents d WHERE ${conditions.join(" AND ")} ORDER BY d.updated_at DESC LIMIT 50`,
    args: queryArgs,
  })

  if (result.rows.length === 0) return []

  const ids = result.rows.map((r) => r["id"] as string)
  const tagsResult = await db.execute({
    sql: `SELECT document_id, tag FROM document_tags WHERE document_id IN (${ids.map(() => "?").join(",")})`,
    args: ids,
  })

  const tagsByDoc = new Map<string, string[]>()
  for (const row of tagsResult.rows) {
    const docId = row["document_id"] as string
    const existing = tagsByDoc.get(docId) ?? []
    existing.push(row["tag"] as string)
    tagsByDoc.set(docId, existing)
  }

  return result.rows.map((row) => ({
    id: row["id"] as string,
    type: row["type"] as DocumentType,
    title: row["title"] as string,
    body: row["body"] as string,
    archived: row["archived"] === 1,
    tags: tagsByDoc.get(row["id"] as string) ?? [],
    created_at: row["created_at"] as string,
    updated_at: row["updated_at"] as string,
  }))
}
