import { marked, type Tokens } from 'marked';
import hljs from 'highlight.js';

// Syntax-highlight fenced code blocks at parse time. highlight.js escapes its
// output, so the resulting HTML is safe to inject. Known languages are
// highlighted by name; anything else falls back to auto-detection.
marked.use({
	renderer: {
		code({ text, lang }: Tokens.Code): string {
			const language = (lang ?? '').trim().split(/\s+/)[0];
			const result =
				language && hljs.getLanguage(language)
					? hljs.highlight(text, { language })
					: hljs.highlightAuto(text);
			const cls = `hljs${language ? ` language-${language}` : ''}`;
			return `<pre><code class="${cls}">${result.value}</code></pre>\n`;
		}
	}
});

export type GuideSection = {
	id: string;
	title: string;
	content: string;
};

export type Guide = {
	slug: string;
	title: string;
	description: string;
	thumbnail: string;
	stack: string[];
	sections: GuideSection[];
};

// Eagerly load every .md file from src/lib/guides/ at build time
const files = import.meta.glob('./guides/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

type FrontmatterValue = string | string[] | number;

function parseFrontmatter(raw: string): {
	data: Record<string, FrontmatterValue>;
	body: string;
} {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) return { data: {}, body: raw };

	const data: Record<string, FrontmatterValue> = {};
	let currentKey = '';
	let arrayMode = false;
	const arrayBuf: string[] = [];

	for (const line of match[1].split(/\r?\n/)) {
		const listItem = line.match(/^  - (.+)$/);
		const kv       = line.match(/^(\w+): (.+)$/);
		const keyOnly  = line.match(/^(\w+):$/);

		if (listItem && arrayMode) {
			arrayBuf.push(listItem[1].trim());
		} else if (kv) {
			if (arrayMode && currentKey) data[currentKey] = [...arrayBuf];
			arrayBuf.length = 0;
			arrayMode = false;
			const val = kv[2].trim();
			data[kv[1]] = isNaN(Number(val)) ? val : Number(val);
			currentKey = kv[1];
		} else if (keyOnly) {
			if (arrayMode && currentKey) data[currentKey] = [...arrayBuf];
			arrayBuf.length = 0;
			currentKey = keyOnly[1];
			arrayMode = true;
		}
	}
	if (arrayMode && currentKey) data[currentKey] = [...arrayBuf];

	return { data, body: match[2] };
}

function parseGuide(slug: string, raw: string): { guide: Guide; order: number; draft: boolean } {
	const { data, body } = parseFrontmatter(raw);

	// Each ## heading starts a new section
	const sections: GuideSection[] = body
		.split(/^## /m)
		.slice(1)
		.map((chunk) => {
			const nl      = chunk.indexOf('\n');
			const title   = chunk.slice(0, nl).trim();
			const content = marked.parse(chunk.slice(nl + 1).trim()) as string;
			return { id: slugify(title), title, content };
		});

	const guide: Guide = {
		slug,
		title:       String(data.title       ?? slug),
		description: String(data.description ?? ''),
		thumbnail:   String(data.thumbnail   ?? ''),
		stack:       Array.isArray(data.stack) ? data.stack : [],
		sections
	};

	return { guide, order: Number(data.order ?? 0), draft: data.draft === true || data.draft === 'true' };
}

export const guides: Guide[] = Object.entries(files)
	.map(([path, raw]) => {
		const slug = path.replace('./guides/', '').replace(/\.md$/, '');
		return parseGuide(slug, raw);
	})
	.filter(({ draft }) => !draft)
	.sort((a, b) => a.order - b.order)
	.map(({ guide }) => guide);

export function getGuide(slug: string): Guide | undefined {
	return guides.find((g) => g.slug === slug);
}
