-- Add user_id to existing tables for multi-user support

-- Recreate feeds table with user_id (SQLite doesn't support ADD NOT NULL without default)
CREATE TABLE IF NOT EXISTS feeds_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  site_url TEXT,
  feed_url TEXT NOT NULL,
  description TEXT,
  last_fetched_at TEXT,
  fetch_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, feed_url)
);

INSERT INTO feeds_new (id, user_id, title, site_url, feed_url, description, last_fetched_at, fetch_error, created_at)
  SELECT id, COALESCE((SELECT id FROM users ORDER BY created_at ASC LIMIT 1), 'legacy'), title, site_url, feed_url, description, last_fetched_at, fetch_error, created_at
  FROM feeds;

DROP TABLE feeds;
ALTER TABLE feeds_new RENAME TO feeds;

CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON feeds(user_id);

-- Add user_id to articles
ALTER TABLE articles ADD COLUMN user_id TEXT;

UPDATE articles SET user_id = COALESCE(
  (SELECT f.user_id FROM feeds f WHERE f.id = articles.feed_id),
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  'legacy'
);

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);

-- Add user_id to tags
ALTER TABLE tags ADD COLUMN user_id TEXT;

UPDATE tags SET user_id = COALESCE(
  (SELECT id FROM users ORDER BY created_at ASC LIMIT 1),
  'legacy'
);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
