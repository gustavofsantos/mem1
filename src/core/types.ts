export type DocumentType = "fact" | "spike" | "term" | "issue"

export type LinkLabel =
  | "relates_to"
  | "grounds"
  | "produces"
  | "depends_on"
  | "required_for"
  | "defines"

export type Document = {
  id: string
  type: DocumentType
  title: string
  body: string
  archived: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export type Link = {
  id: string
  source_id: string
  target_id: string
  label: LinkLabel
  created_at: string
}
