import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFeed } from "../src/feed-parser";
import { DOMParser } from "linkedom";

// Provide DOMParser for feed-parser in Node.
// eslint-disable-next-line no-global-assign
globalThis.DOMParser = DOMParser as typeof globalThis.DOMParser;

const rss = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Example Feed</title>
    <link>https://example.com</link>
    <item>
      <title>Item 1</title>
      <link>https://example.com/1</link>
      <guid>1</guid>
      <description>Summary</description>
    </item>
  </channel>
</rss>`;

test("parseFeed parses RSS items", () => {
  const parsed = parseFeed(rss, "https://example.com");
  assert.equal(parsed.title, "Example Feed");
  assert.equal(parsed.items.length, 1);
  assert.equal(parsed.items[0].guid, "1");
});
