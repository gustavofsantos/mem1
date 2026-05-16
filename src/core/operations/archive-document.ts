import type { Client } from "../db.ts"

export async function archiveDocument(db: Client, args: { id: string }): Promise<{ id: string }> {
  const result = await db.execute({
    sql: `UPDATE documents SET archived = 1, updated_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), args.id],
  })

  if (result.rowsAffected === 0) throw new Error(`Document not found: ${args.id}`)

  return { id: args.id }
}
