// Compatibility route: GET /auth/start starts the same Google OAuth flow as /auth/google/start.
// Keeping one implementation prevents mismatched state cookies and callback validation.
import { startOAuth } from "./_oauth.js";

export async function onRequestGet(context) {
  return startOAuth({ ...context, params: { ...(context.params || {}), provider: "google" } });
}
