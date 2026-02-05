#!/usr/bin/env node

const args = process.argv.slice(2);
let base = process.env.API_BASE || "http://127.0.0.1:8787/api";
let targetUrl = null;

for (let i = 0; i < args.length; i += 1) {
  const value = args[i];
  if (value === "--base") {
    base = args[i + 1];
    i += 1;
  } else if (!targetUrl) {
    targetUrl = value;
  }
}

if (!targetUrl) {
  console.log("Usage: node scripts/seed-feed.mjs <url> [--base http://127.0.0.1:8787/api]");
  process.exit(1);
}

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    headers: { "content-type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed ${response.status}: ${text}`);
  }

  return response.json();
}

async function run() {
  console.log(`Discovering feeds for ${targetUrl}...`);
  const discovery = await request("/feeds/discover", {
    method: "POST",
    body: JSON.stringify({ url: targetUrl }),
  });

  const candidate = discovery.candidates?.[0];
  if (!candidate) {
    console.log("No feed discovered.");
    return;
  }

  console.log(`Subscribing to ${candidate.feedUrl}...`);
  const created = await request("/feeds", {
    method: "POST",
    body: JSON.stringify({
      feedUrl: candidate.feedUrl,
      siteUrl: candidate.siteUrl ?? targetUrl,
      title: candidate.title ?? null,
    }),
  });

  const feedId = created.feed?.id;
  if (!feedId) {
    console.log("Feed create failed.");
    return;
  }

  console.log("Refreshing feed items...");
  await request(`/feeds/${feedId}/refresh`, { method: "POST" });

  const items = await request(`/feeds/${feedId}/items?limit=5`);
  console.log(`Fetched ${items.items?.length ?? 0} items.`);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
