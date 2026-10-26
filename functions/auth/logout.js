// PLACEHOLDER ONLY — logout is not implemented.
// Invalidate the server-side session and clear the session cookie securely.
export async function onRequest() {
  return new Response("Logout is not implemented.", { status: 501 });
}
