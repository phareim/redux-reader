-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_provider TEXT NOT NULL,
  auth_subject TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (auth_provider, auth_subject)
);

-- Feeds
CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  title TEXT,
  site_url TEXT,
  feed_url TEXT NOT NULL,
  last_fetched_at TEXT,
  fetch_status TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feeds_owner_feed_url ON feeds(owner_user_id, feed_url);

-- Feed items
CREATE TABLE IF NOT EXISTS feed_items (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL,
  guid TEXT,
  title TEXT,
  url TEXT,
  author TEXT,
  published_at TEXT,
  summary TEXT,
  content_html TEXT,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (feed_id) REFERENCES feeds(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feed_items_guid ON feed_items(feed_id, guid);

-- Saved items
CREATE TABLE IF NOT EXISTS saved_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  feed_item_id TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  r2_object_key_raw TEXT NOT NULL,
  r2_object_key_annotated TEXT NOT NULL,
  reading_state TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (feed_item_id) REFERENCES feed_items(id)
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id, saved_at);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tag links
CREATE TABLE IF NOT EXISTS tag_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE INDEX IF NOT EXISTS idx_tag_links_target ON tag_links(target_type, target_id);

-- Annotations
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  saved_item_id TEXT NOT NULL,
  type TEXT NOT NULL,
  anchor TEXT NOT NULL,
  text TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (saved_item_id) REFERENCES saved_items(id)
);

CREATE INDEX IF NOT EXISTS idx_annotations_saved_item ON annotations(saved_item_id);
