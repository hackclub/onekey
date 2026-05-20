import { createHmac, timingSafeEqual } from 'crypto';

export function signCookie(data: string, secret: string): string {
	const sig = createHmac('sha256', secret).update(data).digest('base64url');
	return `${data}.${sig}`;
}

export function verifyCookie(signed: string, secret: string): string | null {
	const dot = signed.lastIndexOf('.');
	if (dot === -1) return null;
	const data = signed.slice(0, dot);
	const expected = createHmac('sha256', secret).update(data).digest('base64url');
	const actual = signed.slice(dot + 1);
	try {
		const a = Buffer.from(actual, 'base64url');
		const b = Buffer.from(expected, 'base64url');
		if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	} catch {
		return null;
	}
	return data;
}
