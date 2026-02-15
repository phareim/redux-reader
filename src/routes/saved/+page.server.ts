import { listArticles } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) return { articles: [] };

	const articles = await listArticles(db, locals.user.id, { savedOnly: true, limit: 50 });
	return { articles };
};
