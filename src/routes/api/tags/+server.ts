import { json, error } from '@sveltejs/kit';
import { listTags, createTag } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const query = url.searchParams.get('q');
	const tags = await listTags(db, query);
	return json(tags);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const { name } = await request.json();
	if (!name || typeof name !== 'string') throw error(400, 'Tag name is required');

	const tag = await createTag(db, { id: crypto.randomUUID(), name: name.trim() });
	return json(tag, { status: 201 });
};
