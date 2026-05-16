CREATE TABLE IF NOT EXISTS tags (
  name TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

-- Populate tags table from existing document_tags
INSERT OR IGNORE INTO tags (name, created_at)
SELECT DISTINCT tag, datetime('now') FROM document_tags;

-- In SQLite, we can't easily add a foreign key constraint to an existing table.
-- We would need to recreate the table. Since this is an early stage, we can:
-- 1. Create a temporary table
-- 2. Copy data
-- 3. Drop original
-- 4. Rename temporary
-- However, for now, adding the tags table is enough to support the new features.
-- New databases will have the full schema from schema.ts.
