import { fail, redirect } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/auth/password';
import { createToken } from '$lib/server/auth/jwt';
import { setAuthCookie } from '$lib/server/auth/cookies';
import { createUser, getUserByEmail } from '$lib/server/auth/users';
import type { Actions } from './$types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

function validatePassword(password: string): string | null {
	if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
	if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
	if (!/[0-9]/.test(password)) return 'Password must contain a number';
	return null;
}

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const db = platform?.env?.DB;
		const jwtSecret = platform?.env?.JWT_SECRET;
		if (!db || !jwtSecret) return fail(500, { error: 'Server configuration error', email: '' });

		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!email || !EMAIL_RE.test(email)) {
			return fail(400, { error: 'Please enter a valid email address', email });
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			return fail(400, { error: passwordError, email });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', email });
		}

		const existing = await getUserByEmail(db, email);
		if (existing) {
			return fail(400, { error: 'An account with this email already exists', email });
		}

		const { hash, salt } = await hashPassword(password);
		const userId = crypto.randomUUID();
		await createUser(db, {
			id: userId,
			email,
			passwordHash: hash,
			passwordSalt: salt
		});

		const token = await createToken({ sub: userId, email }, jwtSecret);
		setAuthCookie(cookies, token);

		throw redirect(303, '/');
	}
};
