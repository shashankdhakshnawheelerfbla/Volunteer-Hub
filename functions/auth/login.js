// PLACEHOLDER ONLY — login is not implemented.
// Add rate limiting, password-hash verification, generic failure messages,
// and secure server-side session creation before enabling this endpoint.
export async function onRequest() {
  return new Response("Login is not implemented.", { status: 501 });
}
