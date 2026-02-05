import type { Env } from "./types";

export type User = {
  id: string;
  auth_provider: string;
  auth_subject: string;
  email: string;
  name: string | null;
  created_at: string;
};

export type Feed = {
  id: string;
  owner_user_id: string;
  title: string | null;
  site_url: string | null;
  feed_url: string;
  last_fetched_at: string | null;
  fetch_status: string | null;
  created_at: string;
};

export type FeedItem = {
  id: string;
  feed_id: string;
  guid: string | null;
  title: string | null;
  url: string | null;
  author: string | null;
  published_at: string | null;
  summary: string | null;
  content_html: string | null;
  fetched_at: string;
};

export type SavedItem = {
  id: string;
  user_id: string;
  feed_item_id: string;
  saved_at: string;
  r2_object_key_raw: string;
  r2_object_key_annotated: string;
  reading_state: string | null;
  version: number;
};

export type SavedItemView = SavedItem & {
  item_title: string | null;
  item_url: string | null;
  item_summary: string | null;
  item_published_at: string | null;
  feed_title: string | null;
};

export type Annotation = {
  id: string;
  user_id: string;
  saved_item_id: string;
  type: string;
  anchor: string;
  text: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export async function getUserByAuth(
  env: Env,
  authProvider: string,
  authSubject: string
): Promise<User | null> {
  const row = await env.DB.prepare(
    "SELECT id, auth_provider, auth_subject, email, name, created_at FROM users WHERE auth_provider = ? AND auth_subject = ?"
  )
    .bind(authProvider, authSubject)
    .first<User>();

  return row ?? null;
}

export async function createUser(
  env: Env,
  data: {
    id: string;
    authProvider: string;
    authSubject: string;
    email: string;
    name?: string | null;
  }
): Promise<User> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO users (id, auth_provider, auth_subject, email, name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      data.id,
      data.authProvider,
      data.authSubject,
      data.email,
      data.name ?? null,
      now
    )
    .run();

  return {
    id: data.id,
    auth_provider: data.authProvider,
    auth_subject: data.authSubject,
    email: data.email,
    name: data.name ?? null,
    created_at: now,
  };
}

export async function getFeedById(env: Env, userId: string, feedId: string): Promise<Feed | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM feeds WHERE id = ? AND owner_user_id = ?"
  )
    .bind(feedId, userId)
    .first<Feed>();

  return row ?? null;
}

export async function getFeedByUrl(env: Env, userId: string, feedUrl: string): Promise<Feed | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM feeds WHERE owner_user_id = ? AND feed_url = ?"
  )
    .bind(userId, feedUrl)
    .first<Feed>();

  return row ?? null;
}

export async function listFeeds(env: Env, userId: string): Promise<Feed[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM feeds WHERE owner_user_id = ? ORDER BY created_at DESC"
  )
    .bind(userId)
    .all<Feed>();

  return result.results ?? [];
}

export async function listAllFeeds(env: Env, limit: number): Promise<Feed[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM feeds ORDER BY last_fetched_at ASC NULLS FIRST LIMIT ?"
  )
    .bind(limit)
    .all<Feed>();

  return result.results ?? [];
}

export async function createFeed(
  env: Env,
  data: {
    id: string;
    userId: string;
    feedUrl: string;
    siteUrl?: string | null;
    title?: string | null;
  }
): Promise<Feed> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO feeds (id, owner_user_id, title, site_url, feed_url, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(
      data.id,
      data.userId,
      data.title ?? null,
      data.siteUrl ?? null,
      data.feedUrl,
      now
    )
    .run();

  return {
    id: data.id,
    owner_user_id: data.userId,
    title: data.title ?? null,
    site_url: data.siteUrl ?? null,
    feed_url: data.feedUrl,
    last_fetched_at: null,
    fetch_status: null,
    created_at: now,
  };
}

export async function updateFeedFetchStatus(
  env: Env,
  feedId: string,
  data: { lastFetchedAt: string; fetchStatus: string; title?: string | null; siteUrl?: string | null }
): Promise<void> {
  await env.DB.prepare(
    "UPDATE feeds SET last_fetched_at = ?, fetch_status = ?, title = COALESCE(?, title), site_url = COALESCE(?, site_url) WHERE id = ?"
  )
    .bind(data.lastFetchedAt, data.fetchStatus, data.title ?? null, data.siteUrl ?? null, feedId)
    .run();
}

