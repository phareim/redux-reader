import { json, error } from '@sveltejs/kit';
import { getArticleById, updateArticle, listTagsForTarget } from '$lib/server/db';
import { saveArticleToR2, deleteArticleFromR2 } from '$lib/server/r2';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.BUCKET;
	if (!db) throw error(500, 'Database not available');
	if (!bucket) throw error(500, 'R2 bucket not available');

	const article = await getArticleById(db, params.articleId);
	if (!article) throw error(404, 'Article not found');

	// Mark as saved in DB
	await updateArticle(db, params.articleId, { is_saved: true });

	// Get tags for this article
	const tags = await listTagsForTarget(db, 'article', params.articleId);

	// Save to R2
	await saveArticleToR2(
		bucket,
		article,
		tags.map((t) => t.name)
	);

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.BUCKET;
	if (!db) throw error(500, 'Database not available');
	if (!bucket) throw error(500, 'R2 bucket not available');

	const article = await getArticleById(db, params.articleId);
	if (!article) throw error(404, 'Article not found');

	await updateArticle(db, params.articleId, { is_saved: false });
	await deleteArticleFromR2(bucket, params.articleId);

	return json({ ok: true });
};
