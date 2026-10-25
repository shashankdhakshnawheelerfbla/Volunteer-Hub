import { base64url, baseUrlFor, createSession, fromBase64url, json, randomToken, readCookie, redirect } from "./_auth.js";

const PROVIDERS = new Set(["google", "microsoft", "apple"]);
const COOKIE_TTL = 600;

function cookie(name, value, provider, maxAge = COOKIE_TTL) {
  const sameSite = provider === "apple" ? "None" : "Lax";
  return `${name}=${value}; HttpOnly; Secure; SameSite=${sameSite}; Path=/auth/${provider}; Max-Age=${maxAge}`;
}

function clearOAuthCookies(provider) {
  const sameSite = provider === "apple" ? "None" : "Lax";
  return ["state", "nonce", "verifier", "role"].map((part) =>
    `vh_${provider}_${part}=; HttpOnly; Secure; SameSite=${sameSite}; Path=/auth/${provider}; Max-Age=0`
  );
}

function getProviderSecrets(provider, env) {
  if (provider === "google") return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  if (provider === "microsoft") return { clientId: env.MICROSOFT_CLIENT_ID, clientSecret: env.MICROSOFT_CLIENT_SECRET };
  if (provider === "apple") return { clientId: env.APPLE_CLIENT_ID, clientSecret: null };
  return null;
}

async function makeAppleClientSecret(env) {
  if (!env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY || !env.APPLE_CLIENT_ID) {
    throw new Error("Apple provider secrets are incomplete");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: env.APPLE_KEY_ID, typ: "JWT" })));
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    iss: env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 60 * 60 * 24 * 150,
    aud: "https://appleid.apple.com",
    sub: env.APPLE_CLIENT_ID,
  })));
  const message = `${header}.${payload}`;
  const pem = env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const binary = atob(base64);
  const pkcs8 = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(message));
  return `${message}.${base64url(new Uint8Array(signature))}`;
}

function decodeJwtPart(part) {
  return JSON.parse(new TextDecoder().decode(fromBase64url(part)));
}

async function verifyAppleIdentity(idToken, clientId, expectedNonce) {
  const pieces = idToken.split(".");
  if (pieces.length !== 3) throw new Error("Malformed Apple identity token");
  const header = decodeJwtPart(pieces[0]);
  const claims = decodeJwtPart(pieces[1]);
  if (header.alg !== "ES256" || !header.kid) throw new Error("Unsupported Apple identity token");
  const jwksResponse = await fetch("https://appleid.apple.com/auth/keys", { headers: { Accept: "application/json" } });
  if (!jwksResponse.ok) throw new Error("Unable to retrieve Apple signing keys");
  const jwks = await jwksResponse.json();
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "EC" && key.crv === "P-256");
  if (!jwk) throw new Error("Apple signing key not found");
  const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const signatureValid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, fromBase64url(pieces[2]), new TextEncoder().encode(`${pieces[0]}.${pieces[1]}`));
  const now = Math.floor(Date.now() / 1000);
  if (!signatureValid || claims.iss !== "https://appleid.apple.com" || claims.aud !== clientId || !claims.sub || !claims.exp || claims.exp <= now || (claims.iat && claims.iat > now + 300) || claims.nonce !== expectedNonce) {
    throw new Error("Apple identity token validation failed");
  }
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  return { subject: claims.sub, email: typeof claims.email === "string" ? claims.email.toLowerCase() : "", name: "", emailVerified };
}

function providerAuthorizationUrl(provider, clientId, callbackUrl, state, nonce, challenge, role) {
  let url;
  const params = {
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    state,
  };
  // Apple returns an ID token whose nonce we validate. Google and Microsoft
  // identity is retrieved from their authenticated user-info endpoints instead.
  if (provider === "apple") params.nonce = nonce;
  if (provider === "google") {
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    Object.assign(params, { scope: "openid email profile", code_challenge: challenge, code_challenge_method: "S256" });
  } else if (provider === "microsoft") {
    url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    Object.assign(params, { scope: "openid profile email User.Read", code_challenge: challenge, code_challenge_method: "S256", response_mode: "query" });
  } else {
    url = new URL("https://appleid.apple.com/auth/authorize");
    Object.assign(params, { scope: "name email", response_mode: "form_post" });
  }
  params.state = state;
  // Preserve the selected account role for new OAuth-created accounts only.
  params.prompt = provider === "google" ? "select_account" : undefined;
  for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, value);
  return url;
}

