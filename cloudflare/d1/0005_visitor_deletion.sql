-- Add delete_token column to comments table to allow visitor-initiated deletion
ALTER TABLE comments ADD COLUMN delete_token TEXT;

-- Create index for faster token lookup (though usually we'll look up by ID first)
CREATE INDEX IF NOT EXISTS idx_comments_delete_token ON comments (delete_token);
