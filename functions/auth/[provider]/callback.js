import { completeOAuth } from "../_oauth.js";

export async function onRequestGet(context) {
  return completeOAuth(context);
}

export async function onRequestPost(context) {
  return completeOAuth(context);
}
