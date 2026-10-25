// Imports the named module or symbols so this file can use their functionality.
// This makes the referenced tools available to the code below.
import { base64url, baseUrlFor, createSession, fromBase64url, json, randomToken, readCookie, redirect } from "./_auth.js";

// Assigns a value to `PROVIDERS` for later use.
// Other statements can read this value to make decisions or perform work.
const PROVIDERS = new Set(["google", "microsoft", "apple"]);
// Assigns a value to `COOKIE_TTL` for later use.
// Other statements can read this value to make decisions or perform work.
const COOKIE_TTL = 600;

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
function cookie(name, value, provider, maxAge = COOKIE_TTL) {
  // Assigns a value to `sameSite` for later use.
  // Other statements can read this value to make decisions or perform work.
  const sameSite = provider === "apple" ? "None" : "Lax";
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return `${name}=${value}; HttpOnly; Secure; SameSite=${sameSite}; Path=/auth/${provider}; Max-Age=${maxAge}`;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
function clearOAuthCookies(provider) {
  // Assigns a value to `sameSite` for later use.
  // Other statements can read this value to make decisions or perform work.
  const sameSite = provider === "apple" ? "None" : "Lax";
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return ["state", "nonce", "verifier", "role"].map((part) =>
    // Sets or updates ``vh_${provider}_${part}` using the expression on the right-hand side.
    // The assigned value is used by later logic or by the current configuration.
    `vh_${provider}_${part}=; HttpOnly; Secure; SameSite=${sameSite}; Path=/auth/${provider}; Max-Age=0`
  // Executes the statement or expression written on this line.
  // It contributes to the behavior of this file at this point in the workflow.
  );
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
function getProviderSecrets(provider, env) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "google") return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET };
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "microsoft") return { clientId: env.MICROSOFT_CLIENT_ID, clientSecret: env.MICROSOFT_CLIENT_SECRET };
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "apple") return { clientId: env.APPLE_CLIENT_ID, clientSecret: null };
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return null;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
async function makeAppleClientSecret(env) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY || !env.APPLE_CLIENT_ID) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    throw new Error("Apple provider secrets are incomplete");
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Assigns a value to `now` for later use.
  // Other statements can read this value to make decisions or perform work.
  const now = Math.floor(Date.now() / 1000);
  // Assigns a value to `header` for later use.
  // Other statements can read this value to make decisions or perform work.
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: env.APPLE_KEY_ID, typ: "JWT" })));
  // Assigns a value to `payload` for later use.
  // Other statements can read this value to make decisions or perform work.
  const payload = base64url(new TextEncoder().encode(JSON.stringify({
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    iss: env.APPLE_TEAM_ID,
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    iat: now,
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    exp: now + 60 * 60 * 24 * 150,
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    aud: "https://appleid.apple.com",
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    sub: env.APPLE_CLIENT_ID,
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  })));
  // Assigns a value to `message` for later use.
  // Other statements can read this value to make decisions or perform work.
  const message = `${header}.${payload}`;
  // Assigns a value to `pem` for later use.
  // Other statements can read this value to make decisions or perform work.
  const pem = env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  // Assigns a value to `base64` for later use.
  // Other statements can read this value to make decisions or perform work.
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  // Assigns a value to `binary` for later use.
  // Other statements can read this value to make decisions or perform work.
  const binary = atob(base64);
  // Assigns a value to `pkcs8` for later use.
  // Other statements can read this value to make decisions or perform work.
  const pkcs8 = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // Assigns a value to `key` for later use.
  // Other statements can read this value to make decisions or perform work.
  const key = await crypto.subtle.importKey("pkcs8", pkcs8, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  // Assigns a value to `signature` for later use.
  // Other statements can read this value to make decisions or perform work.
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(message));
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return `${message}.${base64url(new Uint8Array(signature))}`;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
function decodeJwtPart(part) {
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return JSON.parse(new TextDecoder().decode(fromBase64url(part)));
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
async function verifyAppleIdentity(idToken, clientId, expectedNonce) {
  // Assigns a value to `pieces` for later use.
  // Other statements can read this value to make decisions or perform work.
  const pieces = idToken.split(".");
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (pieces.length !== 3) throw new Error("Malformed Apple identity token");
  // Assigns a value to `header` for later use.
  // Other statements can read this value to make decisions or perform work.
  const header = decodeJwtPart(pieces[0]);
  // Assigns a value to `claims` for later use.
  // Other statements can read this value to make decisions or perform work.
  const claims = decodeJwtPart(pieces[1]);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (header.alg !== "ES256" || !header.kid) throw new Error("Unsupported Apple identity token");
  // Assigns a value to `jwksResponse` for later use.
  // Other statements can read this value to make decisions or perform work.
  const jwksResponse = await fetch("https://appleid.apple.com/auth/keys", { headers: { Accept: "application/json" } });
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!jwksResponse.ok) throw new Error("Unable to retrieve Apple signing keys");
  // Assigns a value to `jwks` for later use.
  // Other statements can read this value to make decisions or perform work.
  const jwks = await jwksResponse.json();
  // Assigns a value to `jwk` for later use.
  // Other statements can read this value to make decisions or perform work.
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "EC" && key.crv === "P-256");
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!jwk) throw new Error("Apple signing key not found");
  // Assigns a value to `publicKey` for later use.
  // Other statements can read this value to make decisions or perform work.
  const publicKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  // Assigns a value to `signatureValid` for later use.
  // Other statements can read this value to make decisions or perform work.
  const signatureValid = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, publicKey, fromBase64url(pieces[2]), new TextEncoder().encode(`${pieces[0]}.${pieces[1]}`));
  // Assigns a value to `now` for later use.
  // Other statements can read this value to make decisions or perform work.
  const now = Math.floor(Date.now() / 1000);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!signatureValid || claims.iss !== "https://appleid.apple.com" || claims.aud !== clientId || !claims.sub || !claims.exp || claims.exp <= now || (claims.iat && claims.iat > now + 300) || claims.nonce !== expectedNonce) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    throw new Error("Apple identity token validation failed");
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Assigns a value to `emailVerified` for later use.
  // Other statements can read this value to make decisions or perform work.
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return { subject: claims.sub, email: typeof claims.email === "string" ? claims.email.toLowerCase() : "", name: "", emailVerified };
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
function providerAuthorizationUrl(provider, clientId, callbackUrl, state, nonce, challenge, role) {
  // Assigns a value to `value` for later use.
  // Other statements can read this value to make decisions or perform work.
  let url;
  // Assigns a value to `params` for later use.
  // Other statements can read this value to make decisions or perform work.
  const params = {
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    client_id: clientId,
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    redirect_uri: callbackUrl,
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    response_type: "code",
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    state,
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  };
  // Apple returns an ID token whose nonce we validate. Google and Microsoft
  // identity is retrieved from their authenticated user-info endpoints instead.
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "apple") params.nonce = nonce;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "google") {
    // Assigns a value to `url` for later use.
    // Other statements can read this value to make decisions or perform work.
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    Object.assign(params, { scope: "openid email profile", code_challenge: challenge, code_challenge_method: "S256" });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } else if (provider === "microsoft") {
    // Assigns a value to `url` for later use.
    // Other statements can read this value to make decisions or perform work.
    url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    Object.assign(params, { scope: "openid profile email User.Read", code_challenge: challenge, code_challenge_method: "S256", response_mode: "query" });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } else {
    // Assigns a value to `url` for later use.
    // Other statements can read this value to make decisions or perform work.
    url = new URL("https://appleid.apple.com/auth/authorize");
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    Object.assign(params, { scope: "name email", response_mode: "form_post" });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Sets or updates `params.state` using the expression on the right-hand side.
  // The assigned value is used by later logic or by the current configuration.
  params.state = state;
  // Preserve the selected account role for new OAuth-created accounts only.
  // Sets or updates `params.prompt` using the expression on the right-hand side.
  // The assigned value is used by later logic or by the current configuration.
  params.prompt = provider === "google" ? "select_account" : undefined;
  // Starts a loop over items or while a condition remains true.
  // The indented or braced block performs the repeated work.
  for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, value);
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return url;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function startOAuth({ request, env, params: routeParams }) {
  // Assigns a value to `url` for later use.
  // Other statements can read this value to make decisions or perform work.
  const url = new URL(request.url);
  // Assigns a value to `provider` for later use.
  // Other statements can read this value to make decisions or perform work.
  const provider = routeParams?.provider || url.pathname.split("/").filter(Boolean).at(-2);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!PROVIDERS.has(provider)) return new Response("Unknown sign-in provider.", { status: 404 });
  // Assigns a value to `secrets` for later use.
  // Other statements can read this value to make decisions or perform work.
  const secrets = getProviderSecrets(provider, env);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!secrets?.clientId || (provider !== "apple" && !secrets.clientSecret) || (provider === "apple" && (!env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY))) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return redirect(`${baseUrlFor(request, env)}/templates/login.html?error=provider_not_configured`);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Assigns a value to `state` for later use.
  // Other statements can read this value to make decisions or perform work.
  const state = randomToken(32);
  // Assigns a value to `nonce` for later use.
  // Other statements can read this value to make decisions or perform work.
  const nonce = randomToken(32);
  // Assigns a value to `verifier` for later use.
  // Other statements can read this value to make decisions or perform work.
  const verifier = randomToken(48);
  // Assigns a value to `challenge` for later use.
  // Other statements can read this value to make decisions or perform work.
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
  // Assigns a value to `role` for later use.
  // Other statements can read this value to make decisions or perform work.
  const role = url.searchParams.get("role") === "organizer" ? "organizer" : "volunteer";
  // Assigns a value to `base` for later use.
  // Other statements can read this value to make decisions or perform work.
  const base = baseUrlFor(request, env);
  // Assigns a value to `callbackUrl` for later use.
  // Other statements can read this value to make decisions or perform work.
  const callbackUrl = `${base}/auth/${provider}/callback`;
  // Assigns a value to `authUrl` for later use.
  // Other statements can read this value to make decisions or perform work.
  const authUrl = providerAuthorizationUrl(provider, secrets.clientId, callbackUrl, state, nonce, challenge, role);
  // Assigns a value to `headers` for later use.
  // Other statements can read this value to make decisions or perform work.
  const headers = new Headers({ Location: authUrl.toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  // Executes the statement or expression written on this line.
  // It contributes to the behavior of this file at this point in the workflow.
  headers.append("Set-Cookie", cookie(`vh_${provider}_state`, state, provider));
  // Executes the statement or expression written on this line.
  // It contributes to the behavior of this file at this point in the workflow.
  headers.append("Set-Cookie", cookie(`vh_${provider}_nonce`, nonce, provider));
  // Executes the statement or expression written on this line.
  // It contributes to the behavior of this file at this point in the workflow.
  headers.append("Set-Cookie", cookie(`vh_${provider}_role`, role, provider));
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider !== "apple") headers.append("Set-Cookie", cookie(`vh_${provider}_verifier`, verifier, provider));
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return new Response(null, { status: 302, headers });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
async function exchangeCode(provider, code, callbackUrl, verifier, env) {
  // Assigns a value to `secrets` for later use.
  // Other statements can read this value to make decisions or perform work.
  const secrets = getProviderSecrets(provider, env);
  // Assigns a value to `form` for later use.
  // Other statements can read this value to make decisions or perform work.
  const form = new URLSearchParams({ grant_type: "authorization_code", code, client_id: secrets.clientId, redirect_uri: callbackUrl });
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "apple") form.set("client_secret", await makeAppleClientSecret(env));
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  else {
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    form.set("client_secret", secrets.clientSecret);
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    form.set("code_verifier", verifier);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Assigns a value to `endpoint` for later use.
  // Other statements can read this value to make decisions or perform work.
  const endpoint = provider === "google" ? "https://oauth2.googleapis.com/token" : provider === "microsoft" ? "https://login.microsoftonline.com/common/oauth2/v2.0/token" : "https://appleid.apple.com/auth/token";
  // Assigns a value to `response` for later use.
  // Other statements can read this value to make decisions or perform work.
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form });
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!response.ok) throw new Error(`${provider} token exchange failed`);
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return response.json();
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
async function getProviderIdentity(provider, tokens, expectedNonce, env) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (provider === "apple") {
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (!tokens.id_token) throw new Error("Apple did not return an identity token");
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return verifyAppleIdentity(tokens.id_token, env.APPLE_CLIENT_ID, expectedNonce);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!tokens.access_token) throw new Error(`${provider} did not return an access token`);
  // Assigns a value to `endpoint` for later use.
  // Other statements can read this value to make decisions or perform work.
  const endpoint = provider === "google" ? "https://openidconnect.googleapis.com/v1/userinfo" : "https://graph.microsoft.com/oidc/userinfo";
  // Assigns a value to `response` for later use.
  // Other statements can read this value to make decisions or perform work.
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } });
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!response.ok) throw new Error(`${provider} user info request failed`);
  // Assigns a value to `identity` for later use.
  // Other statements can read this value to make decisions or perform work.
  const identity = await response.json();
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!identity.sub || !identity.email) throw new Error(`${provider} did not return a usable email identity`);
<<<<<<< HEAD
  const emailVerified = provider === "google" && (identity.email_verified === true || identity.email_verified === "true");
  // Do not create an account or link a password account unless Google confirms the email.
  if (provider === "google" && !emailVerified) throw new Error("Google did not verify this email address");
