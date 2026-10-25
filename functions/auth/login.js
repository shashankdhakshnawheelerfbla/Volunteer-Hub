import { createSession, enforceRateLimit, hasSameOrigin, json, verifyPassword } from "./_auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Authentication is temporarily unavailable." }, 503);
  if (!hasSameOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) return json({ error: "Expected a JSON request." }, 415);
  if (!(await enforceRateLimit(env.DB, request, "login", 30, 900))) return json({ error: "Too many sign-in attempts. Please wait 15 minutes and try again." }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 1024) return json({ error: "Enter your email and password." }, 400);

  const lock = await env.DB.prepare("SELECT locked_until FROM login_attempts WHERE email = ? AND locked_until > datetime('now')").bind(email).first();
  if (lock) return json({ error: "Too many failed sign-in attempts. Please try again in 15 minutes." }, 429);
  const account = await env.DB.prepare(`SELECT v.id, v.name, v.email, c.password_hash, COALESCE(p.role, 'volunteer') AS role
    FROM volunteers v JOIN password_credentials c ON c.volunteer_id = v.id
    LEFT JOIN auth_profiles p ON p.volunteer_id = v.id WHERE lower(v.email) = ? LIMIT 1`).bind(email).first();

  const valid = account ? await verifyPassword(password, account.password_hash) : false;
  if (!valid) {
    await env.DB.prepare(`INSERT INTO login_attempts (email, failed_attempts, last_failed_at, locked_until)
      VALUES (?, 1, datetime('now'), NULL)
      ON CONFLICT(email) DO UPDATE SET
        failed_attempts = CASE WHEN login_attempts.last_failed_at < datetime('now', '-15 minutes') THEN 1 ELSE login_attempts.failed_attempts + 1 END,
        last_failed_at = datetime('now'),
        locked_until = CASE WHEN (CASE WHEN login_attempts.last_failed_at < datetime('now', '-15 minutes') THEN 1 ELSE login_attempts.failed_attempts + 1 END) >= 5 THEN datetime('now', '+15 minutes') ELSE NULL END`)
      .bind(email).run();
    return json({ error: "Invalid email or password." }, 401);
  }

  await env.DB.prepare("DELETE FROM login_attempts WHERE email = ?").bind(email).run();
  const sessionCookie = await createSession(env.DB, account.id);
  return json({ success: true, user: { id: account.id, name: account.name, email: account.email, role: account.role } }, 200, { "Set-Cookie": sessionCookie });
}
