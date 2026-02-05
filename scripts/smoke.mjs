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
  console.log("Usage: node scripts/smoke.mjs <url> [--base http://127.0.0.1:8787/api]");
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
  console.log("[1/6] Discovering feed...");
  const discovery = await request("/feeds/discover", {
    method: "POST",
    body: JSON.stringify({ url: targetUrl }),
  });

  const candidate = discovery.candidates?.[0];
  if (!candidate) throw new Error("No feed candidates returned.");

  console.log("[2/6] Subscribing...");
  const created = await request("/feeds", {
    method: "POST",
    body: JSON.stringify({
      feedUrl: candidate.feedUrl,
      siteUrl: candidate.siteUrl ?? targetUrl,
      title: candidate.title ?? null,
    }),
  });

  const feedId = created.feed?.id;
  if (!feedId) throw new Error("Feed creation failed.");

  console.log("[3/6] Refreshing feed...");
  await request(`/feeds/${feedId}/refresh`, { method: "POST" });

  console.log("[4/6] Fetching items...");
  const items = await request(`/feeds/${feedId}/items?limit=1`);
  const item = items.items?.[0];
  if (!item) throw new Error("No items found.");

  console.log("[5/6] Saving item...");
  const saved = await request("/saved", {
    method: "POST",
    body: JSON.stringify({ feedItemId: item.id }),
  });
  const savedId = saved.saved?.id;
  if (!savedId) throw new Error("Save failed.");

  console.log("[6/6] Fetching saved content...");
  const content = await request(`/saved/${savedId}/content`);
  if (!content.html) throw new Error("No saved content.");

  console.log("Smoke test passed.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
