import { Hono } from "hono";
import { getAccessIdentity } from "./auth";
import {
  createFeed,
  createSavedItem,
  createUser,
  createAnnotation,
  deleteAnnotation,
  deleteSavedItem,
  getFeedById,
  getFeedItemByIdForUser,
  getFeedByUrl,
  getSavedItemByFeedItem,
  getSavedItemById,
  getUserByAuth,
  insertFeedItems,
  listAnnotations,
  listFeedItems,
  listFeeds,
  listAllFeeds,
  listSavedItems,
  listTags,
  getTagByName,
  createTag,
  linkTag,
  unlinkTag,
  listTagsForTarget,
  updateFeedFetchStatus,
  updateAnnotation,
  updateSavedItemContentVersion,
} from "./db";
import { discoverFeedCandidates } from "./feed-discovery";
import { fetchAndParseFeed } from "./feed-parser";
import type { Env } from "./types";

type HonoEnv = { Bindings: Env };

type AppContext = {
  userId: string;
  userEmail: string;
};

declare module "hono" {
  interface ContextVariableMap {
    auth: AppContext;
  }
}

const app = new Hono<HonoEnv>();

app.use(async (c, next) => {
  const identity = getAccessIdentity(c.req.raw, c.env);
  if (!identity) {
    return c.json({ error: "unauthorized", message: "Cloudflare Access required." }, 401);
  }

  const authProvider = "cf_access";
  const authSubject = identity.id || identity.email;
  let user = await getUserByAuth(c.env, authProvider, authSubject);
  if (!user) {
    user = await createUser(c.env, {
      id: crypto.randomUUID(),
      authProvider,
      authSubject,
      email: identity.email,
      name: identity.name ?? null,
    });
  }

  c.set("auth", { userId: user.id, userEmail: user.email });
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true }));

app.get("/api/me", (c) => {
  const auth = c.get("auth");
  return c.json({ id: auth.userId, email: auth.userEmail });
});

app.post("/api/feeds/discover", async (c) => {
  const body = await c.req.json<{ url?: string }>().catch(() => ({}));
  if (!body.url) {
    return c.json({ error: "missing_url" }, 400);
  }

  const candidates = await discoverFeedCandidates(body.url);
  return c.json({ candidates });
});

app.get("/api/feeds", async (c) => {
  const auth = c.get("auth");
  const feeds = await listFeeds(c.env, auth.userId);
  return c.json({ feeds });
});

app.post("/api/feeds", async (c) => {
  const auth = c.get("auth");
  const body = await c.req
    .json<{ feedUrl?: string; siteUrl?: string | null; title?: string | null }>()
    .catch(() => ({}));

  if (!body.feedUrl) {
    return c.json({ error: "missing_feed_url" }, 400);
  }

  const existing = await getFeedByUrl(c.env, auth.userId, body.feedUrl);
  if (existing) {
    return c.json({ feed: existing, created: false });
  }

  const feed = await createFeed(c.env, {
    id: crypto.randomUUID(),
    userId: auth.userId,
    feedUrl: body.feedUrl,
    siteUrl: body.siteUrl ?? null,
    title: body.title ?? null,
  });

  return c.json({ feed, created: true });
});

app.post("/api/feeds/:feedId/refresh", async (c) => {
  const auth = c.get("auth");
  const { feedId } = c.req.param();
  const feed = await getFeedById(c.env, auth.userId, feedId);
  if (!feed) {
    return c.json({ error: "feed_not_found" }, 404);
  }

  const now = new Date().toISOString();
  try {
    const parsed = await fetchAndParseFeed(feed.feed_url);
    const inserted = await insertFeedItems(
      c.env,
      feed.id,
      parsed.items.map((item) => ({
        guid: item.guid,
        title: item.title ?? null,
        url: item.url ?? null,
        author: item.author ?? null,
        published_at: item.publishedAt ?? null,
        summary: item.summary ?? null,
        content_html: item.contentHtml ?? null,
      }))
    );

    await updateFeedFetchStatus(c.env, feed.id, {
      lastFetchedAt: now,
      fetchStatus: "ok",
      title: parsed.title ?? null,
      siteUrl: parsed.siteUrl ?? null,
    });

    return c.json({ status: "ok", inserted });
  } catch (error) {
    await updateFeedFetchStatus(c.env, feed.id, {
      lastFetchedAt: now,
      fetchStatus: "error",
    });

    return c.json({ error: "refresh_failed" }, 502);
  }
});

