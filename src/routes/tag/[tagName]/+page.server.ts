import { error } from '@sveltejs/kit';
import { getTagByName, listArticlesByTag, listFeedsByTag } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');
	if (!locals.user) throw error(401, 'Not authenticated');

	const tag = await getTagByName(db, locals.user.id, decodeURIComponent(params.tagName));
	if (!tag) throw error(404, 'Tag not found');

	const [articles, feeds] = await Promise.all([
		listArticlesByTag(db, locals.user.id, tag.name),
		listFeedsByTag(db, locals.user.id, tag.name)
	]);

	return { tag, articles, feeds };
};
