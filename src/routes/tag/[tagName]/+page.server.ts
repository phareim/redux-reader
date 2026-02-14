import { error } from '@sveltejs/kit';
import { getTagByName, listArticlesByTag, listFeedsByTag } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const tag = await getTagByName(db, decodeURIComponent(params.tagName));
	if (!tag) throw error(404, 'Tag not found');

	const [articles, feeds] = await Promise.all([
		listArticlesByTag(db, tag.name),
		listFeedsByTag(db, tag.name)
	]);

	return { tag, articles, feeds };
};
