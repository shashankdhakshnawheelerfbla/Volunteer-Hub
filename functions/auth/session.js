// PLACEHOLDER ONLY: session validation is not implemented.
// TODO: validate the session server-side and return only safe user fields.
export async function onRequest() {
  return new Response("Session lookup is not implemented.", { status: 501 });
}
