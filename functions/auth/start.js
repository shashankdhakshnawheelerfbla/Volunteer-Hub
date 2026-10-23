// Converts random bytes into a URL-safe Base64 string for the OAuth state value.
function base64UrlEncode(bytes) {
  // Starts an empty binary string for the byte conversion.
  // Each byte will be converted to a single character.
  let binary = "";
  // Adds each byte to the binary string.
  // The loop processes the entire random byte array.
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // Encodes the bytes as Base64 and converts it to URL-safe form.
  // URL-safe characters can be used in query parameters and cookies.
  return btoa(binary)
    // Replaces the standard Base64 plus sign with a URL-safe hyphen.
    // This avoids a character with special meaning in URLs.
    .replace(/\+/g, "-")
    // Replaces the standard Base64 slash with a URL-safe underscore.
    // This makes the encoded value safer to include in URLs.
    .replace(/\//g, "_")
    // Removes Base64 padding characters.
    // Padding is not needed for this URL-safe state value.
    .replace(/=+$/g, "");
}

// Starts the Google OAuth sign-in flow.
export async function onRequestGet({ request, env }) {
  // Stops the flow when the Google client ID is not configured.
  // The client ID is required to identify the OAuth application.
  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("Google sign-in is not configured.", { status: 500 });
  }
  // Generates cryptographically secure random bytes for the OAuth state.
  // A random state value helps protect against cross-site request forgery.
  const stateBytes = crypto.getRandomValues(new Uint8Array(32));
  // Converts the random bytes into a compact URL-safe state string.
  // This value will be checked when Google redirects back.
  const state = base64UrlEncode(stateBytes);
  // Defines the callback URL registered with Google.
  // This must exactly match the OAuth redirect URI in Google Cloud Console.
  const redirectUri = "https://volunteer-hub-8iz.pages.dev/auth/google/callback";
  // Creates the Google OAuth authorization URL.
  // The browser will be redirected to this address to sign in.
  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  // Adds the OAuth parameters Google needs to begin sign-in.
  // URLSearchParams encodes the values for use in the query string.
  googleUrl.search = new URLSearchParams({
    // Identifies the Google OAuth application.
    client_id: env.GOOGLE_CLIENT_ID,
    // Tells Google where to return the authorization response.
    redirect_uri: redirectUri,
    // Requests the authorization-code flow.
    response_type: "code",
    // Requests identity, email, and profile information.
    scope: "openid email profile",
    // Includes the random value used to protect against request forgery.
    state
  }).toString();
  // Builds the redirect response headers.
  // These headers also prevent caching and save the state for callback validation.
  const headers = new Headers({
    // Sends the browser to Google's authorization page.
    Location: googleUrl.toString(),
    // Prevents the OAuth redirect response from being cached.
    "Cache-Control": "no-store",
    // Stores state in a secure, HTTP-only cookie for callback validation.
    "Set-Cookie": `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth/google; Max-Age=600`
  });
  // Redirects the browser to Google to continue authentication.
  // HTTP status 302 instructs the browser to navigate to the Location URL.
  return new Response(null, { status: 302, headers });
}
