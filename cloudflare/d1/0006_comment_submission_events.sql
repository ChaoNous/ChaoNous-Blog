CREATE TABLE IF NOT EXISTS comment_submission_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint_hash TEXT NOT NULL,
  post_slug TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_submission_events_fingerprint_created
  ON comment_submission_events (fingerprint_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_comment_submission_events_post_fingerprint_created
  ON comment_submission_events (post_slug, fingerprint_hash, created_at);
