// PLACEHOLDER ONLY — registration is not implemented.
// Add validation, rate limiting, secure password hashing, duplicate-account
// handling, and safe session creation before enabling this endpoint.
export async function onRequest() {
  return new Response("Registration is not implemented.", { status: 501 });
}
