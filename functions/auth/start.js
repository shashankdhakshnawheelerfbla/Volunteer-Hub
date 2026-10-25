<<<<<<< HEAD
// Compatibility route: GET /auth/start starts the same Google OAuth flow as /auth/google/start.
// Keeping one implementation prevents mismatched state cookies and callback validation.
import { startOAuth } from "./_oauth.js";

export async function onRequestGet(context) {
  return startOAuth({ ...context, params: { ...(context.params || {}), provider: "google" } });
=======
// Converts random bytes into a URL-safe Base64 string for the OAuth state value.
// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
function base64UrlEncode(bytes) {
  // Starts an empty binary string for the byte conversion.
  // Each byte will be converted to a single character.
  // Assigns a value to `binary` for later use.
  // Other statements can read this value to make decisions or perform work.
  let binary = "";
  // Adds each byte to the binary string.
  // The loop processes the entire random byte array.
  // Starts a loop over items or while a condition remains true.
  // The indented or braced block performs the repeated work.
  for (const byte of bytes) binary += String.fromCharCode(byte);
  // Encodes the bytes as Base64 and converts it to URL-safe form.
  // URL-safe characters can be used in query parameters and cookies.
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return btoa(binary)
    // Replaces the standard Base64 plus sign with a URL-safe hyphen.
    // This avoids a character with special meaning in URLs.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    .replace(/\+/g, "-")
    // Replaces the standard Base64 slash with a URL-safe underscore.
    // This makes the encoded value safer to include in URLs.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    .replace(/\//g, "_")
    // Removes Base64 padding characters.
    // Padding is not needed for this URL-safe state value.
    // Sets or updates `.replace(/` using the expression on the right-hand side.
    // The assigned value is used by later logic or by the current configuration.
    .replace(/=+$/g, "");
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}

// Starts the Google OAuth sign-in flow.
// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function onRequestGet({ request, env }) {
  // Stops the flow when the Google client ID is not configured.
  // The client ID is required to identify the OAuth application.
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!env.GOOGLE_CLIENT_ID) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return new Response("Google sign-in is not configured.", { status: 500 });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Generates cryptographically secure random bytes for the OAuth state.
  // A random state value helps protect against cross-site request forgery.
  // Assigns a value to `stateBytes` for later use.
  // Other statements can read this value to make decisions or perform work.
  const stateBytes = crypto.getRandomValues(new Uint8Array(32));
  // Converts the random bytes into a compact URL-safe state string.
  // This value will be checked when Google redirects back.
  // Assigns a value to `state` for later use.
  // Other statements can read this value to make decisions or perform work.
  const state = base64UrlEncode(stateBytes);
  // Defines the callback URL registered with Google.
  // This must exactly match the OAuth redirect URI in Google Cloud Console.
  // Assigns a value to `redirectUri` for later use.
  // Other statements can read this value to make decisions or perform work.
  const redirectUri = "https://volunteer-hub-8iz.pages.dev/auth/google/callback";
  // Creates the Google OAuth authorization URL.
  // The browser will be redirected to this address to sign in.
  // Assigns a value to `googleUrl` for later use.
  // Other statements can read this value to make decisions or perform work.
  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  // Adds the OAuth parameters Google needs to begin sign-in.
  // URLSearchParams encodes the values for use in the query string.
  // Opens a block that groups related statements together.
  // The matching closing brace marks where this block ends.
  googleUrl.search = new URLSearchParams({
    // Identifies the Google OAuth application.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    client_id: env.GOOGLE_CLIENT_ID,
    // Tells Google where to return the authorization response.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    redirect_uri: redirectUri,
    // Requests the authorization-code flow.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    response_type: "code",
    // Requests identity, email, and profile information.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    scope: "openid email profile",
    // Includes the random value used to protect against request forgery.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    state
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }).toString();
  // Builds the redirect response headers.
  // These headers also prevent caching and save the state for callback validation.
  // Assigns a value to `headers` for later use.
  // Other statements can read this value to make decisions or perform work.
  const headers = new Headers({
    // Sends the browser to Google's authorization page.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    Location: googleUrl.toString(),
    // Prevents the OAuth redirect response from being cached.
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    "Cache-Control": "no-store",
    // Stores state in a secure, HTTP-only cookie for callback validation.
    // Sets or updates `"Set-Cookie": `google_oauth_state` using the expression on the right-hand side.
    // The assigned value is used by later logic or by the current configuration.
    "Set-Cookie": `google_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth/google; Max-Age=600`
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  });
  // Redirects the browser to Google to continue authentication.
  // HTTP status 302 instructs the browser to navigate to the Location URL.
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return new Response(null, { status: 302, headers });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
>>>>>>> adeaa21d954fbc6755d0d3cea722549360051eae
}
