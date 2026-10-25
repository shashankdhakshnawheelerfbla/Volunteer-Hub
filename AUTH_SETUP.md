# Volunteer Hub authentication update

This update keeps the existing Cloudflare Pages + D1 architecture. It adds email/password registration and sign-in, Google/Microsoft/Apple OAuth, hashed server-side sessions, rate limiting, and a small account dashboard.

## Files in this update

Copy these files into the matching paths in the existing repository:

- `functions/auth/_auth.js`
- `functions/auth/_oauth.js`
- `functions/auth/register.js`
- `functions/auth/login.js`
- `functions/auth/me.js`
- `functions/auth/logout.js`
- `functions/auth/[provider]/start.js`
- `functions/auth/[provider]/callback.js`
- Replace `functions/auth/google/callback.js`
- Replace `website/templates/login.html`
- Replace `website/templates/signup.html`
- Replace `website/templates/dashboard.html`
- Add `migrations/0003_provider_auth.sql`

Do not replace `wrangler.json`; the current D1 binding and Pages output directory are preserved.


## Important route fix in this bundle

Cloudflare Pages needs a function at `functions/auth/google/start.js` for the exact URL `/auth/google/start`. This bundle adds that explicit route and sends it to the shared OAuth implementation. The route is not a local file and will not work when an HTML page is opened with a `file:///` URL. Use the deployed HTTPS site.

## Check migration state before applying

This bundle omits the old `0002_sessions.sql` no-op migration and its backup because the project already has `0002_authentication.sql` and duplicate `0002` prefixes can cause migration ordering/confusion. Before applying migrations, inspect the remote state:

```powershell
npx wrangler d1 migrations list volunteer-db --remote
```

If `0002_authentication.sql` and `0003_provider_auth.sql` are already applied, do not try to apply them again; verify the required tables (`password_credentials`, `auth_sessions`, `login_attempts`, `auth_profiles`, `provider_accounts`, `auth_rate_limits`) exist. If a migration is pending, apply the migrations with the command below and read the output carefully. Never delete or reset the production D1 database to fix authentication.

## 1. Apply the D1 migration

From the repository folder in VS Code's terminal, run:

```powershell
npx wrangler d1 migrations apply volunteer-db --remote
```

Review the migration output. It creates provider links, account-role metadata, and a hashed-key rate-limit table. It does not drop or replace existing tables.

## 2. Set the production base URL

In Cloudflare Dashboard, open **Workers & Pages → volunteer-hub → Settings → Variables and Secrets**. Add a plain-text variable:

- `APP_BASE_URL` = `https://volunteer-hub-8iz.pages.dev`

If you use a custom domain later, change this value to that canonical HTTPS domain. OAuth callback URLs must match exactly.

## 3. Configure Google OAuth

In Google Cloud Console, create or use a Web application OAuth client. Add this Authorized redirect URI:

`https://volunteer-hub-8iz.pages.dev/auth/google/callback`

Add these values as Cloudflare Pages secrets (not GitHub files):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## 4. Configure Microsoft OAuth

In Microsoft Entra admin center, create an app registration that allows the account types your site should support. Add a **Web** redirect URI:

`https://volunteer-hub-8iz.pages.dev/auth/microsoft/callback`

Create a client secret, then add these Cloudflare Pages secrets:

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`

The implementation uses Microsoft's `common` endpoint and requests `openid profile email User.Read`.

## 5. Configure Apple Sign in

In Apple Developer, configure a Sign in with Apple primary App ID and a Services ID for the web app. Add the domain `volunteer-hub-8iz.pages.dev` and this Return URL:

`https://volunteer-hub-8iz.pages.dev/auth/apple/callback`

Create a Sign in with Apple key and add these Cloudflare Pages secrets:

- `APPLE_CLIENT_ID` (the Services ID)
- `APPLE_TEAM_ID`
- `APPLE_KEY_ID`
- `APPLE_PRIVATE_KEY` (the full `.p8` private key contents, stored only as a secret)

Apple web sign-in requires Apple Developer configuration and may require an active Apple Developer Program membership. Never put the `.p8` key in GitHub or HTML.

## 6. Add Cloudflare Pages secrets

Use the Cloudflare dashboard's **Settings → Variables and Secrets** page for the `volunteer-hub` Pages project, or Wrangler's Pages secret command. Add each provider secret in the **Production** environment. Add them to **Preview** too only if you configure separate OAuth redirect URLs for preview deployments.

Never put provider client secrets or the Apple private key in `wrangler.json`, source files, `.dev.vars.example`, or a committed `.env` file.

## 7. Deploy and test

After the files are committed and pushed to the branch Cloudflare Pages watches, let the Pages build finish. Then test on the deployed HTTPS URL:

1. Open `/templates/signup.html` and create a test account with a password of at least 12 characters.
2. Confirm the browser redirects to `/templates/dashboard.html` and shows the profile.
3. Sign out, then sign in again using the email/password.
4. Test each OAuth provider only after its secrets and exact callback URL are configured.
5. Confirm `/auth/me` returns the profile when signed in and HTTP 401 after sign-out.
6. Try several incorrect passwords to confirm the lockout/rate-limit messages appear.

The UI and backend routes can be deployed before provider credentials are configured, but social sign-in will show a setup error until the matching provider secrets are added.

## Security notes

- Passwords are stored as salted PBKDF2-SHA-256 hashes, never plaintext.
- Session tokens are random, stored as SHA-256 hashes in D1, and sent in an HttpOnly, Secure, SameSite cookie.
- OAuth state is checked. Google and Microsoft use PKCE. Apple ID tokens have their signature, issuer, audience, expiry, and nonce checked.
- Login and registration have IP-based rate limits. Repeated failed password attempts are temporarily locked.
- Microsoft sign-in does not automatically link an existing password account by email alone, because Microsoft does not guarantee that the email claim is verified. A user with an existing account may need to sign in with the original method first.
- This is a foundation, not a complete production identity-management suite. Email verification, password reset, account deletion, provider unlinking, and role-based authorization for organizer-only actions still need to be implemented before using those features.
