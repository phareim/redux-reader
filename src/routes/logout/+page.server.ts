import { redirect } from '@sveltejs/kit';
import { clearAuthCookie } from '$lib/server/auth/cookies';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		clearAuthCookie(cookies);
		throw redirect(303, '/login');
	}
};
