import { createSession, enforceRateLimit, hashPassword, hasSameOrigin, json } from "./_auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: "Authentication is temporarily unavailable." }, 503);
  if (!hasSameOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) {
    return json({ error: "Expected a JSON request." }, 415);
  }
  if (!(await enforceRateLimit(env.DB, request, "register", 8, 3600))) {
    return json({ error: "Too many sign-up attempts. Please wait and try again later." }, 429);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "organizer" ? "organizer" : "volunteer";
  if (name.length < 2 || name.length > 100) return json({ error: "Enter a name between 2 and 100 characters." }, 400);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  if (password.length < 12 || new TextEncoder().encode(password).length > 1024) {
    return json({ error: "Your password must be at least 12 characters long." }, 400);
  }

  const existing = await env.DB.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(email).first();
  if (existing) return json({ error: "An account with that email already exists. Try signing in instead." }, 409);

  const passwordHash = await hashPassword(password);
  try {
    const inserted = await env.DB.prepare("INSERT INTO volunteers (name, email) VALUES (?, ?)").bind(name, email).run();
    const volunteerId = inserted.meta?.last_row_id;
    if (!volunteerId) throw new Error("Could not create account record");
    await env.DB.batch([
      env.DB.prepare("INSERT INTO password_credentials (volunteer_id, password_hash) VALUES (?, ?)").bind(volunteerId, passwordHash),
      env.DB.prepare("INSERT INTO auth_profiles (volunteer_id, role) VALUES (?, ?)").bind(volunteerId, role),
    ]);
    const sessionCookie = await createSession(env.DB, volunteerId);
    return json({ success: true, user: { id: volunteerId, name, email, role } }, 201, { "Set-Cookie": sessionCookie });
  } catch (error) {
    // If a duplicate registration raced this request, return a safe, user-facing message.
    const duplicate = await env.DB.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(email).first();
    if (duplicate) return json({ error: "An account with that email already exists. Try signing in instead." }, 409);
    console.error("Registration failed:", error instanceof Error ? error.message : "unknown error");
    return json({ error: "We couldn't create your account right now. Please try again." }, 500);
  }
}