export async function insertFeedItems(
  env: Env,
  feedId: string,
  items: Array<Omit<FeedItem, "id" | "feed_id" | "fetched_at">>
): Promise<number> {
  if (items.length === 0) return 0;

  const fetchedAt = new Date().toISOString();
  const statements = items.map((item) =>
    env.DB.prepare(
      "INSERT OR IGNORE INTO feed_items (id, feed_id, guid, title, url, author, published_at, summary, content_html, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      crypto.randomUUID(),
      feedId,
      item.guid,
      item.title ?? null,
      item.url ?? null,
      item.author ?? null,
      item.published_at ?? null,
      item.summary ?? null,
      item.content_html ?? null,
      fetchedAt
    )
  );

  const result = await env.DB.batch(statements);
  return result.length;
}

export async function listFeedItems(
  env: Env,
  userId: string,
  feedId: string,
  limit: number,
  cursor?: string | null
): Promise<FeedItem[]> {
  const query = cursor
    ? `SELECT fi.* FROM feed_items fi JOIN feeds f ON fi.feed_id = f.id WHERE fi.feed_id = ? AND f.owner_user_id = ? AND fi.fetched_at < ? ORDER BY fi.fetched_at DESC LIMIT ?`
    : `SELECT fi.* FROM feed_items fi JOIN feeds f ON fi.feed_id = f.id WHERE fi.feed_id = ? AND f.owner_user_id = ? ORDER BY fi.fetched_at DESC LIMIT ?`;

  const stmt = env.DB.prepare(query);
  const bound = cursor
    ? stmt.bind(feedId, userId, cursor, limit)
    : stmt.bind(feedId, userId, limit);

  const result = await bound.all<FeedItem>();
  return result.results ?? [];
}

export async function getFeedItemByIdForUser(
  env: Env,
  userId: string,
  feedItemId: string
): Promise<FeedItem | null> {
  const row = await env.DB.prepare(
    "SELECT fi.* FROM feed_items fi JOIN feeds f ON fi.feed_id = f.id WHERE fi.id = ? AND f.owner_user_id = ?"
  )
    .bind(feedItemId, userId)
    .first<FeedItem>();

  return row ?? null;
}

export async function getSavedItemByFeedItem(
  env: Env,
  userId: string,
  feedItemId: string
): Promise<SavedItem | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM saved_items WHERE user_id = ? AND feed_item_id = ?"
  )
    .bind(userId, feedItemId)
    .first<SavedItem>();

  return row ?? null;
}

export async function getSavedItemById(
  env: Env,
  userId: string,
  savedItemId: string
): Promise<SavedItem | null> {
  const row = await env.DB.prepare(
    "SELECT * FROM saved_items WHERE id = ? AND user_id = ?"
  )
    .bind(savedItemId, userId)
    .first<SavedItem>();

  return row ?? null;
}

export async function listSavedItems(
  env: Env,
  userId: string,
  limit: number,
  cursor?: string | null
): Promise<SavedItemView[]> {
  const query = cursor
    ? `SELECT s.*, fi.title AS item_title, fi.url AS item_url, fi.summary AS item_summary, fi.published_at AS item_published_at, f.title AS feed_title
       FROM saved_items s
       JOIN feed_items fi ON s.feed_item_id = fi.id
       JOIN feeds f ON fi.feed_id = f.id
       WHERE s.user_id = ? AND s.saved_at < ?
       ORDER BY s.saved_at DESC
       LIMIT ?`
    : `SELECT s.*, fi.title AS item_title, fi.url AS item_url, fi.summary AS item_summary, fi.published_at AS item_published_at, f.title AS feed_title
       FROM saved_items s
       JOIN feed_items fi ON s.feed_item_id = fi.id
       JOIN feeds f ON fi.feed_id = f.id
       WHERE s.user_id = ?
       ORDER BY s.saved_at DESC
       LIMIT ?`;

  const stmt = env.DB.prepare(query);
  const bound = cursor ? stmt.bind(userId, cursor, limit) : stmt.bind(userId, limit);
  const result = await bound.all<SavedItemView>();
  return result.results ?? [];
}

export async function createSavedItem(
  env: Env,
  data: {
    id: string;
    userId: string;
    feedItemId: string;
    r2RawKey: string;
    r2AnnotatedKey: string;
  }
): Promise<SavedItem> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO saved_items (id, user_id, feed_item_id, saved_at, r2_object_key_raw, r2_object_key_annotated, version) VALUES (?, ?, ?, ?, ?, ?, 1)"
  )
    .bind(data.id, data.userId, data.feedItemId, now, data.r2RawKey, data.r2AnnotatedKey)
    .run();

  return {
    id: data.id,
    user_id: data.userId,
    feed_item_id: data.feedItemId,
    saved_at: now,
    r2_object_key_raw: data.r2RawKey,
    r2_object_key_annotated: data.r2AnnotatedKey,
    reading_state: null,
    version: 1,
  };
}

