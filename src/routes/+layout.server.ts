import { listFeedsWithUnreadCounts } from '$lib/server/db';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) return { feeds: [] };

	const feeds = await listFeedsWithUnreadCounts(db);
	return { feeds };
};
