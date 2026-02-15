import type { User } from '$lib/types';

export async function createUser(
	db: D1Database,
	data: { id: string; email: string; passwordHash: string; passwordSalt: string; displayName?: string }
): Promise<User> {
	const now = new Date().toISOString();
	await db
		.prepare(
			'INSERT INTO users (id, email, password_hash, password_salt, display_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(data.id, data.email, data.passwordHash, data.passwordSalt, data.displayName ?? null, now, now)
		.run();

	return {
		id: data.id,
		email: data.email,
		display_name: data.displayName ?? null,
		created_at: now,
		updated_at: now
	};
}

export async function getUserByEmail(
	db: D1Database,
	email: string
): Promise<(User & { password_hash: string; password_salt: string }) | null> {
	return (
		(await db
			.prepare('SELECT * FROM users WHERE email = ?')
			.bind(email)
			.first<User & { password_hash: string; password_salt: string }>()) ?? null
	);
}

export async function getUserById(db: D1Database, userId: string): Promise<User | null> {
	return (
		(await db
			.prepare('SELECT id, email, display_name, created_at, updated_at FROM users WHERE id = ?')
			.bind(userId)
			.first<User>()) ?? null
	);
}
