// Cloudflare Pages route: GET/POST /auth/google/callback
// Google uses the shared callback validation, token exchange, and session logic.
import { completeGoogleOAuth } from "../_oauth.js";

export async function onRequestGet(context) {
  return completeGoogleOAuth(context);
}

export async function onRequestPost(context) {
  return completeGoogleOAuth(context);
}
