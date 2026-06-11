import { env } from '$env/static/private';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_URL = 'https://cdn.hackclub.com/api/v4/upload';

function extForType(ct: string): string {
	if (ct === 'image/jpeg') return 'jpg';
	return ct.split('/')[1] ?? 'bin';
}

function safeFilename(name: string, ct: string): string {
	const cleaned = (name || 'screenshot').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'screenshot';
	const ext = extForType(ct);
	const dot = cleaned.lastIndexOf('.');
	const stem = dot === -1 ? cleaned : cleaned.slice(0, dot);
	return `${stem}.${ext}`;
}

export async function uploadImageBlob(blob: Blob, filename: string): Promise<string> {
	const apiKey = env.CDN_API_KEY;
	if (!apiKey) throw new Error('CDN_API_KEY is not configured');

	const ct = (blob.type ?? '').split(';')[0].trim().toLowerCase();
	if (!ALLOWED_TYPES.has(ct)) throw new Error(`not an image (got: ${ct || 'unknown'})`);
	if (blob.size > MAX_BYTES) throw new Error('image too large (max 10 MB)');
	if (blob.size === 0) throw new Error('empty file');

	const fd = new FormData();
	fd.append('file', blob, safeFilename(filename, ct));

	const res = await fetch(UPLOAD_URL, {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}` },
		body: fd
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`CDN upload failed (${res.status}): ${text.slice(0, 200)}`);
	}

	const data = (await res.json()) as { url?: string };
	if (!data.url) throw new Error('CDN response missing url');
	return data.url;
}