app.get("/api/feeds/:feedId/items", async (c) => {
  const auth = c.get("auth");
  const { feedId } = c.req.param();
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 30), 1), 100);
  const cursor = c.req.query("cursor") ?? null;

  const items = await listFeedItems(c.env, auth.userId, feedId, limit, cursor);
  const nextCursor = items.length > 0 ? items[items.length - 1].fetched_at : null;

  return c.json({ items, nextCursor });
});

app.get("/api/saved", async (c) => {
  const auth = c.get("auth");
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 30), 1), 100);
  const cursor = c.req.query("cursor") ?? null;

  const items = await listSavedItems(c.env, auth.userId, limit, cursor);
  const nextCursor = items.length > 0 ? items[items.length - 1].saved_at : null;

  return c.json({ items, nextCursor });
});

app.post("/api/saved", async (c) => {
  const auth = c.get("auth");
  const body = await c.req.json<{ feedItemId?: string }>().catch(() => ({}));
  if (!body.feedItemId) {
    return c.json({ error: "missing_feed_item_id" }, 400);
  }

  const feedItem = await getFeedItemByIdForUser(c.env, auth.userId, body.feedItemId);
  if (!feedItem) {
    return c.json({ error: "feed_item_not_found" }, 404);
  }

  const existing = await getSavedItemByFeedItem(c.env, auth.userId, feedItem.id);
  if (existing) {
    return c.json({ saved: existing, created: false });
  }

  const savedId = crypto.randomUUID();
  const rawKey = `users/${auth.userId}/items/${savedId}/raw.html`;
  const annotatedKey = `users/${auth.userId}/items/${savedId}/annotated.html`;
  const html = await loadArticleHtml(feedItem);

  await Promise.all([
    putArticleHtml(c.env, rawKey, html),
    putArticleHtml(c.env, annotatedKey, html),
  ]);

  const saved = await createSavedItem(c.env, {
    id: savedId,
    userId: auth.userId,
    feedItemId: feedItem.id,
    r2RawKey: rawKey,
    r2AnnotatedKey: annotatedKey,
  });

  return c.json({ saved, created: true });
});

app.get("/api/saved/:savedId/content", async (c) => {
  const auth = c.get("auth");
  const { savedId } = c.req.param();
  const saved = await getSavedItemById(c.env, auth.userId, savedId);
  if (!saved) {
    return c.json({ error: "saved_item_not_found" }, 404);
  }

  const html = await getArticleHtml(c.env, saved.r2_object_key_annotated);
  if (html === null) {
    return c.json({ error: "content_not_found" }, 404);
  }

  return c.json({ html, version: saved.version });
});

app.put("/api/saved/:savedId/content", async (c) => {
  const auth = c.get("auth");
  const { savedId } = c.req.param();
  const body = await c.req.json<{ html?: string; version?: number }>().catch(() => ({}));
  if (!body.html || typeof body.version !== "number") {
    return c.json({ error: "missing_html_or_version" }, 400);
  }

  const saved = await getSavedItemById(c.env, auth.userId, savedId);
  if (!saved) {
    return c.json({ error: "saved_item_not_found" }, 404);
  }

  if (body.version !== saved.version) {
    return c.json({ error: "version_conflict", currentVersion: saved.version }, 409);
  }

  const nextVersion = saved.version + 1;
  await putArticleHtml(c.env, saved.r2_object_key_annotated, body.html);
  await updateSavedItemContentVersion(c.env, saved.id, auth.userId, nextVersion);

  return c.json({ ok: true, version: nextVersion });
});

