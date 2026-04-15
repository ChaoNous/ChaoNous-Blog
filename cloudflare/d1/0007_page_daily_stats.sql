CREATE TABLE IF NOT EXISTS page_daily_stats (
	post_slug TEXT NOT NULL,
	day TEXT NOT NULL,
	pageviews INTEGER NOT NULL DEFAULT 0,
	visits INTEGER NOT NULL DEFAULT 0,
	updated_at INTEGER NOT NULL,
	PRIMARY KEY (post_slug, day)
);

CREATE INDEX IF NOT EXISTS idx_page_daily_stats_day
ON page_daily_stats (day, updated_at);
