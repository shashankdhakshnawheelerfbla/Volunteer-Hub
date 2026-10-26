# Cloudflare notes for Volunteer-Hub

This folder contains project documentation for Cloudflare Pages and D1. Cloudflare does not require a folder named `cloudflare`; this folder is for notes only.

- Pages build output is configured as `website` in the root `wrangler.json`.
- The D1 binding is named `DB`.
- Keep `wrangler.json` in the project root unless you update deployment commands and configuration.
- SQL migration files belong in `migrations/`; preserve existing migration history.
- Store secrets using Cloudflare's secret settings/CLI. Never commit OAuth client secrets or private keys.
- Cloudflare Pages does not automatically run Python Flask applications.
