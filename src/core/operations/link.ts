import { randomUUID } from "node:crypto"
import type { Client } from "../db.ts"
import type { Link, LinkLabel } from "../types.ts"

type Args = { source_id: string; target_id: string; label: LinkLabel }

export async function link(db: Client, args: Args): Promise<Link> {
  const id = randomUUID()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO document_links (id, source_id, target_id, label, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, args.source_id, args.target_id, args.label, now],
  })

  return { id, source_id: args.source_id, target_id: args.target_id, label: args.label, created_at: now }
}
