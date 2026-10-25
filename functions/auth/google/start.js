// Cloudflare Pages route: GET /auth/google/start
// Use the shared OAuth implementation while explicitly selecting Google.
import { startOAuth } from "../_oauth.js";

export async function onRequestGet(context) {
  return startOAuth({ ...context, params: { ...(context.params || {}), provider: "google" } });
}
