const ITERATIONS = 100_000;
const HASH_ALGORITHM = 'SHA-256';
const SALT_LENGTH = 16;

function hexEncode(buffer: ArrayBuffer | Uint8Array): string {
	return Array.from(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function hexDecode(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(password);
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoded.buffer as ArrayBuffer,
		'PBKDF2',
		false,
		['deriveBits']
	);

	return crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: HASH_ALGORITHM },
		keyMaterial,
		256
	);
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
	const salt = new Uint8Array(SALT_LENGTH);
	crypto.getRandomValues(salt);
	const derived = await deriveKey(password, salt);
	return { hash: hexEncode(derived), salt: hexEncode(salt) };
}

export async function verifyPassword(
	password: string,
	hash: string,
	salt: string
): Promise<boolean> {
	const saltBytes = hexDecode(salt);
	const derived = await deriveKey(password, saltBytes);
	return hexEncode(derived) === hash;
}