app.delete("/api/saved/:savedId", async (c) => {
  const auth = c.get("auth");
  const { savedId } = c.req.param();
  const saved = await getSavedItemById(c.env, auth.userId, savedId);
  if (!saved) {
    return c.json({ error: "saved_item_not_found" }, 404);
  }

  await Promise.all([
    c.env.R2_ARTICLES.delete(saved.r2_object_key_raw),
    c.env.R2_ARTICLES.delete(saved.r2_object_key_annotated),
    deleteSavedItem(c.env, auth.userId, saved.id),
  ]);

  return c.json({ ok: true });
});

app.get("/api/saved/:savedId/annotations", async (c) => {
  const auth = c.get("auth");
  const { savedId } = c.req.param();
  const saved = await getSavedItemById(c.env, auth.userId, savedId);
  if (!saved) {
    return c.json({ error: "saved_item_not_found" }, 404);
  }

  const annotations = await listAnnotations(c.env, auth.userId, savedId);
  return c.json({ annotations });
});

app.get("/api/tags", async (c) => {
  const auth = c.get("auth");
  const query = c.req.query("query") ?? null;
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? 20), 1), 100);
  const tags = await listTags(c.env, auth.userId, query, limit);
  return c.json({ tags });
});

app.get("/api/tags/target", async (c) => {
  const auth = c.get("auth");
  const targetType = c.req.query("type");
  const targetId = c.req.query("id");
  if (!targetType || !targetId) {
    return c.json({ error: "missing_target" }, 400);
  }

  const tags = await listTagsForTarget(c.env, {
    userId: auth.userId,
    targetType,
    targetId,
  });

  return c.json({ tags });
});

app.post("/api/tags", async (c) => {
  const auth = c.get("auth");
  const body = await c.req.json<{ name?: string }>().catch(() => ({}));
  if (!body.name) {
    return c.json({ error: "missing_name" }, 400);
  }

  const normalized = body.name.trim();
  if (!normalized) {
    return c.json({ error: "invalid_name" }, 400);
  }

  const existing = await getTagByName(c.env, auth.userId, normalized);
  if (existing) {
    return c.json({ tag: existing, created: false });
  }

  const tag = await createTag(c.env, {
    id: crypto.randomUUID(),
    userId: auth.userId,
    name: normalized,
  });

  return c.json({ tag, created: true });
});

app.post("/api/tags/link", async (c) => {
  const auth = c.get("auth");
  const body = await c.req
    .json<{ targetType?: string; targetId?: string; tagId?: string }>()
    .catch(() => ({}));

  if (!body.targetType || !body.targetId || !body.tagId) {
    return c.json({ error: "missing_fields" }, 400);
  }

  await linkTag(c.env, {
    id: crypto.randomUUID(),
    userId: auth.userId,
    targetType: body.targetType,
    targetId: body.targetId,
    tagId: body.tagId,
  });

  return c.json({ ok: true });
});

app.delete("/api/tags/link", async (c) => {
  const auth = c.get("auth");
  const body = await c.req
    .json<{ targetType?: string; targetId?: string; tagId?: string }>()
    .catch(() => ({}));

  if (!body.targetType || !body.targetId || !body.tagId) {
    return c.json({ error: "missing_fields" }, 400);
  }

  await unlinkTag(c.env, {
    userId: auth.userId,
    targetType: body.targetType,
    targetId: body.targetId,
    tagId: body.tagId,
  });

  return c.json({ ok: true });
});

app.post("/api/annotations", async (c) => {
  const auth = c.get("auth");
  const body = await c.req
    .json<{ savedItemId?: string; type?: string; anchor?: unknown; text?: string | null }>()
    .catch(() => ({}));

  if (!body.savedItemId || !body.type || !body.anchor) {
    return c.json({ error: "missing_fields" }, 400);
  }

  const saved = await getSavedItemById(c.env, auth.userId, body.savedItemId);
  if (!saved) {
    return c.json({ error: "saved_item_not_found" }, 404);
  }

  const anchorValue = typeof body.anchor === "string" ? body.anchor : JSON.stringify(body.anchor);

  const annotation = await createAnnotation(c.env, {
    id: crypto.randomUUID(),
    userId: auth.userId,
    savedItemId: saved.id,
    type: body.type,
    anchor: anchorValue,
    text: body.text ?? null,
  });

  return c.json({ annotation });
});

