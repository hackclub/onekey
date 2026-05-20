import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export function encryptToken(plaintext: string, key: Buffer): { ct: string; iv: string; tag: string } {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return {
		ct: ct.toString('base64'),
		iv: iv.toString('base64'),
		tag: tag.toString('base64')
	};
}

export function decryptToken(ct: string, iv: string, tag: string, key: Buffer): string {
	const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(tag, 'base64'));
	return Buffer.concat([
		decipher.update(Buffer.from(ct, 'base64')),
		decipher.final()
	]).toString('utf8');
}

export function generateSessionToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}
