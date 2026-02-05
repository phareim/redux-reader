# Deploy Plan (Cloudflare)

## Target
- UI on Cloudflare Pages.
- API on Cloudflare Workers.
- Storage: D1 + R2.
- Auth: Cloudflare Access in front of both app and API.
- Cron: Worker scheduled refresh every hour.

## Prereqs
- `npx wrangler whoami` to verify auth.
- Create D1 database and R2 bucket.

## Resources
- D1 database: `redux_reader_db`.
- R2 bucket: `redux-reader-articles`.

## Wrangler Config (Worker)
- `wrangler.toml` should include:
  - `d1_databases` binding.
  - `r2_buckets` binding.
  - `kv_namespaces` optional.
  - `vars` for public config.
  - `secrets` for auth provider keys.

## Pages
- Build command and output directory.
- Connect to repo for automatic deploys.
- Set environment variables for API base URL and auth.

## Migrations
- Store SQL migrations under `migrations/`.
- Run `wrangler d1 migrations apply` in CI for production.

## CI Outline
- Lint and unit tests.
- Build UI.
- Deploy Worker.
- Deploy Pages.

## Open Questions
- Whether to separate dev/staging/prod.
