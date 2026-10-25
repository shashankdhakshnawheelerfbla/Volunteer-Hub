const SESSION_COOKIE = "__Host-vh_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_ITERATIONS = 310000;

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "same-origin",
      ...extraHeaders,
    },
  });
}

export function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return null;
}

export function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromBase64url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomToken(bytes = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: PASSWORD_ITERATIONS }, key, 256);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, encoded) {
  try {
    const [algorithm, iterationsText, saltText, hashText] = encoded.split("$");
    const iterations = Number(iterationsText);
    if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) return false;
    const salt = fromBase64url(saltText);
    const expected = fromBase64url(hashText);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, expected.length * 8);
    return safeEqual(new Uint8Array(bits), expected);
  } catch {
    return false;
  }
}

export async function createSession(db, volunteerId) {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000).toISOString();
  await db.prepare("INSERT INTO auth_sessions (token_hash, volunteer_id, expires_at) VALUES (?, ?, ?)")
    .bind(tokenHash, volunteerId, expiresAt).run();
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function getSession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !env.DB) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(`
    SELECT v.id, v.name, v.email, COALESCE(p.role, 'volunteer') AS role, s.expires_at
    FROM auth_sessions s
    JOIN volunteers v ON v.id = s.volunteer_id
    LEFT JOIN auth_profiles p ON p.volunteer_id = v.id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first();
  if (!row) {
    await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
    return null;
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

export function hasSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

export async function enforceRateLimit(db, request, action, maxAttempts, windowSeconds) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const keyHash = await sha256Hex(`${action}:${ip}`);
  const now = Math.floor(Date.now() / 1000);
  const row = await db.prepare("SELECT attempts, window_started_at, blocked_until FROM auth_rate_limits WHERE key_hash = ?")
    .bind(keyHash).first();
  if (row && row.blocked_until > now) return false;
  if (!row || now - row.window_started_at >= windowSeconds) {
    await db.prepare(`INSERT INTO auth_rate_limits (key_hash, attempts, window_started_at, blocked_until)
      VALUES (?, 1, ?, 0) ON CONFLICT(key_hash) DO UPDATE SET attempts = 1, window_started_at = excluded.window_started_at, blocked_until = 0`)
      .bind(keyHash, now).run();
    return true;
  }
  if (row.attempts >= maxAttempts) {
    await db.prepare("UPDATE auth_rate_limits SET blocked_until = ? WHERE key_hash = ?")
      .bind(now + windowSeconds, keyHash).run();
    return false;
  }
  await db.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE key_hash = ?").bind(keyHash).run();
  return true;
}

export function baseUrlFor(request, env) {
  const configured = env.APP_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

export function redirect(url, headers = {}) {
  return new Response(null, { status: 303, headers: { Location: url, "Cache-Control": "no-store", ...headers } });
}
