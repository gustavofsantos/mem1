import type { Client } from "../db.ts"
import type { Link, LinkLabel } from "../types.ts"

type Args = { id: string; direction?: "outbound" | "inbound" | "both" }

export async function getLinks(db: Client, args: Args): Promise<Link[]> {
  const direction = args.direction ?? "both"

  let sql: string
  let queryArgs: string[]

  if (direction === "outbound") {
    sql = `SELECT * FROM document_links WHERE source_id = ? ORDER BY created_at DESC`
    queryArgs = [args.id]
  } else if (direction === "inbound") {
    sql = `SELECT * FROM document_links WHERE target_id = ? ORDER BY created_at DESC`
    queryArgs = [args.id]
  } else {
    sql = `SELECT * FROM document_links WHERE source_id = ? OR target_id = ? ORDER BY created_at DESC`
    queryArgs = [args.id, args.id]
  }

  const result = await db.execute({ sql, args: queryArgs })

  return result.rows.map((row) => ({
    id: row["id"] as string,
    source_id: row["source_id"] as string,
    target_id: row["target_id"] as string,
    label: row["label"] as LinkLabel,
    created_at: row["created_at"] as string,
  }))
}
