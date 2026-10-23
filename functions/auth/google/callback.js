// Defines a helper that redirects failed Google sign-ins back to the login page.
function redirectToLogin(message) {
  // Creates the login URL on the deployed Volunteer Hub site.
  const url = new URL("/index.html", "https://volunteer-hub-8iz.pages.dev");
  // Adds an error code so the login page can display a failure message.
  url.searchParams.set("error", message);
  // Sends the browser back to the login page.
  return Response.redirect(url.toString(), 302);
}

// Handles the GET request sent by Google after the OAuth authorization step.
export async function onRequestGet({ request, env }) {
  // Parses the callback request URL.
  const url = new URL(request.url);
  // Reads Google's authorization code from the callback.
  const code = url.searchParams.get("code");
  // Reads the OAuth state returned by Google.
  const state = url.searchParams.get("state");
  // Reads the state value saved in the browser cookie.
  const savedState = request.headers.get("Cookie")?.split("; ").find((cookie) => cookie.startsWith("google_oauth_state="))?.split("=")[1];
  // Rejects callbacks that are missing required values or fail the state check.
  if (!code || !state || !savedState || state !== savedState) return redirectToLogin("google_signin_failed");
  // Stops the flow if the required Google OAuth secrets are not configured.
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return new Response("Google sign-in is not configured.", { status: 500 });
  // Defines the callback URL registered with Google.
  const redirectUri = "https://volunteer-hub-8iz.pages.dev/auth/google/callback";
  // Exchanges Google's authorization code for OAuth tokens.
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    // Uses POST because Google's token endpoint expects form data.
    method: "POST",
    // Identifies the request body as URL-encoded form data.
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    // Sends the authorization code and OAuth client credentials.
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" })
  });
  // Redirects back to login if Google rejects the token exchange.
  if (!tokenResponse.ok) return redirectToLogin("google_token_exchange_failed");
  // Reads the token response returned by Google.
  const tokens = await tokenResponse.json();
  // Requires an ID token so the user's Google identity can be checked.
  if (!tokens.id_token) return redirectToLogin("google_identity_missing");
  // Asks Google to validate and decode the ID token.
  const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
  // Rejects an ID token that Google cannot validate.
  if (!verifyResponse.ok) return redirectToLogin("google_identity_invalid");
  // Reads the verified Google identity information.
  const identity = await verifyResponse.json();
  // Confirms the token belongs to this OAuth client and has a verified email identity.
  if (identity.aud !== env.GOOGLE_CLIENT_ID || identity.email_verified !== "true" || !identity.sub || !identity.email) return redirectToLogin("google_identity_invalid");
  // Explains that Google identity verification succeeded but session handling is missing.
  // The code intentionally does not claim the user is logged in until session creation is implemented.
  return new Response("Google identity verified. Session creation is not implemented yet.", {
    // Returns 501 because the login session portion is not implemented.
    status: 501,
    // Sets plain-text response metadata and prevents caching.
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });
}
