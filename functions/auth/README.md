# Authentication endpoints — starter placeholders

These files are scaffolding only. The JavaScript endpoints return HTTP 501 until authentication is implemented. Do not deploy them expecting sign-in to work.

Before implementation, plan and test: password hashing with a suitable password-hashing algorithm, input validation, rate limiting, secure and expiring server-side sessions, session invalidation on logout, OAuth state and nonce validation, provider token/signature validation, redirect URI allowlists, CSRF protection, and safe account-linking rules. Do not link accounts solely because email addresses match. Keep credentials in Cloudflare secrets.
