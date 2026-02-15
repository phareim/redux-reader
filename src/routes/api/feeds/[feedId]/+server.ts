import { json, error } from '@sveltejs/kit';
import { getFeedById, deleteFeed } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');
	if (!locals.user) throw error(401, 'Not authenticated');

	const feed = await getFeedById(db, locals.user.id, params.feedId);
	if (!feed) throw error(404, 'Feed not found');

	await deleteFeed(db, locals.user.id, params.feedId);
	return json({ ok: true });
};
