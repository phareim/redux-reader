import type { Feed, Article, Tag } from '$lib/types';

export type FeedWithUnreadCount = Feed & { unread_count: number };

export async function listFeeds(db: D1Database): Promise<Feed[]> {
	const result = await db
		.prepare('SELECT * FROM feeds ORDER BY title ASC, created_at DESC')
		.all<Feed>();
	return result.results ?? [];
}

export async function listFeedsWithUnreadCounts(db: D1Database): Promise<FeedWithUnreadCount[]> {
	const result = await db
		.prepare(
			`SELECT f.*, COALESCE(u.cnt, 0) as unread_count
       FROM feeds f
       LEFT JOIN (SELECT feed_id, COUNT(*) as cnt FROM articles WHERE is_read = 0 GROUP BY feed_id) u
       ON f.id = u.feed_id
       ORDER BY f.title ASC, f.created_at DESC`
		)
		.all<FeedWithUnreadCount>();
	return result.results ?? [];
}

export async function getFeedById(db: D1Database, feedId: string): Promise<Feed | null> {
	return (await db.prepare('SELECT * FROM feeds WHERE id = ?').bind(feedId).first<Feed>()) ?? null;
}

export async function getFeedByUrl(db: D1Database, feedUrl: string): Promise<Feed | null> {
	return (
		(await db.prepare('SELECT * FROM feeds WHERE feed_url = ?').bind(feedUrl).first<Feed>()) ??
		null
	);
}

export async function createFeed(
	db: D1Database,
	data: { id: string; feedUrl: string; siteUrl?: string | null; title?: string | null }
): Promise<Feed> {
	const now = new Date().toISOString();
	await db
		.prepare(
			'INSERT INTO feeds (id, title, site_url, feed_url, created_at) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(data.id, data.title ?? null, data.siteUrl ?? null, data.feedUrl, now)
		.run();

	return {
		id: data.id,
		title: data.title ?? null,
		site_url: data.siteUrl ?? null,
		feed_url: data.feedUrl,
		description: null,
		last_fetched_at: null,
		fetch_error: null,
		created_at: now
	};
}

export async function deleteFeed(db: D1Database, feedId: string): Promise<void> {
	await db.batch([
		db.prepare('DELETE FROM articles WHERE feed_id = ?').bind(feedId),
		db.prepare('DELETE FROM feeds WHERE id = ?').bind(feedId)
	]);
}

export async function updateFeedFetchStatus(
	db: D1Database,
	feedId: string,
	data: {
		lastFetchedAt: string;
		fetchError: string | null;
		title?: string | null;
		siteUrl?: string | null;
	}
): Promise<void> {
	await db
		.prepare(
			'UPDATE feeds SET last_fetched_at = ?, fetch_error = ?, title = COALESCE(?, title), site_url = COALESCE(?, site_url) WHERE id = ?'
		)
		.bind(
			data.lastFetchedAt,
			data.fetchError,
			data.title ?? null,
			data.siteUrl ?? null,
			feedId
		)
		.run();
}

export async function insertArticles(
	db: D1Database,
	feedId: string,
	items: Array<{
		guid: string;
		title?: string | null;
		url?: string | null;
		author?: string | null;
		published_at?: string | null;
		summary?: string | null;
		content_html?: string | null;
	}>
): Promise<number> {
	if (items.length === 0) return 0;

	const fetchedAt = new Date().toISOString();
	const statements = items.map((item) =>
		db
			.prepare(
				'INSERT OR IGNORE INTO articles (id, feed_id, guid, title, url, author, published_at, summary, content_html, fetched_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
			)
			.bind(
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

	const result = await db.batch(statements);
	return result.length;
}

export async function listArticles(
	db: D1Database,
	options: { feedId?: string; savedOnly?: boolean; limit?: number; offset?: number } = {}
): Promise<(Article & { feed_title: string | null })[]> {
	const { feedId, savedOnly, limit = 50, offset = 0 } = options;
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (feedId) {
		conditions.push('a.feed_id = ?');
		params.push(feedId);
	}
	if (savedOnly) {
		conditions.push('a.is_saved = 1');
	}

	const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
	params.push(limit, offset);

	const result = await db
		.prepare(
			`SELECT a.*, f.title as feed_title
       FROM articles a
       JOIN feeds f ON a.feed_id = f.id
       ${where}
       ORDER BY a.published_at DESC, a.fetched_at DESC
       LIMIT ? OFFSET ?`
		)
		.bind(...params)
		.all<Article & { feed_title: string | null }>();
	return result.results ?? [];
}

export async function getArticleById(
	db: D1Database,
	articleId: string
): Promise<(Article & { feed_title: string | null }) | null> {
	return (
		(await db
			.prepare(
				`SELECT a.*, f.title as feed_title FROM articles a JOIN feeds f ON a.feed_id = f.id WHERE a.id = ?`
			)
			.bind(articleId)
			.first<Article & { feed_title: string | null }>()) ?? null
	);
}

export async function updateArticle(
	db: D1Database,
	articleId: string,
	data: { is_read?: boolean; is_saved?: boolean }
): Promise<void> {
	const sets: string[] = [];
	const params: (string | number)[] = [];

	if (data.is_read !== undefined) {
		sets.push('is_read = ?');
		params.push(data.is_read ? 1 : 0);
	}
	if (data.is_saved !== undefined) {
		sets.push('is_saved = ?');
		params.push(data.is_saved ? 1 : 0);
	}

	if (sets.length === 0) return;
	params.push(articleId);

	await db
		.prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`)
		.bind(...params)
		.run();
}

export async function listTags(db: D1Database, query?: string | null): Promise<Tag[]> {
	const like = query ? `%${query}%` : '%';
	const result = await db
		.prepare('SELECT * FROM tags WHERE name LIKE ? ORDER BY name ASC LIMIT 50')
		.bind(like)
		.all<Tag>();
	return result.results ?? [];
}

export async function getTagByName(db: D1Database, name: string): Promise<Tag | null> {
	return (
		(await db.prepare('SELECT * FROM tags WHERE name = ?').bind(name).first<Tag>()) ?? null
	);
}

export async function createTag(
	db: D1Database,
	data: { id: string; name: string }
): Promise<Tag> {
	const now = new Date().toISOString();
	await db
		.prepare('INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?)')
		.bind(data.id, data.name, now)
		.run();
	return { id: data.id, name: data.name, created_at: now };
}

export async function linkTag(
	db: D1Database,
	data: { id: string; targetType: string; targetId: string; tagId: string }
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			'INSERT OR IGNORE INTO tag_links (id, target_type, target_id, tag_id, created_at) VALUES (?, ?, ?, ?, ?)'
		)
		.bind(data.id, data.targetType, data.targetId, data.tagId, now)
		.run();
}

export async function unlinkTag(
	db: D1Database,
	data: { targetType: string; targetId: string; tagId: string }
): Promise<void> {
	await db
		.prepare(
			'DELETE FROM tag_links WHERE target_type = ? AND target_id = ? AND tag_id = ?'
		)
		.bind(data.targetType, data.targetId, data.tagId)
		.run();
}

export async function listTagsForTarget(
	db: D1Database,
	targetType: string,
	targetId: string
): Promise<Tag[]> {
	const result = await db
		.prepare(
			'SELECT t.* FROM tags t JOIN tag_links tl ON tl.tag_id = t.id WHERE tl.target_type = ? AND tl.target_id = ? ORDER BY t.name ASC'
		)
		.bind(targetType, targetId)
		.all<Tag>();
	return result.results ?? [];
}
