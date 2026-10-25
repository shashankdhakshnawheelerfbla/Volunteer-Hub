# Volunteer Hub — Cloudflare Pages authentication repair

This ZIP is based on your uploaded project. It preserves `website/templates/login.html`, `signup.html`, and `dashboard.html`, and adds the missing explicit Google start route. The backend uses Cloudflare Pages Functions and the D1 binding `DB`.

## Diagnosis

- The screenshot showed a local `C:/auth/google/start?...` URL. OAuth routes are server endpoints; they cannot be opened as local files.
- The project has a shared OAuth implementation in `functions/auth/_oauth.js`, but it did not include `functions/auth/google/start.js`. The existing `functions/auth/start.js` maps to `/auth/start`, not `/auth/google/start`. This bundle adds the explicit Google route.
- Email/password UI uses `/auth/register`, `/auth/login`, `/auth/me`, and `/auth/logout`; these must be deployed as Pages Functions and connected to the correct D1 database.
- Provider sign-in will not work until the provider secrets and callback URI are configured in Cloudflare and Google Cloud. A code change cannot create those credentials for you.

## Important route and build fixes

- `functions/auth/google/start.js` explicitly maps `/auth/google/start` to the shared OAuth flow.
- `functions/auth/start.js` now delegates to that same flow, so the older `/auth/start` path cannot set a different state cookie that the callback would reject.
- Google identity is accepted only when Google's user-info endpoint reports `email_verified` as true.
- Cloudflare Pages serves `website/` as the site root. Therefore the login page is `/templates/login.html`, not a `file:///C:/...` URL.

## Deploy

1. Extract this ZIP and open the `Volunteer-Hub` folder in VS Code.
2. Confirm `wrangler.json` has the correct Pages output folder (`website`) and the correct D1 database ID.
3. In Cloudflare Dashboard → Workers & Pages → `volunteer-hub` → Settings → Variables and Secrets, add production secrets `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Add `APP_BASE_URL` as `https://volunteer-hub-8iz.pages.dev`. Do not put secrets in code or commit them.
4. In Google Cloud Console, configure OAuth consent screen and a Web OAuth client. Add this exact Authorized redirect URI: `https://volunteer-hub-8iz.pages.dev/auth/google/callback`. It must match exactly.
5. Before changing D1, inspect migrations:
   ```powershell
   npx wrangler d1 migrations list volunteer-db --remote
   ```
   The auth code expects tables from `migrations/0002_authentication.sql` and `migrations/0003_provider_auth.sql`. If those migrations are pending, apply with `npx wrangler d1 migrations apply volunteer-db --remote`. Read the result. Do not reset/drop the database.
6. Deploy this project to the `main` branch connected to Cloudflare Pages, or run `npx wrangler pages deploy website --project-name volunteer-hub` from the project root. Ensure the `functions` directory is included in the deployment.
7. Open `https://volunteer-hub-8iz.pages.dev/templates/signup.html` or `/templates/login.html`. Do not use a `file:///` URL.

## Test endpoints

- `https://volunteer-hub-8iz.pages.dev/auth/google/start` should redirect to Google when the secrets are set. If it returns to login with `provider_not_configured`, a required secret is missing.
- `https://volunteer-hub-8iz.pages.dev/auth/me` should return JSON `authenticated: false` with HTTP 401 when signed out.
- Signup should POST JSON to `/auth/register`; login should POST JSON to `/auth/login`. Both should redirect to `/templates/dashboard.html` after success.
- Dashboard checks `/auth/me` and sign-out POSTs to `/auth/logout`.

## Notes

- I cannot deploy to your Cloudflare account or inspect its live secrets from this ZIP. The bundle repairs the missing route and provides setup steps; live authentication depends on applying/deploying it and setting provider secrets.
- Microsoft and Apple links are included in the existing UI but require their own provider secrets and developer-console setup.
- Review the migration list before applying anything because the remote D1 database may already have some migrations.
