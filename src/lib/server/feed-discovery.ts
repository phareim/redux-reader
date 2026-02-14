export type FeedCandidate = {
	title?: string | null;
	feedUrl: string;
	siteUrl?: string | null;
};

const FEED_TYPES = new Set([
	'application/rss+xml',
	'application/atom+xml',
	'application/xml',
	'text/xml'
]);

const FEED_URL_HINTS = ['.rss', '.xml', '/feed', 'atom', 'rss'];

export async function discoverFeedCandidates(url: string): Promise<FeedCandidate[]> {
	const target = normalizeUrl(url);
	if (!target) return [];

	const response = await fetch(target, {
		headers: { 'user-agent': 'redux-reader/0.1' },
		redirect: 'follow'
	});

	if (!response.ok) return [];

	const contentType = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
	const body = await response.text();

	if (isLikelyFeed(contentType, body, target)) {
		return [
			{
				feedUrl: target,
				title: extractTagText(body, 'title')
			}
		];
	}

	return discoverFromHtml(body, target);
}

function isLikelyFeed(contentType: string, body: string, url: string): boolean {
	if (FEED_TYPES.has(contentType)) return true;
	if (FEED_URL_HINTS.some((hint) => url.toLowerCase().includes(hint))) {
		if (body.includes('<rss') || body.includes('<feed')) return true;
	}

	return body.includes('<rss') || body.includes('<feed');
}

function discoverFromHtml(html: string, baseUrl: string): FeedCandidate[] {
	const linkTags = html.match(/<link\s+[^>]*>/gi) ?? [];
	const candidates: FeedCandidate[] = [];

	for (const tag of linkTags) {
		const rel = getAttr(tag, 'rel');
		const type = getAttr(tag, 'type');
		if (!rel || !type) continue;
		if (!rel.toLowerCase().includes('alternate')) continue;
		if (!type.toLowerCase().includes('rss') && !type.toLowerCase().includes('atom')) continue;

		const href = getAttr(tag, 'href');
		if (!href) continue;

		const feedUrl = safeResolveUrl(href, baseUrl);
		if (!feedUrl) continue;

		candidates.push({
			feedUrl,
			title: getAttr(tag, 'title'),
			siteUrl: baseUrl
		});
	}

	return candidates;
}

function getAttr(tag: string, name: string): string | null {
	const regex = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
	const match = tag.match(regex);
	if (!match) return null;
	return match[2] ?? match[3] ?? match[4] ?? null;
}

function extractTagText(xml: string, tagName: string): string | null {
	const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
	const match = xml.match(regex);
	if (!match) return null;
	return match[1].replace(/\s+/g, ' ').trim();
}

function normalizeUrl(input: string): string | null {
	try {
		const url = new URL(input.includes('://') ? input : `https://${input}`);
		return url.toString();
	} catch {
		return null;
	}
}

function safeResolveUrl(href: string, baseUrl: string): string | null {
	try {
		return new URL(href, baseUrl).toString();
	} catch {
		return null;
	}
}
