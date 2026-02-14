import { json, error } from '@sveltejs/kit';
import { getArticleById, updateArticle } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const article = await getArticleById(db, params.articleId);
	if (!article) throw error(404, 'Article not found');

	const body = await request.json();
	const updates: { is_read?: boolean; is_saved?: boolean } = {};

	if ('is_read' in body) updates.is_read = Boolean(body.is_read);
	if ('is_saved' in body) updates.is_saved = Boolean(body.is_saved);

	await updateArticle(db, params.articleId, updates);
	return json({ ok: true });
};
