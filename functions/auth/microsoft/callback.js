// PLACEHOLDER ONLY — Microsoft OAuth callback is not implemented.
// Validate state, exchange the authorization code, and verify tokens/claims
// before creating a session.
export async function onRequest() {
  return new Response("Microsoft sign-in is not implemented.", { status: 501 });
}
