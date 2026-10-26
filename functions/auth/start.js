// PLACEHOLDER ONLY — OAuth start flow is not implemented.
// Implement a provider allowlist, state/nonce generation and storage,
// and an allowlisted redirect URI before enabling this endpoint.
export async function onRequest() {
  return new Response("OAuth sign-in is not implemented.", { status: 501 });
}
