// Assigns a value to `SESSION_COOKIE` for later use.
// Other statements can read this value to make decisions or perform work.
const SESSION_COOKIE = "__Host-vh_session";
// Assigns a value to `SESSION_SECONDS` for later use.
// Other statements can read this value to make decisions or perform work.
const SESSION_SECONDS = 60 * 60 * 24 * 30;
// Assigns a value to `PASSWORD_ITERATIONS` for later use.
// Other statements can read this value to make decisions or perform work.
const PASSWORD_ITERATIONS = 310000;

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function json(data, status = 200, extraHeaders = {}) {
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return new Response(JSON.stringify(data), {
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    status,
    // Opens a block that groups related statements together.
    // The matching closing brace marks where this block ends.
    headers: {
      // Sets or updates `"Content-Type": "application/json; charset` using the expression on the right-hand side.
      // The assigned value is used by later logic or by the current configuration.
      "Content-Type": "application/json; charset=utf-8",
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      "Cache-Control": "no-store",
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      "X-Content-Type-Options": "nosniff",
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      "Referrer-Policy": "same-origin",
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      ...extraHeaders,
    // Defines or closes part of a structured data object or configuration block.
    // Its position and punctuation determine how the surrounding data is grouped.
    },
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function readCookie(request, name) {
  // Assigns a value to `raw` for later use.
  // Other statements can read this value to make decisions or perform work.
  const raw = request.headers.get("Cookie") || "";
  // Starts a loop over items or while a condition remains true.
  // The indented or braced block performs the repeated work.
  for (const part of raw.split(";")) {
    // Assigns a value to `index` for later use.
    // Other statements can read this value to make decisions or perform work.
    const index = part.indexOf("=");
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (index < 0) continue;
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return null;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function base64url(bytes) {
  // Assigns a value to `binary` for later use.
  // Other statements can read this value to make decisions or perform work.
  let binary = "";
  // Starts a loop over items or while a condition remains true.
  // The indented or braced block performs the repeated work.
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function fromBase64url(value) {
  // Assigns a value to `normalized` for later use.
  // Other statements can read this value to make decisions or perform work.
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  // Assigns a value to `binary` for later use.
  // Other statements can read this value to make decisions or perform work.
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function randomToken(bytes = 32) {
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function sha256Hex(value) {
  // Assigns a value to `digest` for later use.
  // Other statements can read this value to make decisions or perform work.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function safeEqual(a, b) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (a.length !== b.length) return false;
  // Assigns a value to `difference` for later use.
  // Other statements can read this value to make decisions or perform work.
  let difference = 0;
  // Starts a loop over items or while a condition remains true.
  // The indented or braced block performs the repeated work.
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return difference === 0;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function hashPassword(password) {
  // Assigns a value to `salt` for later use.
  // Other statements can read this value to make decisions or perform work.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  // Assigns a value to `key` for later use.
  // Other statements can read this value to make decisions or perform work.
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  // Assigns a value to `bits` for later use.
  // Other statements can read this value to make decisions or perform work.
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS }, key, 256);
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function verifyPassword(password, encoded) {
  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  try {
    // Assigns a value to `value` for later use.
    // Other statements can read this value to make decisions or perform work.
    const [algorithm, iterationsText, saltText, hashText] = encoded.split("$");
    // Assigns a value to `iterations` for later use.
    // Other statements can read this value to make decisions or perform work.
    const iterations = Number(iterationsText);
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) return false;
    // Assigns a value to `salt` for later use.
    // Other statements can read this value to make decisions or perform work.
    const salt = fromBase64url(saltText);
    // Assigns a value to `expected` for later use.
    // Other statements can read this value to make decisions or perform work.
    const expected = fromBase64url(hashText);
    // Assigns a value to `key` for later use.
    // Other statements can read this value to make decisions or perform work.
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    // Assigns a value to `bits` for later use.
    // Other statements can read this value to make decisions or perform work.
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, expected.length * 8);
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return safeEqual(new Uint8Array(bits), expected);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } catch {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return false;
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function createSession(db, volunteerId) {
  // Assigns a value to `token` for later use.
  // Other statements can read this value to make decisions or perform work.
  const token = randomToken(32);
  // Assigns a value to `tokenHash` for later use.
  // Other statements can read this value to make decisions or perform work.
  const tokenHash = await sha256Hex(token);
  // Assigns a value to `expiresAt` for later use.
  // Other statements can read this value to make decisions or perform work.
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  // Performs or waits for an operation, often involving another service or resource.
  // The result is used by the surrounding code to continue the workflow.
  await db.prepare("INSERT INTO auth_sessions (token_hash, volunteer_id, expires_at) VALUES (?, ?, ?)")
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    .bind(tokenHash, volunteerId, expiresAt).run();
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function clearSessionCookie() {
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function getSession(request, env) {
  // Assigns a value to `token` for later use.
  // Other statements can read this value to make decisions or perform work.
  const token = readCookie(request, SESSION_COOKIE);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!token || !env.DB) return null;
  // Assigns a value to `tokenHash` for later use.
  // Other statements can read this value to make decisions or perform work.
  const tokenHash = await sha256Hex(token);
  // Assigns a value to `row` for later use.
  // Other statements can read this value to make decisions or perform work.
  const row = await env.DB.prepare(`
    SELECT v.id, v.name, v.email, COALESCE(p.role, 'volunteer') AS role, s.expires_at
    FROM auth_sessions s
    JOIN volunteers v ON v.id = s.volunteer_id
    LEFT JOIN auth_profiles p ON p.volunteer_id = v.id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first();
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!row) {
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return null;
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return { id: row.id, name: row.name, email: row.email, role: row.role };
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function hasSameOrigin(request) {
  // Assigns a value to `origin` for later use.
  // Other statements can read this value to make decisions or perform work.
  const origin = request.headers.get("Origin");
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!origin) return false;
  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  try { return new URL(origin).origin === new URL(request.url).origin; }
  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  catch { return false; }
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function enforceRateLimit(db, request, action, maxAttempts, windowSeconds) {
  // Assigns a value to `ip` for later use.
  // Other statements can read this value to make decisions or perform work.
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  // Assigns a value to `keyHash` for later use.
  // Other statements can read this value to make decisions or perform work.
  const keyHash = await sha256Hex(`${action}:${ip}`);
  // Assigns a value to `now` for later use.
  // Other statements can read this value to make decisions or perform work.
  const now = Math.floor(Date.now() / 1000);
  // Assigns a value to `row` for later use.
  // Other statements can read this value to make decisions or perform work.
  const row = await db.prepare("SELECT attempts, window_started_at, blocked_until FROM auth_rate_limits WHERE key_hash = ?")
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    .bind(keyHash).first();
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (row && row.blocked_until > now) return false;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!row || now - row.window_started_at >= windowSeconds) {
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await db.prepare(`INSERT INTO auth_rate_limits (key_hash, attempts, window_started_at, blocked_until)
      VALUES (?, 1, ?, 0) ON CONFLICT(key_hash) DO UPDATE SET attempts = 1, window_started_at = excluded.window_started_at, blocked_until = 0`)
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      .bind(keyHash, now).run();
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return true;
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (row.attempts >= maxAttempts) {
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await db.prepare("UPDATE auth_rate_limits SET blocked_until = ? WHERE key_hash = ?")
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      .bind(now + windowSeconds, keyHash).run();
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return false;
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Performs or waits for an operation, often involving another service or resource.
  // The result is used by the surrounding code to continue the workflow.
  await db.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE key_hash = ?").bind(keyHash).run();
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return true;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function baseUrlFor(request, env) {
  // Assigns a value to `configured` for later use.
  // Other statements can read this value to make decisions or perform work.
  const configured = env.APP_BASE_URL;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (configured) return configured.replace(/\/$/, "");
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return new URL(request.url).origin;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export function redirect(url, headers = {}) {
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return new Response(null, { status: 303, headers: { Location: url, "Cache-Control": "no-store", ...headers } });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}
