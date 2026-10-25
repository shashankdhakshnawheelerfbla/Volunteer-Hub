// Imports the named module or symbols so this file can use their functionality.
// This makes the referenced tools available to the code below.
import { createSession, enforceRateLimit, hasSameOrigin, json, verifyPassword } from "./_auth.js";

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function onRequestPost({ request, env }) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!env.DB) return json({ error: "Authentication is temporarily unavailable." }, 503);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!hasSameOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) return json({ error: "Expected a JSON request." }, 415);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!(await enforceRateLimit(env.DB, request, "login", 30, 900))) return json({ error: "Too many sign-in attempts. Please wait 15 minutes and try again." }, 429);

  // Assigns a value to `value` for later use.
  // Other statements can read this value to make decisions or perform work.
  let body;
  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  // Assigns a value to `email` for later use.
  // Other statements can read this value to make decisions or perform work.
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  // Assigns a value to `password` for later use.
  // Other statements can read this value to make decisions or perform work.
  const password = typeof body.password === "string" ? body.password : "";
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!email || !password || email.length > 254 || password.length > 1024) return json({ error: "Enter your email and password." }, 400);

  // Assigns a value to `lock` for later use.
  // Other statements can read this value to make decisions or perform work.
  const lock = await env.DB.prepare("SELECT locked_until FROM login_attempts WHERE email = ? AND locked_until > datetime('now')").bind(email).first();
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (lock) return json({ error: "Too many failed sign-in attempts. Please try again in 15 minutes." }, 429);
  // Assigns a value to `account` for later use.
  // Other statements can read this value to make decisions or perform work.
  const account = await env.DB.prepare(`SELECT v.id, v.name, v.email, c.password_hash, COALESCE(p.role, 'volunteer') AS role
    FROM volunteers v JOIN password_credentials c ON c.volunteer_id = v.id
    LEFT JOIN auth_profiles p ON p.volunteer_id = v.id WHERE lower(v.email) = ? LIMIT 1`).bind(email).first();

  // Assigns a value to `valid` for later use.
  // Other statements can read this value to make decisions or perform work.
  const valid = account ? await verifyPassword(password, account.password_hash) : false;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!valid) {
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await env.DB.prepare(`INSERT INTO login_attempts (email, failed_attempts, last_failed_at, locked_until)
      VALUES (?, 1, datetime('now'), NULL)
      ON CONFLICT(email) DO UPDATE SET
        failed_attempts = CASE WHEN login_attempts.last_failed_at < datetime('now', '-15 minutes') THEN 1 ELSE login_attempts.failed_attempts + 1 END,
        last_failed_at = datetime('now'),
        locked_until = CASE WHEN (CASE WHEN login_attempts.last_failed_at < datetime('now', '-15 minutes') THEN 1 ELSE login_attempts.failed_attempts + 1 END) >= 5 THEN datetime('now', '+15 minutes') ELSE NULL END`)
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      .bind(email).run();
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return json({ error: "Invalid email or password." }, 401);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }

  // Performs or waits for an operation, often involving another service or resource.
  // The result is used by the surrounding code to continue the workflow.
  await env.DB.prepare("DELETE FROM login_attempts WHERE email = ?").bind(email).run();
  // Assigns a value to `sessionCookie` for later use.
  // Other statements can read this value to make decisions or perform work.
  const sessionCookie = await createSession(env.DB, account.id);
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return json({ success: true, user: { id: account.id, name: account.name, email: account.email, role: account.role } }, 200, { "Set-Cookie": sessionCookie });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}
