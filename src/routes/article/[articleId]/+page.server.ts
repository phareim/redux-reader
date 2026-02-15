import { error } from '@sveltejs/kit';
import { getArticleById, updateArticle, listTagsForTarget } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');
	if (!locals.user) throw error(401, 'Not authenticated');

	const article = await getArticleById(db, locals.user.id, params.articleId);
	if (!article) throw error(404, 'Article not found');

	// Mark as read
	if (!article.is_read) {
		await updateArticle(db, locals.user.id, params.articleId, { is_read: true });
		article.is_read = 1;
	}

	const tags = await listTagsForTarget(db, 'article', params.articleId);

	return { article, tags };
};
