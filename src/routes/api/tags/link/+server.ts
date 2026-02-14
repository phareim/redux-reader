import { json, error } from '@sveltejs/kit';
import { linkTag, unlinkTag, getTagByName, createTag } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const { targetType, targetId, tagName } = await request.json();
	if (!targetType || !targetId || !tagName) {
		throw error(400, 'targetType, targetId, and tagName are required');
	}

	// Find or create tag
	let tag = await getTagByName(db, tagName.trim());
	if (!tag) {
		tag = await createTag(db, { id: crypto.randomUUID(), name: tagName.trim() });
	}

	await linkTag(db, {
		id: crypto.randomUUID(),
		targetType,
		targetId,
		tagId: tag.id
	});

	return json({ ok: true, tag });
};

export const DELETE: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(500, 'Database not available');

	const { targetType, targetId, tagId } = await request.json();
	if (!targetType || !targetId || !tagId) {
		throw error(400, 'targetType, targetId, and tagId are required');
	}

	await unlinkTag(db, { targetType, targetId, tagId });
	return json({ ok: true });
};
