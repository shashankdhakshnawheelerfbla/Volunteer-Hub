// Imports the named module or symbols so this file can use their functionality.
// This makes the referenced tools available to the code below.
import { getSession, json } from "./_auth.js";

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function onRequestGet({ request, env }) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!env.DB) return json({ error: "Authentication is temporarily unavailable." }, 503);
  // Assigns a value to `user` for later use.
  // Other statements can read this value to make decisions or perform work.
  const user = await getSession(request, env);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!user) return json({ authenticated: false }, 401);
  // Ends this path by returning a value or raising an error.
  // The caller or surrounding error handler can then respond appropriately.
  return json({ authenticated: true, user });
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}
