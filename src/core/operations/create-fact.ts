import type { Client } from "../db.ts"
import type { Document } from "../types.ts"
import { createDocument } from "./create-document.ts"

type Args = { title: string; body: string; tags?: string[] }

export function createFact(db: Client, args: Args): Promise<Document> {
  return createDocument(db, "fact", args)
}
