import { fail, redirect } from '@sveltejs/kit';
import { verifyPassword } from '$lib/server/auth/password';
import { createToken } from '$lib/server/auth/jwt';
import { setAuthCookie } from '$lib/server/auth/cookies';
import { getUserByEmail } from '$lib/server/auth/users';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const db = platform?.env?.DB;
		const jwtSecret = platform?.env?.JWT_SECRET;
		if (!db || !jwtSecret) return fail(500, { error: 'Server configuration error', email: '' });

		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim();
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const user = await getUserByEmail(db, email);
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		const valid = await verifyPassword(password, user.password_hash, user.password_salt);
		if (!valid) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		const token = await createToken({ sub: user.id, email: user.email }, jwtSecret);
		setAuthCookie(cookies, token);

		throw redirect(303, '/');
	}
};
