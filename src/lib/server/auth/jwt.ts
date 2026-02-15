const EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

function base64UrlEncode(data: Uint8Array): string {
	let binary = '';
	for (const byte of data) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
	const padded = str.replace(/-/g, '+').replace(/_/g, '/');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}

const encoder = new TextEncoder();

async function getKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

async function sign(input: string, secret: string): Promise<string> {
	const key = await getKey(secret);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(input));
	return base64UrlEncode(new Uint8Array(signature));
}

export type JwtPayload = {
	sub: string;
	email: string;
	iat: number;
	exp: number;
};

export async function createToken(
	payload: { sub: string; email: string },
	secret: string
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const fullPayload: JwtPayload = {
		...payload,
		iat: now,
		exp: now + EXPIRY_SECONDS
	};

	const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
	const body = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)));
	const signature = await sign(`${header}.${body}`, secret);

	return `${header}.${body}.${signature}`;
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
	const parts = token.split('.');
	if (parts.length !== 3) return null;

	const [header, body, signature] = parts;

	const expectedSignature = await sign(`${header}.${body}`, secret);
	if (signature !== expectedSignature) return null;

	try {
		const payload = JSON.parse(
			new TextDecoder().decode(base64UrlDecode(body))
		) as JwtPayload;

		const now = Math.floor(Date.now() / 1000);
		if (payload.exp < now) return null;

		return payload;
	} catch {
		return null;
	}
}
