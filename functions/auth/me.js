import { getSession, json } from "./_auth.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: "Authentication is temporarily unavailable." }, 503);
  const user = await getSession(request, env);
  if (!user) return json({ authenticated: false }, 401);
  return json({ authenticated: true, user });
}
