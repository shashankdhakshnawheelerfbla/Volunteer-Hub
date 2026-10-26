// PLACEHOLDER ONLY — Apple sign-in callback is not implemented.
// Validate state/nonce and verify Apple's signed identity token before
// creating a session.
export async function onRequest() {
  return new Response("Apple sign-in is not implemented.", { status: 501 });
}
