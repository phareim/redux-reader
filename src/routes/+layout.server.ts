import { listFeedsWithUnreadCounts } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) return { feeds: [], user: locals.user };

	if (!locals.user) return { feeds: [], user: null };

	const feeds = await listFeedsWithUnreadCounts(db, locals.user.id);
	return { feeds, user: locals.user };
};
