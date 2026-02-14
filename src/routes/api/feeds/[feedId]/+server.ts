import { json, error } from '@sveltejs/kit';
import { getFeedById, deleteFeed } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const feed = await getFeedById(db, params.feedId);
	if (!feed) throw error(404, 'Feed not found');

	await deleteFeed(db, params.feedId);
	return json({ ok: true });
};
