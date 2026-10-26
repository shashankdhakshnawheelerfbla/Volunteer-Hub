// PLACEHOLDER ONLY: logout/session invalidation is not implemented.
// TODO: invalidate the server-side session and clear the session cookie.
export async function onRequest() {
  return new Response("Logout is not implemented.", { status: 501 });
}
