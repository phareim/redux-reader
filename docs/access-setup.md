# Cloudflare Access Setup (v1)

## Goal
Gate both the app (Pages) and the API (Worker) behind Cloudflare Access, so app sessions are authenticated at the edge and the Worker reads identity headers.

## Required Headers (Worker)
The Worker expects these headers set by Access:
- `Cf-Access-Authenticated-User-Email`
- `Cf-Access-Authenticated-User-Name`
- `Cf-Access-Authenticated-User-Id`
- `Cf-Access-Jwt-Assertion`

## Steps (High Level)
1. Create an Access Application for the Pages domain (e.g. `app.example.com`).
2. Add an Access policy allowing your users.
3. Create an Access Application for the Worker route or API subdomain (e.g. `api.example.com`).
4. Add the same Access policy to the API.

## Notes
- The app does not render a login UI; Access handles it before the app loads.
- Keep `auth_provider` and `auth_subject` in D1 to allow future OAuth.
- Local dev can use `DEV_BYPASS_AUTH=true` and `DEV_USER_EMAIL` in `wrangler.toml`.