=======
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
>>>>>>> adeaa21d954fbc6755d0d3cea722549360051eae
  return {
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    subject: String(identity.sub),
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    email: String(identity.email).trim().toLowerCase(),
    // Sets or updates `name: typeof identity.name` using the expression on the right-hand side.
    // The assigned value is used by later logic or by the current configuration.
    name: typeof identity.name === "string" ? identity.name.trim() : "",
<<<<<<< HEAD
    emailVerified,
=======
    // Sets or updates `emailVerified: provider` using the expression on the right-hand side.
    // The assigned value is used by later logic or by the current configuration.
    emailVerified: provider === "google" ? (identity.email_verified === true || identity.email_verified === "true") : false,
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
>>>>>>> adeaa21d954fbc6755d0d3cea722549360051eae
  };
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
async function getOrCreateProviderAccount(db, provider, identity, role, appleName = "") {
  // Assigns a value to `linked` for later use.
  // Other statements can read this value to make decisions or perform work.
  const linked = await db.prepare("SELECT volunteer_id FROM provider_accounts WHERE provider = ? AND provider_subject = ?")
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    .bind(provider, identity.subject).first();
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (linked) return linked.volunteer_id;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!identity.email || identity.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) throw new Error("Provider account did not return a valid email address");

  // Assigns a value to `existing` for later use.
  // Other statements can read this value to make decisions or perform work.
  const existing = await db.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(identity.email).first();
  // Assigns a value to `value` for later use.
  // Other statements can read this value to make decisions or perform work.
  let volunteerId;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (existing) {
    // Auto-link only when the provider explicitly confirms the email is verified.
    // Microsoft identities are never auto-linked to a password account on email alone.
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (!identity.emailVerified) throw new Error("An account with this email already exists. Sign in using your existing method first.");
    // Assigns a value to `volunteerId` for later use.
    // Other statements can read this value to make decisions or perform work.
    volunteerId = existing.id;
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } else {
    // Declares a function or function-valued variable for a reusable operation.
    // The body defines what happens when this operation is called.
    const name = (identity.name || appleName || identity.email.split("@")[0]).trim().slice(0, 100) || "Volunteer";
    // Assigns a value to `result` for later use.
    // Other statements can read this value to make decisions or perform work.
    const result = await db.prepare("INSERT INTO volunteers (name, email) VALUES (?, ?)").bind(name, identity.email).run();
    // Assigns a value to `volunteerId` for later use.
    // Other statements can read this value to make decisions or perform work.
    volunteerId = result.meta?.last_row_id;
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (!volunteerId) {
      // Assigns a value to `raced` for later use.
      // Other statements can read this value to make decisions or perform work.
      const raced = await db.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(identity.email).first();
      // Checks a condition or selects a branch of the program.
      // The following block runs only when this branch's rule applies.
      if (!raced || !identity.emailVerified) throw new Error("Could not create a profile for this provider account");
      // Assigns a value to `volunteerId` for later use.
      // Other statements can read this value to make decisions or perform work.
      volunteerId = raced.id;
    // Defines or closes part of a structured data object or configuration block.
    // Its position and punctuation determine how the surrounding data is grouped.
    }
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await db.prepare("INSERT OR IGNORE INTO auth_profiles (volunteer_id, role) VALUES (?, ?)").bind(volunteerId, role).run();
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Performs or waits for an operation, often involving another service or resource.
  // The result is used by the surrounding code to continue the workflow.
  await db.prepare("INSERT INTO provider_accounts (provider, provider_subject, volunteer_id) VALUES (?, ?, ?)")
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    .bind(provider, identity.subject, volunteerId).run();
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return volunteerId;
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
async function handleCallback(context, forcedProvider = null) {
  // Assigns a value to `value` for later use.
  // Other statements can read this value to make decisions or perform work.
  const { request, env } = context;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!env.DB) return new Response("Authentication is temporarily unavailable.", { status: 503 });
  // Assigns a value to `url` for later use.
  // Other statements can read this value to make decisions or perform work.
  const url = new URL(request.url);
  // Assigns a value to `provider` for later use.
  // Other statements can read this value to make decisions or perform work.
  const provider = forcedProvider || context.params?.provider;
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!PROVIDERS.has(provider)) return new Response("Unknown sign-in provider.", { status: 404 });
  // Assigns a value to `base` for later use.
  // Other statements can read this value to make decisions or perform work.
  const base = baseUrlFor(request, env);
  // Declares a function or function-valued variable for a reusable operation.
  // The body defines what happens when this operation is called.
  const failure = (code) => {
    // Assigns a value to `target` for later use.
    // Other statements can read this value to make decisions or perform work.
    const target = new URL("/templates/login.html", base);
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    target.searchParams.set("error", code);
    // Assigns a value to `headers` for later use.
    // Other statements can read this value to make decisions or perform work.
    const headers = new Headers({ Location: target.toString(), "Cache-Control": "no-store" });
    // Starts a loop over items or while a condition remains true.
    // The indented or braced block performs the repeated work.
    for (const value of clearOAuthCookies(provider)) headers.append("Set-Cookie", value);
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return new Response(null, { status: 303, headers });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  };

  // Assigns a value to `value` for later use.
  // Other statements can read this value to make decisions or perform work.
  let params;
  // Assigns a value to `appleName` for later use.
  // Other statements can read this value to make decisions or perform work.
  let appleName = "";
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (request.method === "POST") {
    // Assigns a value to `form` for later use.
    // Other statements can read this value to make decisions or perform work.
    const form = await request.formData();
    // Assigns a value to `params` for later use.
    // Other statements can read this value to make decisions or perform work.
    params = new URLSearchParams();
    // Starts a loop over items or while a condition remains true.
    // The indented or braced block performs the repeated work.
    for (const key of ["code", "state", "error", "error_description"]) {
      // Assigns a value to `value` for later use.
      // Other statements can read this value to make decisions or perform work.
      const value = form.get(key);
      // Checks a condition or selects a branch of the program.
      // The following block runs only when this branch's rule applies.
      if (typeof value === "string") params.set(key, value);
    // Defines or closes part of a structured data object or configuration block.
    // Its position and punctuation determine how the surrounding data is grouped.
    }
    // Assigns a value to `userRaw` for later use.
    // Other statements can read this value to make decisions or perform work.
    const userRaw = form.get("user");
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (typeof userRaw === "string") {
      // Begins an error-handling section or its related handler.
      // This lets the program handle failures without silently ignoring them.
      try {
        // Assigns a value to `user` for later use.
        // Other statements can read this value to make decisions or perform work.
        const user = JSON.parse(userRaw);
        // Assigns a value to `appleName` for later use.
        // Other statements can read this value to make decisions or perform work.
        appleName = [user.name?.firstName, user.name?.lastName].filter((part) => typeof part === "string").join(" ").trim();
      // Defines or closes part of a structured data object or configuration block.
      // Its position and punctuation determine how the surrounding data is grouped.
      } catch { /* Apple name is optional and is only sent on first authorization. */ }
    // Defines or closes part of a structured data object or configuration block.
    // Its position and punctuation determine how the surrounding data is grouped.
    }
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } else params = url.searchParams;

  // Assigns a value to `code` for later use.
  // Other statements can read this value to make decisions or perform work.
  const code = params.get("code");
  // Assigns a value to `state` for later use.
  // Other statements can read this value to make decisions or perform work.
  const state = params.get("state");
  // Assigns a value to `savedState` for later use.
  // Other statements can read this value to make decisions or perform work.
  const savedState = readCookie(request, `vh_${provider}_state`);
  // Assigns a value to `nonce` for later use.
  // Other statements can read this value to make decisions or perform work.
  const nonce = readCookie(request, `vh_${provider}_nonce`);
  // Assigns a value to `verifier` for later use.
  // Other statements can read this value to make decisions or perform work.
  const verifier = readCookie(request, `vh_${provider}_verifier`);
  // Assigns a value to `role` for later use.
  // Other statements can read this value to make decisions or perform work.
  const role = readCookie(request, `vh_${provider}_role`) === "organizer" ? "organizer" : "volunteer";
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (params.get("error") || !code || !state || !savedState || state !== savedState || (provider === "apple" && !nonce) || (provider !== "apple" && !verifier)) return failure("provider_signin_failed");

  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  try {
    // Assigns a value to `secrets` for later use.
    // Other statements can read this value to make decisions or perform work.
    const secrets = getProviderSecrets(provider, env);
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (!secrets?.clientId || (provider !== "apple" && !secrets.clientSecret)) return failure("provider_not_configured");
    // Assigns a value to `callbackUrl` for later use.
    // Other statements can read this value to make decisions or perform work.
    const callbackUrl = `${base}/auth/${provider}/callback`;
    // Assigns a value to `tokens` for later use.
    // Other statements can read this value to make decisions or perform work.
    const tokens = await exchangeCode(provider, code, callbackUrl, verifier, env);
    // Assigns a value to `identity` for later use.
    // Other statements can read this value to make decisions or perform work.
    const identity = await getProviderIdentity(provider, tokens, nonce, env);
    // Assigns a value to `volunteerId` for later use.
    // Other statements can read this value to make decisions or perform work.
    const volunteerId = await getOrCreateProviderAccount(env.DB, provider, identity, role, appleName);
    // Assigns a value to `user` for later use.
    // Other statements can read this value to make decisions or perform work.
    const user = await env.DB.prepare("SELECT v.id, v.name, v.email, COALESCE(p.role, 'volunteer') AS role FROM volunteers v LEFT JOIN auth_profiles p ON p.volunteer_id = v.id WHERE v.id = ?")
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      .bind(volunteerId).first();
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (!user) throw new Error("Could not load the account profile");
    // Assigns a value to `sessionCookie` for later use.
    // Other statements can read this value to make decisions or perform work.
    const sessionCookie = await createSession(env.DB, volunteerId);
    // Assigns a value to `headers` for later use.
    // Other statements can read this value to make decisions or perform work.
    const headers = new Headers({ Location: `${base}/templates/dashboard.html`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    headers.append("Set-Cookie", sessionCookie);
    // Starts a loop over items or while a condition remains true.
    // The indented or braced block performs the repeated work.
    for (const value of clearOAuthCookies(provider)) headers.append("Set-Cookie", value);
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return new Response(null, { status: 303, headers });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } catch (error) {
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    console.error(`${provider} sign-in failed:`, error instanceof Error ? error.message : "unknown error");
    // Assigns a value to `message` for later use.
    // Other statements can read this value to make decisions or perform work.
    const message = error instanceof Error && error.message.includes("already exists") ? "account_exists" : "provider_signin_failed";
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return failure(message);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function completeOAuth(context) { return handleCallback(context); }
// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function completeGoogleOAuth(context) { return handleCallback(context, "google"); }
