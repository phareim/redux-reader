# API Spec (Draft)

## Conventions
- Base: `/api`
- Auth: `Authorization: Bearer <token>`
- JSON request/response.
- Pagination: `cursor` and `limit`.

## Auth
- `POST /api/auth/login` start OAuth flow.
- `GET /api/auth/callback` OAuth callback.
- `POST /api/auth/logout`

## Feeds
- `POST /api/feeds/discover`
  - Body: `{ "url": "https://example.com" }`
  - Response: `{ "candidates": [{ "title": "...", "feedUrl": "..." }] }`
- `POST /api/feeds`
  - Body: `{ "feedUrl": "...", "title": "...", "siteUrl": "..." }`
- `GET /api/feeds`
- `GET /api/feeds/:feedId/items?cursor=&limit=`

## Saved Items
- `POST /api/saved`
  - Body: `{ "feedItemId": "...", "tags": ["tech"] }`
- `GET /api/saved?cursor=&limit=`
- `DELETE /api/saved/:savedId`

## Tags
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
