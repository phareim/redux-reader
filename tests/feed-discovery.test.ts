import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverFeedCandidates } from "../src/feed-discovery";

const html = `<!doctype html>
<html>
  <head>
    <title>Example</title>
    <link rel="alternate" type="application/rss+xml" title="RSS" href="/feed.xml" />
  </head>
  <body>Hi</body>
</html>`;

test("discoverFeedCandidates finds RSS link", async () => {
  globalThis.fetch = async () =>
    new Response(html, {
      status: 200,
      headers: { "content-type": "text/html" },
    });

  const candidates = await discoverFeedCandidates("https://example.com");
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].feedUrl, "https://example.com/feed.xml");
});
