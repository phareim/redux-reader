import { json, error } from '@sveltejs/kit';
import { listTags, createTag } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');
	if (!locals.user) throw error(401, 'Not authenticated');

	const query = url.searchParams.get('q');
	const tags = await listTags(db, locals.user.id, query);
	return json(tags);
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');
	if (!locals.user) throw error(401, 'Not authenticated');

	const { name } = await request.json();
	if (!name || typeof name !== 'string') throw error(400, 'Tag name is required');

	const tag = await createTag(db, locals.user.id, { id: crypto.randomUUID(), name: name.trim() });
	return json(tag, { status: 201 });
};
