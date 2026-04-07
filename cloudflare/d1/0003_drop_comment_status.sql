DROP INDEX IF EXISTS idx_comments_post_status_created;
DROP INDEX IF EXISTS idx_comments_status_created;
DROP INDEX IF EXISTS idx_comments_post_created;

CREATE TABLE comments_next (
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
  FOREIGN KEY (parent_id) REFERENCES comments_next(id) ON DELETE CASCADE
);

INSERT INTO comments_next (
  id,
  post_slug,
  post_url,
  post_title,
  parent_id,
  author_name,
  author_email,
  author_url,
  content,
  created_at,
  updated_at
)
SELECT
  id,
  post_slug,
  post_url,
  post_title,
  parent_id,
  author_name,
  author_email,
  author_url,
  content,
  created_at,
  updated_at
FROM comments;

DROP TABLE comments;

ALTER TABLE comments_next RENAME TO comments;

CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON comments (post_slug, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments (parent_id);
