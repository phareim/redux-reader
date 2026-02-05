# Architecture Brief

## Summary
This is a Cloudflare-native RSS reader with a card-based reading UI, saved articles with in-text highlights/comments, and tagging with autocomplete. The system splits into a static app (Pages), an API (Workers), relational metadata in D1, and article content in R2.

## Cloudflare Services
- Pages for the web app UI.
- Workers for API and feed ingestion orchestration.
- D1 for relational data: users, feeds, items, tags, annotations metadata.
- R2 for article content and annotated article markup.
- KV for short-lived caching of feed discovery and fetch results.
- Turnstile optional for abuse protection on public endpoints.

## Core Data Model (D1)
- users: id, auth_provider, auth_subject, email, created_at.
- feeds: id, owner_user_id, title, site_url, feed_url, last_fetched_at, fetch_status.
- feed_items: id, feed_id, guid, title, url, author, published_at, summary, content_html, fetched_at.
- saved_items: id, user_id, feed_item_id, saved_at, r2_object_key_raw, r2_object_key_annotated, reading_state.
- tags: id, user_id, name, created_at.
- tag_links: id, user_id, target_type (feed|saved), target_id, tag_id.
- annotations: id, user_id, saved_item_id, type (highlight|comment), anchor, text, created_at, updated_at.

## Article Storage Strategy
- Raw article HTML stored in R2 at save time to guarantee retention.
- Annotated article HTML stored in R2 and treated as canonical for display.
- Annotation operations update markup in place and keep a parallel metadata record in D1.

## Annotation Format
- Use HTML data attributes for stable anchors and metadata.
- Example: wrap highlights with <mark data-anno-id="..." data-anno-type="highlight">...</mark>.
- Comments inserted with a <span data-anno-id="..." data-anno-type="comment"></span> plus a structured comment block at the end or inline.
- Anchor uses a stable selector with fallback (text quote + surrounding context).

## Feed Ingestion
- Feed discovery via URL inspection and HTML <link rel="alternate" type="application/rss+xml">.
- Fetch and parse RSS/Atom, normalize items, store to D1.
- Article fetcher pulls the full HTML, sanitizes, stores in R2 when user saves.

## Auth Options
- Default: OAuth (Google/GitHub) using Workers + JWT session tokens.
- Alternate: Cloudflare Access for private/team usage.
- Decision impacts users table and session strategy.

## Non-Goals (v1)
- Full-text search across all articles.
- Social sharing or collaborative annotation.

## Open Questions
- Auth provider choice and UI flow.
- How strict the sanitization should be for raw HTML.
- Whether to support OPML import at v1.
- Whether annotations require versioning or only last-write-wins.
