import { listFeeds } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) return { feeds: [] };

	const feeds = await listFeeds(db, locals.user.id);
	return { feeds };
};
