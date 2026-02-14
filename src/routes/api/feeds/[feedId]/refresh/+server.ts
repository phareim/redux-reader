import { json, error } from '@sveltejs/kit';
import { getFeedById, insertArticles, updateFeedFetchStatus } from '$lib/server/db';
import { fetchAndParseFeed } from '$lib/server/feed-parser';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const feed = await getFeedById(db, params.feedId);
	if (!feed) throw error(404, 'Feed not found');

	try {
		const parsed = await fetchAndParseFeed(feed.feed_url);
		const count = await insertArticles(
			db,
			feed.id,
			parsed.items.map((item) => ({
				guid: item.guid,
				title: item.title,
				url: item.url,
				author: item.author,
				published_at: item.publishedAt,
				summary: item.summary,
				content_html: item.contentHtml
			}))
		);
		await updateFeedFetchStatus(db, feed.id, {
			lastFetchedAt: new Date().toISOString(),
			fetchError: null,
			title: parsed.title,
			siteUrl: parsed.siteUrl
		});
		return json({ ok: true, newArticles: count });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Unknown error';
		await updateFeedFetchStatus(db, feed.id, {
			lastFetchedAt: new Date().toISOString(),
			fetchError: msg
		});
		throw error(502, msg);
	}
};
