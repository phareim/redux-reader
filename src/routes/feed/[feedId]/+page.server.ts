import { error } from '@sveltejs/kit';
import { getFeedById, listArticles } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');
	if (!locals.user) throw error(401, 'Not authenticated');

	const feed = await getFeedById(db, locals.user.id, params.feedId);
	if (!feed) throw error(404, 'Feed not found');

	const articles = await listArticles(db, locals.user.id, { feedId: params.feedId, limit: 50 });
	return { feed, articles };
};
