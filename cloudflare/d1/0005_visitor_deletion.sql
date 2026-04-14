
ALTER TABLE comments ADD COLUMN delete_token TEXT;


CREATE INDEX IF NOT EXISTS idx_comments_delete_token ON comments (delete_token);
