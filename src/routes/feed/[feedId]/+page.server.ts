import { error } from '@sveltejs/kit';
import { getFeedById, listArticles } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const feed = await getFeedById(db, params.feedId);
	if (!feed) throw error(404, 'Feed not found');

	const articles = await listArticles(db, { feedId: params.feedId, limit: 50 });
	return { feed, articles };
};
