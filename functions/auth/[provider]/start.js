import { startOAuth } from "../_oauth.js";

export async function onRequestGet(context) {
  return startOAuth(context);
}
