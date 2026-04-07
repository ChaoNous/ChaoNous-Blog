CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  post_url TEXT NOT NULL,
  post_title TEXT NOT NULL DEFAULT '',
  parent_id INTEGER,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_url TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON comments (post_slug, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments (parent_id);