export async function startOAuth({ request, env, params: routeParams }) {
  const url = new URL(request.url);
  const provider = routeParams?.provider || url.pathname.split("/").filter(Boolean).at(-2);
  if (!PROVIDERS.has(provider)) return new Response("Unknown sign-in provider.", { status: 404 });
  const secrets = getProviderSecrets(provider, env);
  if (!secrets?.clientId || (provider !== "apple" && !secrets.clientSecret) || (provider === "apple" && (!env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY))) {
    return redirect(`${baseUrlFor(request, env)}/templates/login.html?error=provider_not_configured`);
  }
  const state = randomToken(32);
  const nonce = randomToken(32);
  const verifier = randomToken(48);
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  const role = url.searchParams.get("role") === "organizer" ? "organizer" : "volunteer";
  const base = baseUrlFor(request, env);
  const callbackUrl = `${base}/auth/${provider}/callback`;
  const authUrl = providerAuthorizationUrl(provider, secrets.clientId, callbackUrl, state, nonce, challenge, role);
  const headers = new Headers({ Location: authUrl.toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  headers.append("Set-Cookie", cookie(`vh_${provider}_state`, state, provider));
  headers.append("Set-Cookie", cookie(`vh_${provider}_nonce`, nonce, provider));
  headers.append("Set-Cookie", cookie(`vh_${provider}_role`, role, provider));
  if (provider !== "apple") headers.append("Set-Cookie", cookie(`vh_${provider}_verifier`, verifier, provider));
  return new Response(null, { status: 302, headers });
}

async function exchangeCode(provider, code, callbackUrl, verifier, env) {
  const secrets = getProviderSecrets(provider, env);
  const form = new URLSearchParams({ grant_type: "authorization_code", code, client_id: secrets.clientId, redirect_uri: callbackUrl });
  if (provider === "apple") form.set("client_secret", await makeAppleClientSecret(env));
  else {
    form.set("client_secret", secrets.clientSecret);
    form.set("code_verifier", verifier);
  }
  const endpoint = provider === "google" ? "https://oauth2.googleapis.com/token" : provider === "microsoft" ? "https://login.microsoftonline.com/common/oauth2/v2.0/token" : "https://appleid.apple.com/auth/token";
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form });
  if (!response.ok) throw new Error(`${provider} token exchange failed`);
  return response.json();
}

async function getProviderIdentity(provider, tokens, expectedNonce, env) {
  if (provider === "apple") {
    if (!tokens.id_token) throw new Error("Apple did not return an identity token");
    return verifyAppleIdentity(tokens.id_token, env.APPLE_CLIENT_ID, expectedNonce);
  }
  if (!tokens.access_token) throw new Error(`${provider} did not return an access token`);
  const endpoint = provider === "google" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://graph.microsoft.com/oidc/userinfo";
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } });
  if (!response.ok) throw new Error(`${provider} user info request failed`);
  const identity = await response.json();
  if (!identity.sub || !identity.email) throw new Error(`${provider} did not return a usable email identity`);
  const emailVerified = provider === "google" && (identity.email_verified === true || identity.email_verified === "true");
  // Do not create an account or link a password account unless Google confirms the email.
  if (provider === "google" && !emailVerified) throw new Error("Google did not verify this email address");
  return {
    subject: String(identity.sub),
    email: String(identity.email).trim().toLowerCase(),
    name: typeof identity.name === "string" ? identity.name.trim() : "",
    emailVerified,
  };
}

