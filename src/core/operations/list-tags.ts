import type { Client } from "../db.ts"

export async function listTags(db: Client): Promise<string[]> {
  const result = await db.execute("SELECT name FROM tags ORDER BY name ASC")
  return result.rows.map((row) => row.name as string)
}
