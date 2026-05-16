import { createClient, type Client } from "@libsql/client"
import { SCHEMA_SQL } from "./schema.ts"

export type { Client }

export function createStorage(url: string, authToken?: string): Client {
  return createClient(authToken !== undefined ? { url, authToken } : { url })
}

export async function applySchema(db: Client): Promise<void> {
  await db.executeMultiple(SCHEMA_SQL)
}