async function getOrCreateProviderAccount(db, provider, identity, role, appleName = "") {
  const linked = await db.prepare("SELECT volunteer_id FROM provider_accounts WHERE provider = ? AND provider_subject = ?")
    .bind(provider, identity.subject).first();
  if (linked) return linked.volunteer_id;
  if (!identity.email || identity.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) throw new Error("Provider account did not return a valid email address");

  const existing = await db.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(identity.email).first();
  let volunteerId;
  if (existing) {
    // Auto-link only when the provider explicitly confirms the email is verified.
    // Microsoft identities are never auto-linked to a password account on email alone.
    if (!identity.emailVerified) throw new Error("An account with this email already exists. Sign in using your existing method first.");
    volunteerId = existing.id;
  } else {
    const name = (identity.name || appleName || identity.email.split("@")[0]).trim().slice(0, 100) || "Volunteer";
    const result = await db.prepare("INSERT INTO volunteers (name, email) VALUES (?, ?)").bind(name, identity.email).run();
    volunteerId = result.meta?.last_row_id;
    if (!volunteerId) {
      const raced = await db.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(identity.email).first();
      if (!raced || !identity.emailVerified) throw new Error("Could not create a profile for this provider account");
      volunteerId = raced.id;
    }
    await db.prepare("INSERT OR IGNORE INTO auth_profiles (volunteer_id, role) VALUES (?, ?)").bind(volunteerId, role).run();
  }
  await db.prepare("INSERT INTO provider_accounts (provider, provider_subject, volunteer_id) VALUES (?, ?, ?)")
    .bind(provider, identity.subject, volunteerId).run();
  return volunteerId;
}

async function handleCallback(context, forcedProvider = null) {
  const { request, env } = context;
  if (!env.DB) return new Response("Authentication is temporarily unavailable.", { status: 503 });
  const url = new URL(request.url);
  const provider = forcedProvider || context.params?.provider;
  if (!PROVIDERS.has(provider)) return new Response("Unknown sign-in provider.", { status: 404 });
  const base = baseUrlFor(request, env);
  const failure = (code) => {
    const target = new URL("/templates/login.html", base);
    target.searchParams.set("error", code);
    const headers = new Headers({ Location: target.toString(), "Cache-Control": "no-store" });
    for (const value of clearOAuthCookies(provider)) headers.append("Set-Cookie", value);
    return new Response(null, { status: 303, headers });
  };

  let params;
  let appleName = "";
  if (request.method === "POST") {
    const form = await request.formData();
    params = new URLSearchParams();
    for (const key of ["code", "state", "error", "error_description"]) {
      const value = form.get(key);
      if (typeof value === "string") params.set(key, value);
    }
    const userRaw = form.get("user");
    if (typeof userRaw === "string") {
      try {
        const user = JSON.parse(userRaw);
        appleName = [user.name?.firstName, user.name?.lastName].filter((part) => typeof part === "string").join(" ").trim();
      } catch { /* Apple name is optional and is only sent on first authorization. */ }
    }
  } else params = url.searchParams;

  const code = params.get("code");
  const state = params.get("state");
  const savedState = readCookie(request, `vh_${provider}_state`);
  const nonce = readCookie(request, `vh_${provider}_nonce`);
  const verifier = readCookie(request, `vh_${provider}_verifier`);
  const role = readCookie(request, `vh_${provider}_role`) === "organizer" ? "organizer" : "volunteer";
  if (params.get("error") || !code || !state || !savedState || state !== savedState || (provider === "apple" && !nonce) || (provider !== "apple" && !verifier)) return failure("provider_signin_failed");

  try {
    const secrets = getProviderSecrets(provider, env);
    if (!secrets?.clientId || (provider !== "apple" && !secrets.clientSecret)) return failure("provider_not_configured");
    const callbackUrl = `${base}/auth/${provider}/callback`;
    const tokens = await exchangeCode(provider, code, callbackUrl, verifier, env);
    const identity = await getProviderIdentity(provider, tokens, nonce, env);
    const volunteerId = await getOrCreateProviderAccount(env.DB, provider, identity, role, appleName);
    const user = await env.DB.prepare("SELECT v.id, v.name, v.email, COALESCE(p.role, 'volunteer') AS role FROM volunteers v LEFT JOIN auth_profiles p ON p.volunteer_id = v.id WHERE v.id = ?")
      .bind(volunteerId).first();
    if (!user) throw new Error("Could not load the account profile");
    const sessionCookie = await createSession(env.DB, volunteerId);
    const headers = new Headers({ Location: `${base}/templates/dashboard.html`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    headers.append("Set-Cookie", sessionCookie);
    for (const value of clearOAuthCookies(provider)) headers.append("Set-Cookie", value);
    return new Response(null, { status: 303, headers });
  } catch (error) {
    console.error(`${provider} sign-in failed:`, error instanceof Error ? error.message : "unknown error");
    const message = error instanceof Error && error.message.includes("already exists") ? "account_exists" : "provider_signin_failed";
    return failure(message);
  }
}

export async function completeOAuth(context) { return handleCallback(context); }
export async function completeGoogleOAuth(context) { return handleCallback(context, "google"); }
