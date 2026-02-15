import { redirect, type Handle } from '@sveltejs/kit';
import { verifyToken } from '$lib/server/auth/jwt';
import { getAuthToken } from '$lib/server/auth/cookies';

const PUBLIC_PATHS = ['/login', '/register'];

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const token = getAuthToken(event.cookies);
	if (token && event.platform?.env?.JWT_SECRET) {
		const payload = await verifyToken(token, event.platform.env.JWT_SECRET);
		if (payload) {
			event.locals.user = { id: payload.sub, email: payload.email };
		}
	}

	const isPublicPath = PUBLIC_PATHS.some((p) => event.url.pathname.startsWith(p));

	if (!event.locals.user && !isPublicPath) {
		throw redirect(303, '/login');
	}

	if (event.locals.user && isPublicPath) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
