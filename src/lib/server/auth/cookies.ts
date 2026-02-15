import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'auth_token';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function setAuthCookie(cookies: Cookies, token: string): void {
	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: MAX_AGE
	});
}

export function clearAuthCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getAuthToken(cookies: Cookies): string | undefined {
	return cookies.get(COOKIE_NAME);
}
