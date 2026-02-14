import { listFeeds } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return { feeds: [] };

	const feeds = await listFeeds(db);
	return { feeds };
};
