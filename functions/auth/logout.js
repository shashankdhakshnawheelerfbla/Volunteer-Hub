import { clearSessionCookie, hasSameOrigin, json, readCookie, sha256Hex } from "./_auth.js";

export async function onRequestPost({ request, env }) {
  if (!hasSameOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  const token = readCookie(request, "__Host-vh_session");
  if (token && env.DB) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
