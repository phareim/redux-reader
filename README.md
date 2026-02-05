# Redux Reader

Cloudflare-native RSS reader with a card-based UI and inline article annotations.

## Quickstart (Local)
1. Install dependencies:
   - `npm install`
2. Create D1 + R2 + KV (one-time):
   - `npx wrangler d1 create redux_reader_db`
   - `npx wrangler r2 bucket create redux-reader-articles`
   - `npx wrangler kv:namespace create CACHE_KV`
3. Update IDs in `wrangler.toml`.
4. Apply migrations:
   - `npx wrangler d1 migrations apply redux_reader_db --local`
5. Run dev server:
   - `npm run dev`
6. Seed a feed (optional):
   - `npm run seed:feed -- https://example.com`

## Cloudflare Access
- Access should guard both the Pages app and the Worker API.
- The Worker reads Access headers to identify the user.

## API
See `docs/api-spec.md` for the draft endpoints.

## UI
Static UI lives in `web/`. For now it expects the API at `/api`.
