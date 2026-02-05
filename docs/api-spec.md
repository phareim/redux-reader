# API Spec (Draft)

## Conventions
- Base: `/api`
- Auth: Cloudflare Access required at the edge (no in-app login for v1).
- JSON request/response.
- Pagination: `cursor` and `limit`.

## Auth
- Cloudflare Access only (v1). No in-app login endpoints.

## Feeds
- `POST /api/feeds/discover`
  - Body: `{ "url": "https://example.com" }`
  - Response: `{ "candidates": [{ "title": "...", "feedUrl": "..." }] }`
- `POST /api/feeds`
  - Body: `{ "feedUrl": "...", "title": "...", "siteUrl": "..." }`
- `GET /api/feeds`
- `POST /api/feeds/:feedId/refresh`
- `GET /api/feeds/:feedId/items?cursor=&limit=`

## Saved Items
- `POST /api/saved`
  - Body: `{ "feedItemId": "..." }`
- `GET /api/saved?cursor=&limit=`
- `DELETE /api/saved/:savedId`
- `GET /api/saved/:savedId/content`
- `PUT /api/saved/:savedId/content`

## Tags (Planned)
- `GET /api/tags?type=feed|saved&query=`
- `POST /api/tags`
  - Body: `{ "name": "reading" }`
- `POST /api/tags/link`
  - Body: `{ "targetType": "feed|saved", "targetId": "...", "tagId": "..." }`
- `DELETE /api/tags/link`

## Annotations
- `POST /api/annotations`
  - Body: `{ "savedItemId": "...", "type": "highlight|comment", "anchor": { ... }, "text": "optional" }`
- `PATCH /api/annotations/:id`
- `DELETE /api/annotations/:id`
- `GET /api/saved/:savedId/annotations`

## Article Content
- `GET /api/saved/:savedId/content`
  - Response: `{ "html": "...", "version": 3 }`
- `PUT /api/saved/:savedId/content`
  - Body: `{ "html": "...", "version": 3 }`
