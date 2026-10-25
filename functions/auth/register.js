// Imports the named module or symbols so this file can use their functionality.
// This makes the referenced tools available to the code below.
import { createSession, enforceRateLimit, hashPassword, hasSameOrigin, json } from "./_auth.js";

// Declares a function or function-valued variable for a reusable operation.
// The body defines what happens when this operation is called.
export async function onRequestPost({ request, env }) {
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!env.DB) return json({ error: "Authentication is temporarily unavailable." }, 503);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!hasSameOrigin(request)) return json({ error: "Request origin could not be verified." }, 403);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!(request.headers.get("Content-Type") || "").toLowerCase().includes("application/json")) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return json({ error: "Expected a JSON request." }, 415);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (!(await enforceRateLimit(env.DB, request, "register", 8, 3600))) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return json({ error: "Too many sign-up attempts. Please wait and try again later." }, 429);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }

  // Assigns a value to `value` for later use.
  // Other statements can read this value to make decisions or perform work.
  let body;
  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  // Assigns a value to `name` for later use.
  // Other statements can read this value to make decisions or perform work.
  const name = typeof body.name === "string" ? body.name.trim() : "";
  // Assigns a value to `email` for later use.
  // Other statements can read this value to make decisions or perform work.
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  // Assigns a value to `password` for later use.
  // Other statements can read this value to make decisions or perform work.
  const password = typeof body.password === "string" ? body.password : "";
  // Assigns a value to `role` for later use.
  // Other statements can read this value to make decisions or perform work.
  const role = body.role === "organizer" ? "organizer" : "volunteer";
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (name.length < 2 || name.length > 100) return json({ error: "Enter a name between 2 and 100 characters." }, 400);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (password.length < 12 || new TextEncoder().encode(password).length > 1024) {
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return json({ error: "Your password must be at least 12 characters long." }, 400);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }

  // Assigns a value to `existing` for later use.
  // Other statements can read this value to make decisions or perform work.
  const existing = await env.DB.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(email).first();
  // Checks a condition or selects a branch of the program.
  // The following block runs only when this branch's rule applies.
  if (existing) return json({ error: "An account with that email already exists. Try signing in instead." }, 409);

  // Assigns a value to `passwordHash` for later use.
  // Other statements can read this value to make decisions or perform work.
  const passwordHash = await hashPassword(password);
  // Begins an error-handling section or its related handler.
  // This lets the program handle failures without silently ignoring them.
  try {
    // Assigns a value to `inserted` for later use.
    // Other statements can read this value to make decisions or perform work.
    const inserted = await env.DB.prepare("INSERT INTO volunteers (name, email) VALUES (?, ?)").bind(name, email).run();
    // Assigns a value to `volunteerId` for later use.
    // Other statements can read this value to make decisions or perform work.
    const volunteerId = inserted.meta?.last_row_id;
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (!volunteerId) throw new Error("Could not create account record");
    // Performs or waits for an operation, often involving another service or resource.
    // The result is used by the surrounding code to continue the workflow.
    await env.DB.batch([
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      env.DB.prepare("INSERT INTO password_credentials (volunteer_id, password_hash) VALUES (?, ?)").bind(volunteerId, passwordHash),
      // Executes the statement or expression written on this line.
      // It contributes to the behavior of this file at this point in the workflow.
      env.DB.prepare("INSERT INTO auth_profiles (volunteer_id, role) VALUES (?, ?)").bind(volunteerId, role),
    // Defines or closes part of a structured data object or configuration block.
    // Its position and punctuation determine how the surrounding data is grouped.
    ]);
    // Assigns a value to `sessionCookie` for later use.
    // Other statements can read this value to make decisions or perform work.
    const sessionCookie = await createSession(env.DB, volunteerId);
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return json({ success: true, user: { id: volunteerId, name, email, role } }, 201, { "Set-Cookie": sessionCookie });
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  } catch (error) {
    // If a duplicate registration raced this request, return a safe, user-facing message.
    // Assigns a value to `duplicate` for later use.
    // Other statements can read this value to make decisions or perform work.
    const duplicate = await env.DB.prepare("SELECT id FROM volunteers WHERE lower(email) = ? LIMIT 1").bind(email).first();
    // Checks a condition or selects a branch of the program.
    // The following block runs only when this branch's rule applies.
    if (duplicate) return json({ error: "An account with that email already exists. Try signing in instead." }, 409);
    // Executes the statement or expression written on this line.
    // It contributes to the behavior of this file at this point in the workflow.
    console.error("Registration failed:", error instanceof Error ? error.message : "unknown error");
    // Ends this path by returning a value or raising an error.
    // The caller or surrounding error handler can then respond appropriately.
    return json({ error: "We couldn't create your account right now. Please try again." }, 500);
  // Defines or closes part of a structured data object or configuration block.
  // Its position and punctuation determine how the surrounding data is grouped.
  }
// Defines or closes part of a structured data object or configuration block.
// Its position and punctuation determine how the surrounding data is grouped.
}
