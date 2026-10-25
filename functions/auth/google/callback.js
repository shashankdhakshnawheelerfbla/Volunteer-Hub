// Keep the existing Google callback route compatible while using the shared OAuth handler.
import { completeGoogleOAuth } from "../_oauth.js";

export async function onRequestGet(context) {
  return completeGoogleOAuth(context);
}

export async function onRequestPost(context) {
  return completeGoogleOAuth(context);
}
