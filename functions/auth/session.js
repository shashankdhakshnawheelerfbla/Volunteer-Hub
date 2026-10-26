// PLACEHOLDER ONLY — session lookup is not implemented.
// Validate the session server-side and return only safe user information.
export async function onRequest() {
  return new Response("Session lookup is not implemented.", { status: 501 });
}
