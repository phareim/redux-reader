import { json, error } from '@sveltejs/kit';
import { listFeeds, createFeed, getFeedByUrl } from '$lib/server/db';
import { discoverFeedCandidates } from '$lib/server/feed-discovery';
import { fetchAndParseFeed } from '$lib/server/feed-parser';
import { insertArticles, updateFeedFetchStatus } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const feeds = await listFeeds(db);
	return json(feeds);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const { url } = await request.json();
	if (!url || typeof url !== 'string') throw error(400, 'URL is required');

	// Discover feed URL
	const candidates = await discoverFeedCandidates(url);
	if (candidates.length === 0) throw error(400, 'No feed found at that URL');

	const candidate = candidates[0];

	// Check if feed already exists
	const existing = await getFeedByUrl(db, candidate.feedUrl);
	if (existing) return json(existing);

	// Create feed
	const feed = await createFeed(db, {
		id: crypto.randomUUID(),
		feedUrl: candidate.feedUrl,
		siteUrl: candidate.siteUrl,
		title: candidate.title
	});

	// Fetch initial articles
	try {
		const parsed = await fetchAndParseFeed(feed.feed_url);
		await insertArticles(
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
	} catch (e) {
		await updateFeedFetchStatus(db, feed.id, {
			lastFetchedAt: new Date().toISOString(),
			fetchError: e instanceof Error ? e.message : 'Unknown error'
		});
	}

	return json(feed, { status: 201 });
};
