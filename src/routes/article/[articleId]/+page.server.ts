import { error } from '@sveltejs/kit';
import { getArticleById, updateArticle, listTagsForTarget } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const article = await getArticleById(db, params.articleId);
	if (!article) throw error(404, 'Article not found');

	// Mark as read
	if (!article.is_read) {
		await updateArticle(db, params.articleId, { is_read: true });
		article.is_read = 1;
	}

	const tags = await listTagsForTarget(db, 'article', params.articleId);

	return { article, tags };
};
