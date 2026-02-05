export type ParsedFeed = {
  title?: string | null;
  siteUrl?: string | null;
  items: ParsedFeedItem[];
};

export type ParsedFeedItem = {
  guid: string;
  title?: string | null;
  url?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
  contentHtml?: string | null;
};

export async function fetchAndParseFeed(feedUrl: string): Promise<ParsedFeed> {
  const response = await fetch(feedUrl, {
    headers: { "user-agent": "redux-reader/0.1" },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Feed fetch failed: ${response.status}`);
  }

  const xml = await response.text();
  return parseFeed(xml, feedUrl);
}

export function parseFeed(xml: string, fallbackUrl?: string): ParsedFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const rssChannel = doc.querySelector("rss > channel");
  if (rssChannel) {
    return parseRss(rssChannel, fallbackUrl);
  }

  const atomFeed = doc.querySelector("feed");
  if (atomFeed) {
    return parseAtom(atomFeed, fallbackUrl);
  }

  return { title: null, siteUrl: fallbackUrl ?? null, items: [] };
}

function parseRss(channel: Element, fallbackUrl?: string): ParsedFeed {
  const title = getText(channel, "title");
  const siteUrl = getText(channel, "link") ?? fallbackUrl ?? null;
  const items: ParsedFeedItem[] = [];

  channel.querySelectorAll("item").forEach((item) => {
    const guid = getText(item, "guid") ?? getText(item, "link") ?? crypto.randomUUID();
    const titleText = getText(item, "title");
    const url = getText(item, "link");
    const publishedAt = getText(item, "pubDate") ?? getText(item, "dc:date");
    const summary = getText(item, "description");
    const contentHtml = getText(item, "content:encoded") ?? getText(item, "content");

    items.push({
      guid,
      title: titleText,
      url,
      publishedAt,
      summary,
      contentHtml,
    });
  });

  return { title, siteUrl, items };
}

function parseAtom(feed: Element, fallbackUrl?: string): ParsedFeed {
  const title = getText(feed, "title");
  const siteUrl = getAtomLink(feed, "alternate") ?? fallbackUrl ?? null;
  const items: ParsedFeedItem[] = [];

  feed.querySelectorAll("entry").forEach((entry) => {
    const guid = getText(entry, "id") ?? getAtomLink(entry, "alternate") ?? crypto.randomUUID();
    const titleText = getText(entry, "title");
    const url = getAtomLink(entry, "alternate");
    const publishedAt = getText(entry, "updated") ?? getText(entry, "published");
    const summary = getText(entry, "summary");
    const contentHtml = getText(entry, "content");

    items.push({
      guid,
      title: titleText,
      url,
      publishedAt,
      summary,
      contentHtml,
    });
  });

  return { title, siteUrl, items };
}

function getText(el: Element, selector: string): string | null {
  const node = el.querySelector(selector);
  if (!node || !node.textContent) return null;
  return node.textContent.trim();
}

function getAtomLink(el: Element, rel: string): string | null {
  const link = Array.from(el.querySelectorAll("link")).find((node) => {
    const nodeRel = node.getAttribute("rel");
    return !nodeRel || nodeRel === rel;
  });
  return link?.getAttribute("href") ?? null;
}
