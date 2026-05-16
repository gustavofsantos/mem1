import type { InValue } from "@libsql/client"
import type { Client } from "../db.ts"
import type { Document, DocumentType } from "../types.ts"

type Args = { type?: DocumentType; tag?: string; archived?: boolean }

export async function listDocuments(db: Client, args: Args): Promise<Document[]> {
  const conditions: string[] = []
  const queryArgs: InValue[] = []

  const archived = args.archived ?? false
  conditions.push(`d.archived = ?`)
  queryArgs.push(archived ? 1 : 0)

  if (args.type) {
    conditions.push(`d.type = ?`)
    queryArgs.push(args.type)
  }

  if (args.tag) {
    conditions.push(`EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id = d.id AND dt.tag = ?)`)
    queryArgs.push(args.tag)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const result = await db.execute({
    sql: `SELECT d.* FROM documents d ${where} ORDER BY d.updated_at DESC`,
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
