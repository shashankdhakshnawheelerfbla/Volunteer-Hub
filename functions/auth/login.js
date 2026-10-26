// PLACEHOLDER ONLY: email/password login is not implemented.
// TODO: rate-limit, verify password hash, and create a secure server-side session.
export async function onRequest() {
  return new Response("Login is not implemented.", { status: 501 });
}
