// Imports the named module or symbols so this file can use their functionality.
// This makes the referenced tools available to the code below.
import { clearSessionCookie, hasSameOrigin, json, readCookie, sha256Hex } from "./_auth.js";

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function onRequestPost({ request, env }) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!hasSameOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  // Assigns a value to `token` for later use.
  // Other statements can read this value to make decisions or perform work.
  const token = readCookie(request, "__Host-vh_session");
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (token && env.DB) {
    // Assigns a value to `tokenHash` for later use.
    // Other statements can read this value to make decisions or perform work.
    const tokenHash = await sha256Hex(token);
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await env.DB.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie() });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}
