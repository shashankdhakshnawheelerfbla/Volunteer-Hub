// PLACEHOLDER ONLY — Google OAuth callback is not implemented.
// Validate state, exchange the authorization code, and verify the ID token
// before creating a session. Never trust unverified profile data.
export async function onRequest() {
  return new Response("Google sign-in is not implemented.", { status: 501 });
}
