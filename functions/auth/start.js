
function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function onRequestGet({ request, env }) {
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("Google sign-in is not configured.", {
      status: 500
    });
  }

  const stateBytes = crypto.getRandomValues(new Uint8Array(32));
  const state = base64UrlEncode(stateBytes);

  const redirectUri =
    "https://volunteer-hub-8iz.pages.dev/auth/google/callback";

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  googleUrl.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state
  }).toString();

  const headers = new Headers({
    Location: googleUrl.toString(),
    "Cache-Control": "no-store",
    "Set-Cookie":
      `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth/google; Max-Age=600`
  });

  return new Response(null, {
    status: 302,
    headers
  });
}