export async function updateSavedItemContentVersion(
  env: Env,
  savedItemId: string,
  userId: string,
  nextVersion: number
): Promise<void> {
  await env.DB.prepare(
    "UPDATE saved_items SET version = ? WHERE id = ? AND user_id = ?"
  )
    .bind(nextVersion, savedItemId, userId)
    .run();
}

export async function deleteSavedItem(env: Env, userId: string, savedItemId: string): Promise<void> {
  const statements = [
    env.DB.prepare("DELETE FROM annotations WHERE saved_item_id = ? AND user_id = ?").bind(
      savedItemId,
      userId
    ),
    env.DB.prepare("DELETE FROM saved_items WHERE id = ? AND user_id = ?").bind(
      savedItemId,
      userId
    ),
  ];

  await env.DB.batch(statements);
}

export async function listTags(
  env: Env,
  userId: string,
  query: string | null,
  limit: number
): Promise<Tag[]> {
  const like = query ? `%${query}%` : "%";
  const result = await env.DB.prepare(
    "SELECT * FROM tags WHERE user_id = ? AND name LIKE ? ORDER BY name ASC LIMIT ?"
  )
    .bind(userId, like, limit)
    .all<Tag>();

  return result.results ?? [];
}

export async function getTagByName(env: Env, userId: string, name: string): Promise<Tag | null> {
  const row = await env.DB.prepare("SELECT * FROM tags WHERE user_id = ? AND name = ?")
    .bind(userId, name)
    .first<Tag>();

  return row ?? null;
}

export async function createTag(
  env: Env,
  data: { id: string; userId: string; name: string }
): Promise<Tag> {
  const now = new Date().toISOString();
  await env.DB.prepare("INSERT INTO tags (id, user_id, name, created_at) VALUES (?, ?, ?, ?)")
    .bind(data.id, data.userId, data.name, now)
    .run();

  return { id: data.id, user_id: data.userId, name: data.name, created_at: now };
}

export async function linkTag(
  env: Env,
  data: { id: string; userId: string; targetType: string; targetId: string; tagId: string }
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tag_links (id, user_id, target_type, target_id, tag_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(data.id, data.userId, data.targetType, data.targetId, data.tagId, now)
    .run();
}

export async function unlinkTag(
  env: Env,
  data: { userId: string; targetType: string; targetId: string; tagId: string }
): Promise<void> {
  await env.DB.prepare(
    "DELETE FROM tag_links WHERE user_id = ? AND target_type = ? AND target_id = ? AND tag_id = ?"
  )
    .bind(data.userId, data.targetType, data.targetId, data.tagId)
    .run();
}

export async function listTagsForTarget(
  env: Env,
  data: { userId: string; targetType: string; targetId: string }
): Promise<Tag[]> {
  const result = await env.DB.prepare(
    "SELECT t.* FROM tags t JOIN tag_links tl ON tl.tag_id = t.id WHERE tl.user_id = ? AND tl.target_type = ? AND tl.target_id = ? ORDER BY t.name ASC"
  )
    .bind(data.userId, data.targetType, data.targetId)
    .all<Tag>();

  return result.results ?? [];
}

export async function listAnnotations(
  env: Env,
  userId: string,
  savedItemId: string
): Promise<Annotation[]> {
  const result = await env.DB.prepare(
    "SELECT * FROM annotations WHERE user_id = ? AND saved_item_id = ? ORDER BY created_at ASC"
  )
    .bind(userId, savedItemId)
    .all<Annotation>();

  return result.results ?? [];
}

export async function createAnnotation(
  env: Env,
  data: {
    id: string;
    userId: string;
    savedItemId: string;
    type: string;
    anchor: string;
    text?: string | null;
  }
): Promise<Annotation> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "INSERT INTO annotations (id, user_id, saved_item_id, type, anchor, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(data.id, data.userId, data.savedItemId, data.type, data.anchor, data.text ?? null, now, now)
    .run();

  return {
    id: data.id,
    user_id: data.userId,
    saved_item_id: data.savedItemId,
    type: data.type,
    anchor: data.anchor,
    text: data.text ?? null,
    created_at: now,
    updated_at: now,
  };
}

export async function updateAnnotation(
  env: Env,
  data: {
    annotationId: string;
    userId: string;
    anchor?: string | null;
    text?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE annotations SET anchor = COALESCE(?, anchor), text = COALESCE(?, text), updated_at = ? WHERE id = ? AND user_id = ?"
  )
    .bind(data.anchor ?? null, data.text ?? null, now, data.annotationId, data.userId)
    .run();
}

export async function deleteAnnotation(
  env: Env,
  userId: string,
  annotationId: string
): Promise<void> {
  await env.DB.prepare("DELETE FROM annotations WHERE id = ? AND user_id = ?")
    .bind(annotationId, userId)
    .run();
}