app.patch("/api/annotations/:id", async (c) => {
  const auth = c.get("auth");
  const { id } = c.req.param();
  const body = await c.req.json<{ anchor?: unknown; text?: string | null }>().catch(() => ({}));

  if (!body.anchor && body.text === undefined) {
    return c.json({ error: "missing_fields" }, 400);
  }

  const anchorValue =
    body.anchor === undefined
      ? undefined
      : typeof body.anchor === "string"
        ? body.anchor
        : JSON.stringify(body.anchor);

  await updateAnnotation(c.env, {
    annotationId: id,
    userId: auth.userId,
    anchor: anchorValue,
    text: body.text ?? null,
  });

  return c.json({ ok: true });
});

app.delete("/api/annotations/:id", async (c) => {
  const auth = c.get("auth");
  const { id } = c.req.param();
  await deleteAnnotation(c.env, auth.userId, id);
  return c.json({ ok: true });
});

async function putArticleHtml(env: Env, key: string, html: string): Promise<void> {
  await env.R2_ARTICLES.put(key, html, {
    httpMetadata: { contentType: "text/html; charset=utf-8" },
  });
}

async function getArticleHtml(env: Env, key: string): Promise<string | null> {
  const obj = await env.R2_ARTICLES.get(key);
  if (!obj) return null;
  return await obj.text();
}

async function loadArticleHtml(feedItem: {
  title: string | null;
  url: string | null;
  summary: string | null;
  content_html: string | null;
}): Promise<string> {
  let html = feedItem.content_html?.trim() ?? "";

  if (!html && feedItem.url) {
    try {
      const response = await fetch(feedItem.url, { redirect: "follow" });
      if (response.ok) {
        html = await response.text();
      }
    } catch {
      html = "";
    }
  }

  if (!html) {
    const summary = feedItem.summary ? escapeHtml(feedItem.summary) : "Saved item.";
    html = `<p>${summary}</p>`;
  }

  if (html.toLowerCase().includes("<html")) {
    return html;
  }

  const title = escapeHtml(feedItem.title ?? "Saved item");
  return `<!doctype html><html><head><meta charset=\"utf-8\"><title>${title}</title></head><body><article>${html}</article></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, \"&amp;\")
    .replace(/</g, \"&lt;\")
    .replace(/>/g, \"&gt;\")
    .replace(/\"/g, \"&quot;\")
    .replace(/'/g, \"&#39;\");
}

export default app;

export async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
  const limit = Number(env.CRON_REFRESH_LIMIT ?? 50);
  ctx.waitUntil(refreshFeedsOnSchedule(env, limit));
}

async function refreshFeedsOnSchedule(env: Env, limit: number) {
  const feeds = await listAllFeeds(env, limit);
  for (const feed of feeds) {
    const now = new Date().toISOString();
    try {
      const parsed = await fetchAndParseFeed(feed.feed_url);
      await insertFeedItems(
        env,
        feed.id,
        parsed.items.map((item) => ({
          guid: item.guid,
          title: item.title ?? null,
          url: item.url ?? null,
          author: item.author ?? null,
          published_at: item.publishedAt ?? null,
          summary: item.summary ?? null,
          content_html: item.contentHtml ?? null,
        }))
      );

      await updateFeedFetchStatus(env, feed.id, {
        lastFetchedAt: now,
        fetchStatus: "ok",
        title: parsed.title ?? null,
        siteUrl: parsed.siteUrl ?? null,
      });
    } catch {
      await updateFeedFetchStatus(env, feed.id, {
        lastFetchedAt: now,
        fetchStatus: "error",
      });
    }
  }
}
