-- Single-user RSS reader schema

CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  title TEXT,
  site_url TEXT,
  feed_url TEXT NOT NULL UNIQUE,
  description TEXT,
  last_fetched_at TEXT,
  fetch_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  guid TEXT NOT NULL,
  title TEXT,
  url TEXT,
  author TEXT,
  published_at TEXT,
  summary TEXT,
  content_html TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  is_saved INTEGER NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(feed_id, guid)
);

CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read);
CREATE INDEX IF NOT EXISTS idx_articles_is_saved ON articles(is_saved);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tag_links (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL, -- 'feed' or 'article'
  target_id TEXT NOT NULL,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(target_type, target_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_links_target ON tag_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_tag_links_tag ON tag_links(tag_id);
