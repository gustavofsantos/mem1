CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('fact', 'spike', 'term', 'issue')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_tags (
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (document_id, tag)
);

CREATE TABLE IF NOT EXISTS document_links (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK(label IN (
    'relates_to', 'grounds', 'produces', 'depends_on', 'required_for', 'defines'
  )),
  created_at TEXT NOT NULL
);
