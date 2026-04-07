CREATE TABLE IF NOT EXISTS page_stats (
  post_slug TEXT PRIMARY KEY,
  post_url TEXT NOT NULL,
  post_title TEXT NOT NULL DEFAULT '',
  pageviews INTEGER NOT NULL DEFAULT 0,
  visits INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS page_visitors (
  post_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (post_slug, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_page_stats_updated_at
  ON page_stats (updated_at);
