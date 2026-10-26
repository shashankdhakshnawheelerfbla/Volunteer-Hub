// PLACEHOLDER ONLY: email/password registration is not implemented.
// TODO: validate input, rate-limit, hash password, and create account securely.
export async function onRequest() {
  return new Response("Registration is not implemented.", { status: 501 });
}
