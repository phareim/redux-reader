import type { Article } from '$lib/types';

export type SavedArticleJson = {
	id: string;
	title: string | null;
	url: string | null;
	author: string | null;
	published_at: string | null;
	content_html: string | null;
	summary: string | null;
	feed_id: string;
	feed_title: string | null;
	saved_at: string;
	tags: string[];
};

function articleKey(userId: string, articleId: string): string {
	return `users/${userId}/articles/${articleId}.json`;
}

export async function saveArticleToR2(
	bucket: R2Bucket,
	userId: string,
	article: Article & { feed_title: string | null },
	tags: string[]
): Promise<void> {
	const data: SavedArticleJson = {
		id: article.id,
		title: article.title,
		url: article.url,
		author: article.author,
		published_at: article.published_at,
		content_html: article.content_html,
		summary: article.summary,
		feed_id: article.feed_id,
		feed_title: article.feed_title,
		saved_at: new Date().toISOString(),
		tags
	};

	await bucket.put(articleKey(userId, article.id), JSON.stringify(data), {
		httpMetadata: { contentType: 'application/json' }
	});
}

export async function getArticleFromR2(
	bucket: R2Bucket,
	userId: string,
	articleId: string
): Promise<SavedArticleJson | null> {
	const obj = await bucket.get(articleKey(userId, articleId));
	if (!obj) return null;
	return (await obj.json()) as SavedArticleJson;
}

export async function deleteArticleFromR2(
	bucket: R2Bucket,
	userId: string,
	articleId: string
): Promise<void> {
	await bucket.delete(articleKey(userId, articleId));
}
