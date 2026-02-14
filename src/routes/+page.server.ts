import { listArticles } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return { articles: [] };

	const articles = await listArticles(db, { limit: 50 });
	return { articles };
};
